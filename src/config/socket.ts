import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import { getAllowedOrigins } from './security';

let io: Server;

function getAllowedSocketOrigins() {
  return getAllowedOrigins();
}

export interface SocketData {
  user: {
    id: string;
    email: string;
    role: string;
  };
}

export type AuthenticatedSocket = Socket<any, any, any, SocketData>;

/**
 * Initialize Socket.IO server
 */
export const initializeSocketIO = (httpServer: HttpServer): Server => {
  io = new Server(httpServer, {
    cors: {
      origin: getAllowedSocketOrigins(),
      credentials: true,
      methods: ['GET', 'POST'],
    },
    pingTimeout: 20000,
    pingInterval: 10000,
    transports: ['websocket', 'polling'],
    maxHttpBufferSize: 1e6, // 1MB
  });

  console.log('⚡ Socket.IO server initialized');
  return io;
};

/**
 * Get Socket.IO instance
 */
export const getIO = (): Server => {
  if (!io) {
    throw new Error('Socket.IO not initialized. Call initializeSocketIO first.');
  }
  return io;
};

/**
 * Graceful shutdown
 */
export const closeSocketIO = async (): Promise<void> => {
  if (io) {
    console.log('🛑 Closing Socket.IO connections...');
    io.disconnectSockets();
    io.close();
    console.log('🛑 Socket.IO closed');
  }
};

export { io };
