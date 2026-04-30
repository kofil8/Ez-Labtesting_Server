import { Socket } from 'socket.io';
import { ExtendedError } from 'socket.io/dist/namespace';
import config from '../../config';
import { prisma } from '../../shared/prisma';
import { jwtHelpers } from '../utils/jwtHelpers';

function parseCookieHeader(headerValue?: string) {
  const cookies: Record<string, string> = {};

  if (!headerValue) {
    return cookies;
  }

  for (const segment of headerValue.split(';')) {
    const [rawName, ...rawValueParts] = segment.trim().split('=');
    if (!rawName) {
      continue;
    }

    cookies[rawName] = decodeURIComponent(rawValueParts.join('=') || '');
  }

  return cookies;
}

function extractSocketToken(socket: Socket) {
  const handshakeAuthToken = socket.handshake.auth.token;
  if (typeof handshakeAuthToken === 'string' && handshakeAuthToken.trim()) {
    return handshakeAuthToken.trim();
  }

  const queryToken = socket.handshake.query.token;
  if (typeof queryToken === 'string' && queryToken.trim()) {
    return queryToken.trim();
  }

  const authorizationHeader = socket.handshake.headers.authorization;
  if (typeof authorizationHeader === 'string' && authorizationHeader.startsWith('Bearer ')) {
    return authorizationHeader.slice('Bearer '.length).trim();
  }

  const cookies = parseCookieHeader(socket.handshake.headers.cookie);
  if (typeof cookies.accessToken === 'string' && cookies.accessToken.trim()) {
    return cookies.accessToken.trim();
  }

  return null;
}

function extractSocketDeviceId(socket: Socket) {
  const authDeviceId = socket.handshake.auth.deviceId;
  if (typeof authDeviceId === 'string' && authDeviceId.trim()) {
    return authDeviceId.trim().slice(0, 128);
  }

  const queryDeviceId = socket.handshake.query.deviceId;
  if (typeof queryDeviceId === 'string' && queryDeviceId.trim()) {
    return queryDeviceId.trim().slice(0, 128);
  }

  const headerDeviceId = socket.handshake.headers['x-cart-device-id'];
  if (typeof headerDeviceId === 'string' && headerDeviceId.trim()) {
    return headerDeviceId.trim().slice(0, 128);
  }

  return undefined;
}

/**
 * Socket.IO authentication middleware
 * Verifies JWT token and attaches user data to socket
 */
export const socketAuth = async (socket: Socket, next: (err?: ExtendedError) => void) => {
  try {
    // Browser clients use cookie-based sessions, while non-browser clients may
    // still provide a bearer token explicitly via auth/query/header.
    const token = extractSocketToken(socket);

    if (!token) {
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
    socket.data.deviceId = extractSocketDeviceId(socket);

    console.log(`🔐 Socket authenticated: ${user.email} (${socket.id})`);
    next();
  } catch (error: any) {
    console.error('❌ Socket authentication error:', error.message);
    next(new Error('Authentication failed: ' + error.message));
  }
};
