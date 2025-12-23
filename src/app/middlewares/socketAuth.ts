import { Socket } from 'socket.io';
import { ExtendedError } from 'socket.io/dist/namespace';
import config from '../../config';
import { prisma } from '../../shared/prisma';
import { jwtHelpers } from '../utils/jwtHelpers';

/**
 * Socket.IO authentication middleware
 * Verifies JWT token and attaches user data to socket
 */
export const socketAuth = async (socket: Socket, next: (err?: ExtendedError) => void) => {
  try {
    // Extract token from handshake auth or query
    const token = socket.handshake.auth.token || socket.handshake.query.token;

    if (!token || typeof token !== 'string') {
      return next(new Error('Authentication failed: No token provided'));
    }

    // Verify JWT token
    const decoded = jwtHelpers.verifyToken(token, config.jwt.jwt_secret);

    if (!decoded || !decoded.id) {
      return next(new Error('Authentication failed: Invalid token'));
    }

    // Fetch user from database
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        email: true,
        role: true,
        isVerified: true,
      },
    });

    if (!user) {
      return next(new Error('Authentication failed: User not found'));
    }

    if (!user.isVerified) {
      return next(new Error('Authentication failed: User not verified'));
    }

    // Attach user to socket data
    socket.data.user = {
      id: user.id,
      email: user.email,
      role: user.role,
    };

    console.log(`🔐 Socket authenticated: ${user.email} (${socket.id})`);
    next();
  } catch (error: any) {
    console.error('❌ Socket authentication error:', error.message);
    next(new Error('Authentication failed: ' + error.message));
  }
};
