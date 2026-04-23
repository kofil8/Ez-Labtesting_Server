import httpStatus from 'http-status';
import {
  SupportTicketReasonCode,
  SupportCategory,
  SupportPriority,
  SupportSenderType,
  SupportTicketStatus,
} from '@prisma/client';
import prisma from '../../../shared/prisma';
import ApiError from '../../errors/ApiErrors';
import { enqueueManualReviewEmail } from '../../queues/manualReviewEmail.queue';
import { orderService } from '../orders/orders.service';
import {
  AddMessageBody,
  CreateManualReviewTicketBody,
  CreateTicketBody,
  GetTicketsQuery,
  UpdateStatusBody,
} from './support.validation';

const supportRoles = new Set(['ADMIN', 'SUPER_ADMIN', 'LAB_PARTNER']);

const isSupportStaff = (role?: string) => supportRoles.has((role || '').toUpperCase());

const toSupportCategory = (value: CreateTicketBody['category']): SupportCategory => {
  const categoryMap: Record<CreateTicketBody['category'], SupportCategory> = {
    billing: SupportCategory.BILLING,
    technical: SupportCategory.TECHNICAL,
    results: SupportCategory.RESULTS,
    general: SupportCategory.GENERAL,
  };

  return categoryMap[value];
};

const toSupportPriority = (
  value: CreateTicketBody['priority'] | GetTicketsQuery['priority'],
): SupportPriority | undefined => {
  if (!value) return undefined;

  const priorityMap: Record<NonNullable<CreateTicketBody['priority']>, SupportPriority> = {
    low: SupportPriority.LOW,
    medium: SupportPriority.MEDIUM,
    high: SupportPriority.HIGH,
  };

  return priorityMap[value];
};

const toSupportTicketStatus = (
  value: UpdateStatusBody['status'] | GetTicketsQuery['status'],
): SupportTicketStatus | undefined => {
  if (!value) return undefined;

  const statusMap: Record<NonNullable<UpdateStatusBody['status']>, SupportTicketStatus> = {
    open: SupportTicketStatus.OPEN,
    in_progress: SupportTicketStatus.IN_PROGRESS,
    resolved: SupportTicketStatus.RESOLVED,
    closed: SupportTicketStatus.CLOSED,
  };

  return statusMap[value];
};

const toSupportSenderType = (isStaff: boolean): SupportSenderType =>
  isStaff ? SupportSenderType.ADMIN : SupportSenderType.CUSTOMER;

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
        category: toSupportCategory(payload.category),
        priority: toSupportPriority(payload.priority) || SupportPriority.MEDIUM,
        status: SupportTicketStatus.OPEN,
        reasonCode: SupportTicketReasonCode.GENERAL_REQUEST,
        responseTarget: getResponseTarget(payload.priority),
        messages: {
          create: {
            senderId: userId,
            senderType: toSupportSenderType(isSupportStaff(role)),
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

  async createManualReviewTicket(
    userId: string,
    role: string,
    payload: CreateManualReviewTicketBody,
  ) {
    const order = await prisma.order.findUnique({
      where: { id: payload.orderId },
      select: {
        id: true,
        userId: true,
        orderNumber: true,
        orderStatus: true,
        paymentStatus: true,
        labSubmissionErrorCode: true,
        labSubmissionErrorMessage: true,
      },
    });

    if (!order) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Order not found');
    }

    if (!isSupportStaff(role) && order.userId !== userId) {
      throw new ApiError(httpStatus.FORBIDDEN, 'Forbidden');
    }

    if (order.orderStatus !== 'LAB_SUBMISSION_FAILED') {
      throw new ApiError(
        httpStatus.CONFLICT,
        'Manual review can only be requested after a lab submission failure',
      );
    }

    await orderService.requestManualReview(order.id, userId, payload.notes || payload.reason);

    const ticket = await prisma.supportTicket.create({
      data: {
        ticketNumber: createTicketNumber(),
        userId,
        orderId: order.id,
        subject: `Manual review request for order ${order.orderNumber}`,
        category: SupportCategory.ORDER,
        priority: SupportPriority.HIGH,
        status: SupportTicketStatus.AWAITING_ADMIN,
        reasonCode: SupportTicketReasonCode.ADMIN_REVIEW_REQUEST,
        notes: payload.notes || null,
        failureContextJson: {
          reason: payload.reason,
          labSubmissionErrorCode: order.labSubmissionErrorCode,
          labSubmissionErrorMessage: order.labSubmissionErrorMessage,
          orderStatus: order.orderStatus,
          paymentStatus: order.paymentStatus,
        },
        manualReviewRequestedAt: new Date(),
        responseTarget: getResponseTarget('high'),
        messages: {
          create: {
            senderId: userId,
            senderType: toSupportSenderType(isSupportStaff(role)),
            message: payload.notes || payload.reason,
          },
        },
      },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    await enqueueManualReviewEmail({
      orderId: order.id,
      orderNumber: order.orderNumber,
      ticketId: ticket.id,
      ticketNumber: ticket.ticketNumber,
      reason: payload.reason,
      requestedByUserId: userId,
    });

    return ticket;
  }

  async listTickets(currentUserId: string, role: string, query: GetTicketsQuery) {
    const { page = 1, limit = 20, priority, status } = query;
    const skip = (page - 1) * limit;

    const where: any = {
      ...(priority ? { priority: toSupportPriority(priority) } : {}),
      ...(status ? { status: toSupportTicketStatus(status) } : {}),
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
            select: { id: true, orderStatus: true, paymentStatus: true, accessOrderId: true },
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
          select: {
            id: true,
            orderStatus: true,
            paymentStatus: true,
            accessOrderId: true,
            requisitionPdfUrl: true,
          },
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

    const statusToSet =
      ticket.status === SupportTicketStatus.CLOSED ? SupportTicketStatus.IN_PROGRESS : ticket.status;
    const shouldSetRespondedAt = supportStaff && !ticket.respondedAt;

    const [message] = await prisma.$transaction([
      prisma.supportMessage.create({
        data: {
          ticketId,
          senderId: currentUserId,
          senderType: toSupportSenderType(supportStaff),
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
      status: toSupportTicketStatus(payload.status),
    };

    if (
      payload.status === 'resolved' ||
      payload.status === 'closed'
    ) {
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
        senderType: SupportSenderType.ADMIN,
        message: `Ticket status updated to ${payload.status}`,
      },
    });

    return updated;
  }
}

export const supportService = new SupportService();
