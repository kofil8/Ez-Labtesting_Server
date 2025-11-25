import { createAdapter } from '@socket.io/redis-adapter';
import { Server as HttpServer } from 'http';
import { createClient } from 'redis';
import { Server, Socket } from 'socket.io';
import { jwtHelpers } from '../app/utils/jwtHelpers';
import config from '@/config';

let io: Server | null = null;

export async function initSocket(server: HttpServer) {
  if (io) return io;

  io = new Server(server, {
    cors: {
      origin: config.frontend_url || '*',
      credentials: true,
    },
  });

  const redisUrl = process.env.REDIS_URL || config.redis_url;

  if (redisUrl) {
    const pubClient = createClient({ url: redisUrl });
    const subClient = pubClient.duplicate();

    await pubClient.connect();
    await subClient.connect();

    io.adapter(createAdapter(pubClient, subClient));
    console.log('[socket] Redis adapter connected');

    // Listen to notifications channel
    await subClient.subscribe('notifications', (message) => {
      try {
        const parsed = JSON.parse(message);
        const { to, event, payload } = parsed;

        if (io && to) {
          io.to(to).emit(event || 'notification', payload || {});
        }
      } catch (err) {
        console.error('[socket] failed to parse pubsub message', err);
      }
    });

    console.log('[socket] Subscribed to Redis notifications channel');
  }

  // JWT Auth Middleware
  io.use((socket: Socket, next) => {
    try {
      const token =
        socket.handshake.auth?.token || socket.handshake.headers?.authorization?.split(' ')[1];

      if (!token) return next(new Error('Authentication error: token missing'));

      const payload = jwtHelpers.verifyToken(
        token,
        process.env.JWT_SECRET || config.jwt.jwt_secret,
      );

      socket.data.user = payload;
      return next();
    } catch (err) {
      return next(new Error('Authentication error'));
    }
  });

  // socket connection
  io.on('connection', (socket) => {
    const user = socket.data.user;

    if (user?.id) {
      const room = `user:${user.id}`;
      socket.join(room);
      console.log(`[socket] user joined ${room}`);
    }

    socket.on('disconnect', () => {
      console.log('[socket] user disconnected:', socket.id);
    });
  });

  return io;
}

// Helper to emit manually
export function emitToUser(userId: string | number, event: string, payload: any) {
  if (!io) return;
  io.to(`user:${userId}`).emit(event, payload);
}
