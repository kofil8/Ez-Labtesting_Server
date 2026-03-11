import { Role } from '@prisma/client';
import { Server } from 'socket.io';
import { AuthenticatedSocket } from '../../../config/socket';
import { socketAuth } from '../../middlewares/socketAuth';
import { orderService } from './orders.service';

type SubscribePayload = {
  orderId?: string;
};

export const initOrderTrackingSocket = (io: Server): void => {
  const orderNamespace = io.of('/orders');

  orderNamespace.use(socketAuth as any);

  orderNamespace.on('connection', (socket: AuthenticatedSocket) => {
    const userId = socket.data.user.id;
    const userRole = socket.data.user.role;

    socket.on('order:subscribe', async (payload: SubscribePayload = {}) => {
      try {
        const { orderId } = payload;

        if (!orderId) {
          socket.emit('order:error', { message: 'orderId is required' });
          return;
        }

        const order = await orderService.getOrderById(orderId);
        const isAdmin = userRole === Role.ADMIN || userRole === Role.SUPER_ADMIN;

        if (!isAdmin && order.userId !== userId) {
          socket.emit('order:error', { message: 'Forbidden' });
          return;
        }

        socket.join(`order:${orderId}`);
        const trackingStatus = await orderService.getOrderWithTrackingStatus(orderId);
        socket.emit('order:tracking-update', trackingStatus);
      } catch (error) {
        socket.emit('order:error', {
          message: error instanceof Error ? error.message : 'Failed to subscribe to order',
        });
      }
    });

    socket.on('order:unsubscribe', (payload: SubscribePayload = {}) => {
      const { orderId } = payload;
      if (!orderId) return;
      socket.leave(`order:${orderId}`);
    });

    socket.on('order:fetch-tracking', async (payload: SubscribePayload = {}) => {
      try {
        const { orderId } = payload;

        if (!orderId) {
          socket.emit('order:error', { message: 'orderId is required' });
          return;
        }

        const order = await orderService.getOrderById(orderId);
        const isAdmin = userRole === Role.ADMIN || userRole === Role.SUPER_ADMIN;

        if (!isAdmin && order.userId !== userId) {
          socket.emit('order:error', { message: 'Forbidden' });
          return;
        }

        const trackingStatus = await orderService.getOrderWithTrackingStatus(orderId);
        socket.emit('order:tracking-update', trackingStatus);
      } catch (error) {
        socket.emit('order:error', {
          message: error instanceof Error ? error.message : 'Failed to fetch tracking',
        });
      }
    });
  });

  console.log('✅ Order tracking socket events initialized on namespace /orders');
};
