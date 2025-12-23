import { Role } from '@prisma/client';
import { getIO } from '../../config/socket';
import { prisma } from '../../shared/prisma';

/**
 * Socket Manager
 * Manages user-to-socket connections for real-time notifications
 */
class SocketManager {
  // Map userId to Set of socketIds (multi-device support)
  private userSockets: Map<string, Set<string>> = new Map();

  // Map socketId to userId (reverse lookup)
  private socketUsers: Map<string, string> = new Map();

  /**
   * Add a connection when user connects
   */
  async addConnection(userId: string, socketId: string): Promise<void> {
    try {
      // Add to maps
      if (!this.userSockets.has(userId)) {
        this.userSockets.set(userId, new Set());
      }
      this.userSockets.get(userId)!.add(socketId);
      this.socketUsers.set(socketId, userId);

      // Update database connection timestamp
      await prisma.userConnection.upsert({
        where: { userId },
        create: {
          userId,
          lastConnectedAt: new Date(),
        },
        update: {
          lastConnectedAt: new Date(),
        },
      });

      console.log(`✅ User ${userId} connected (socket: ${socketId})`);
    } catch (error) {
      console.error('Error adding connection:', error);
    }
  }

  /**
   * Remove a connection when user disconnects
   */
  async removeConnection(socketId: string): Promise<void> {
    try {
      const userId = this.socketUsers.get(socketId);

      if (!userId) return;

      // Remove from maps
      const sockets = this.userSockets.get(userId);
      if (sockets) {
        sockets.delete(socketId);
        if (sockets.size === 0) {
          this.userSockets.delete(userId);

          // Update last disconnected timestamp only when all sockets are gone
          await prisma.userConnection.update({
            where: { userId },
            data: {
              lastDisconnectedAt: new Date(),
            },
          });
        }
      }

      this.socketUsers.delete(socketId);
      console.log(`🔌 Socket ${socketId} disconnected (user: ${userId})`);
    } catch (error) {
      console.error('Error removing connection:', error);
    }
  }

  /**
   * Get all socket IDs for a user
   */
  getUserSockets(userId: string): string[] {
    const sockets = this.userSockets.get(userId);
    return sockets ? Array.from(sockets) : [];
  }

  /**
   * Check if user is currently online
   */
  isUserOnline(userId: string): boolean {
    const sockets = this.userSockets.get(userId);
    return sockets ? sockets.size > 0 : false;
  }

  /**
   * Get last disconnected timestamp from database
   */
  async getLastDisconnectedAt(userId: string): Promise<Date | null> {
    try {
      const connection = await prisma.userConnection.findUnique({
        where: { userId },
        select: { lastDisconnectedAt: true },
      });
      return connection?.lastDisconnectedAt || null;
    } catch (error) {
      console.error('Error getting last disconnected time:', error);
      return null;
    }
  }

  /**
   * Emit event to specific user (all their devices)
   */
  emitToUser(userId: string, event: string, data: any): boolean {
    const socketIds = this.getUserSockets(userId);

    if (socketIds.length === 0) {
      return false;
    }

    const io = getIO();
    socketIds.forEach((socketId) => {
      io.to(socketId).emit(event, data);
    });

    return true;
  }

  /**
   * Emit event to all users with specific role
   */
  async emitToRole(role: Role, event: string, data: any): Promise<number> {
    try {
      // Get all users with this role
      const users = await prisma.user.findMany({
        where: { role },
        select: { id: true },
      });

      let emittedCount = 0;
      const io = getIO();

      for (const user of users) {
        const socketIds = this.getUserSockets(user.id);
        if (socketIds.length > 0) {
          socketIds.forEach((socketId) => {
            io.to(socketId).emit(event, data);
          });
          emittedCount++;
        }
      }

      return emittedCount;
    } catch (error) {
      console.error('Error emitting to role:', error);
      return 0;
    }
  }

  /**
   * Emit event to all connected users
   */
  emitToAll(event: string, data: any): void {
    const io = getIO();
    io.emit(event, data);
  }

  /**
   * Get statistics
   */
  getStats(): { onlineUsers: number; totalConnections: number } {
    return {
      onlineUsers: this.userSockets.size,
      totalConnections: this.socketUsers.size,
    };
  }
}

// Export singleton instance
export const socketManager = new SocketManager();
