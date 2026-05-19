import { SupportSenderType } from '@prisma/client';
import { Server } from 'socket.io';
import { AuthenticatedSocket } from '../../../config/socket';
import prisma from '../../../shared/prisma';
import { socketManager } from '../../helpers/socketManager';
import { socketAuth } from '../../middlewares/socketAuth';
import logger from '../../utils/logger';
import { supportService } from './support.service';

const supportRoles = new Set(['ADMIN', 'SUPER_ADMIN', 'LAB_PARTNER']);

const isSupportStaff = (role?: string) => supportRoles.has((role || '').toUpperCase());

interface SendMessagePayload {
  ticketId: string;
  message: string;
}

interface TypingPayload {
  ticketId: string;
  isTyping: boolean;
}

/**
 * Initialize Socket.IO support chat events
 */
export const initSupportSocket = (io: Server): void => {
  // Apply authentication middleware
  io.use(socketAuth);

  io.on('connection', async (socket: AuthenticatedSocket) => {
    const userId = socket.data.user.id;
    const userEmail = socket.data.user.email;
    const userRole = socket.data.user.role;

    try {
      logger.info(`🔌 Support socket connected: ${userEmail} (${socket.id})`);

      /**
       * Join a ticket room for real-time updates
       */
      socket.on('support:join-ticket', async (ticketId: string) => {
        try {
          // Verify user has access to this ticket
          const ticket = await supportService.getTicketById(ticketId, userId, userRole);

          if (!ticket) {
            socket.emit('support:error', {
              type: 'access-denied',
              message: 'You do not have access to this ticket',
            });
            return;
          }

          // Join the ticket-specific room
          const roomName = `ticket:${ticketId}`;
          await socket.join(roomName);

          socket.emit('support:joined-ticket', {
            ticketId,
            roomName,
          });

          logger.info(`👤 User ${userEmail} joined ticket room: ${roomName}`);
        } catch (error) {
          logger.error('Error joining ticket room:', error);
          socket.emit('support:error', {
            type: 'join-error',
            message: 'Failed to join ticket room',
          });
        }
      });

      /**
       * Leave a ticket room
       */
      socket.on('support:leave-ticket', async (ticketId: string) => {
        try {
          const roomName = `ticket:${ticketId}`;
          await socket.leave(roomName);

          socket.emit('support:left-ticket', {
            ticketId,
            roomName,
          });

          logger.info(`👤 User ${userEmail} left ticket room: ${roomName}`);
        } catch (error) {
          logger.error('Error leaving ticket room:', error);
        }
      });

      /**
       * Send a message to a ticket
       */
      socket.on('support:send-message', async (payload: SendMessagePayload) => {
        try {
          const { ticketId, message } = payload;

          if (!ticketId || !message || !message.trim()) {
            socket.emit('support:error', {
              type: 'invalid-message',
              message: 'Ticket ID and message are required',
            });
            return;
          }

          // Add message via service (saves to DB)
          const newMessage = await supportService.addMessage(ticketId, userId, userRole, {
            message: message.trim(),
          });

          // Get full message with sender info
          const fullMessage = await prisma.supportMessage.findUnique({
            where: { id: newMessage.id },
            include: {
              sender: {
                select: { id: true, firstName: true, lastName: true, email: true, role: true },
              },
            },
          });

          // Get updated ticket
          const ticket = await prisma.supportTicket.findUnique({
            where: { id: ticketId },
            select: {
              id: true,
              userId: true,
              status: true,
              updatedAt: true,
            },
          });

          const roomName = `ticket:${ticketId}`;
          const isStaff = isSupportStaff(userRole);

          const messageData = {
            id: fullMessage?.id,
            ticketId,
            senderId: userId,
            senderType: isStaff ? SupportSenderType.ADMIN : SupportSenderType.CUSTOMER,
            sender: fullMessage?.sender || {
              id: userId,
              firstName: '',
              lastName: '',
              email: userEmail,
              role: userRole,
            },
            message: message.trim(),
            createdAt: fullMessage?.createdAt || new Date(),
          };

          // Broadcast to all users in the ticket room (including sender)
          io.to(roomName).emit('support:new-message', messageData);

          // Also update the ticket status for all room members
          io.to(roomName).emit('support:ticket-updated', {
            ticketId,
            status: ticket?.status,
            updatedAt: ticket?.updatedAt,
          });

          // Notify ticket owner if they're not in the room
          const ticketOwnerId = ticket?.userId;
          if (ticketOwnerId && ticketOwnerId !== userId) {
            const ownerSockets = socketManager.getUserSockets(ticketOwnerId);
            if (ownerSockets.length > 0) {
              ownerSockets.forEach((socketId) => {
                io.to(socketId).emit('support:ticket-message-notification', {
                  ticketId,
                  messagePreview: message.trim().substring(0, 100),
                  from: isStaff ? 'Support Team' : 'Customer',
                });
              });
            }
          }

          logger.info(`💬 Message sent in ticket ${ticketId} by ${userEmail}`);
        } catch (error) {
          logger.error('Error sending support message:', error);
          socket.emit('support:error', {
            type: 'send-error',
            message: 'Failed to send message',
          });
        }
      });

      /**
       * Typing indicator
       */
      socket.on('support:typing', (payload: TypingPayload) => {
        try {
          const { ticketId, isTyping } = payload;
          const roomName = `ticket:${ticketId}`;

          // Broadcast typing status to others in the room (not sender)
          socket.to(roomName).emit('support:user-typing', {
            ticketId,
            userId,
            userEmail,
            isTyping,
          });
        } catch (error) {
          logger.error('Error handling typing indicator:', error);
        }
      });

      /**
       * Socket disconnect handler
       */
      socket.on('disconnect', () => {
        try {
          logger.info(`🔌 Support socket disconnected: ${userEmail} (${socket.id})`);
        } catch (error) {
          logger.error('Error handling support socket disconnect:', error);
        }
      });

      /**
       * Socket error handler
       */
      socket.on('error', (error) => {
        logger.error(`❌ Support socket error for user ${userId}:`, error);
      });
    } catch (error) {
      logger.error(`❌ Error in support socket connection handler:`, error);
      socket.disconnect();
    }
  });

  logger.info('✅ Support socket events initialized');
};

/**
 * Emit a message to a specific ticket room (for server-side use)
 */
export const emitToTicketRoom = (io: Server, ticketId: string, event: string, data: any): void => {
  const roomName = `ticket:${ticketId}`;
  io.to(roomName).emit(event, data);
};
