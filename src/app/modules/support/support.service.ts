import httpStatus from 'http-status';
import prisma from '../../../shared/prisma';
import ApiError from '../../errors/ApiErrors';
import {
  AddMessageBody,
  CreateTicketBody,
  GetTicketsQuery,
  UpdateStatusBody,
} from './support.validation';

const supportRoles = new Set(['ADMIN', 'SUPER_ADMIN', 'LAB_PARTNER']);

const isSupportStaff = (role?: string) => supportRoles.has((role || '').toUpperCase());

const getResponseTarget = (priority: 'low' | 'medium' | 'high') => {
  const now = Date.now();
  const hours = priority === 'high' ? 2 : priority === 'medium' ? 8 : 24;
  return new Date(now + hours * 60 * 60 * 1000);
};

const createTicketNumber = () => {
  const epoch = Date.now().toString().slice(-8);
  const suffix = Math.floor(Math.random() * 1000)
    .toString()
    .padStart(3, '0');
  return `SUP-${epoch}-${suffix}`;
};

class SupportService {
  async createTicket(userId: string, role: string, payload: CreateTicketBody) {
    if (payload.orderId) {
      const order = await prisma.order.findUnique({
        where: { id: payload.orderId },
        select: { id: true, userId: true },
      });

      if (!order) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Order not found');
      }

      if (!isSupportStaff(role) && order.userId !== userId) {
        throw new ApiError(httpStatus.FORBIDDEN, 'Forbidden');
      }
    }

    const ticket = await prisma.supportTicket.create({
      data: {
        ticketNumber: createTicketNumber(),
        userId,
        orderId: payload.orderId,
        subject: payload.subject,
        category: payload.category,
        priority: payload.priority,
        status: 'open',
        responseTarget: getResponseTarget(payload.priority),
        messages: {
          create: {
            senderId: userId,
            senderType: isSupportStaff(role) ? 'support' : 'customer',
            message: payload.message,
          },
        },
      },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    return ticket;
  }

  async listTickets(currentUserId: string, role: string, query: GetTicketsQuery) {
    const { page = 1, limit = 20, priority, status } = query;
    const skip = (page - 1) * limit;

    const where: any = {
      ...(priority ? { priority } : {}),
      ...(status ? { status } : {}),
    };

    if (!isSupportStaff(role)) {
      where.userId = currentUserId;
    }

    const [tickets, total] = await Promise.all([
      prisma.supportTicket.findMany({
        where,
        include: {
          user: {
            select: { id: true, firstName: true, lastName: true, email: true },
          },
          messages: {
            orderBy: { createdAt: 'asc' },
            take: 1,
          },
          order: {
            select: { id: true, status: true, accessOrderId: true },
          },
        },
        orderBy: { updatedAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.supportTicket.count({ where }),
    ]);

    return {
      data: tickets,
      meta: {
        page,
        limit,
        total,
        totalPage: Math.ceil(total / limit),
      },
    };
  }

  async getTicketById(ticketId: string, currentUserId: string, role: string) {
    const ticket = await prisma.supportTicket.findUnique({
      where: { id: ticketId },
      include: {
        user: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        order: {
          select: { id: true, status: true, accessOrderId: true, requisitionPdfUrl: true },
        },
        messages: {
          orderBy: { createdAt: 'asc' },
          include: {
            sender: {
              select: { id: true, firstName: true, lastName: true, email: true, role: true },
            },
          },
        },
      },
    });

    if (!ticket) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Support ticket not found');
    }

    if (!isSupportStaff(role) && ticket.userId !== currentUserId) {
      throw new ApiError(httpStatus.FORBIDDEN, 'Forbidden');
    }

    return ticket;
  }

  async addMessage(ticketId: string, currentUserId: string, role: string, payload: AddMessageBody) {
    const ticket = await prisma.supportTicket.findUnique({
      where: { id: ticketId },
      select: { id: true, userId: true, status: true, respondedAt: true },
    });

    if (!ticket) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Support ticket not found');
    }

    const supportStaff = isSupportStaff(role);

    if (!supportStaff && ticket.userId !== currentUserId) {
      throw new ApiError(httpStatus.FORBIDDEN, 'Forbidden');
    }

    const statusToSet = ticket.status === 'closed' ? 'in_progress' : ticket.status;
    const shouldSetRespondedAt = supportStaff && !ticket.respondedAt;

    const [message] = await prisma.$transaction([
      prisma.supportMessage.create({
        data: {
          ticketId,
          senderId: currentUserId,
          senderType: supportStaff ? 'support' : 'customer',
          message: payload.message,
        },
      }),
      prisma.supportTicket.update({
        where: { id: ticketId },
        data: {
          status: statusToSet,
          ...(shouldSetRespondedAt ? { respondedAt: new Date() } : {}),
        },
      }),
    ]);

    return message;
  }

  async updateStatus(
    ticketId: string,
    currentUserId: string,
    role: string,
    payload: UpdateStatusBody,
  ) {
    const supportStaff = isSupportStaff(role);
    if (!supportStaff) {
      throw new ApiError(httpStatus.FORBIDDEN, 'Only support staff can update ticket status');
    }

    const ticket = await prisma.supportTicket.findUnique({
      where: { id: ticketId },
      select: { id: true, status: true },
    });

    if (!ticket) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Support ticket not found');
    }

    const nextData: Record<string, unknown> = {
      status: payload.status,
    };

    if (payload.status === 'resolved' || payload.status === 'closed') {
      nextData.resolvedAt = new Date();
    }

    const updated = await prisma.supportTicket.update({
      where: { id: ticketId },
      data: nextData,
      include: {
        user: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
    });

    await prisma.supportMessage.create({
      data: {
        ticketId,
        senderId: currentUserId,
        senderType: 'support',
        message: `Ticket status updated to ${payload.status}`,
      },
    });

    return updated;
  }
}

export const supportService = new SupportService();
