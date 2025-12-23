const prismaMock = {
  user: { findUnique: jest.fn() },
  notificationTemplate: { findUnique: jest.fn() },
  notification: { create: jest.fn(), update: jest.fn() },
  pushToken: { findMany: jest.fn() },
};

// Mock PrismaClient before importing the service
jest.mock('@prisma/client', () => {
  const actual = jest.requireActual('@prisma/client');
  return {
    ...actual,
    PrismaClient: jest.fn(() => prismaMock),
  };
});

import { NotificationType } from '@prisma/client';
import { NotificationService } from '../notifications.service';

// Manual mocks for other dependencies
jest.mock('../../../../config/queue', () => ({
  notificationQueue: { add: jest.fn() },
  fcmQueue: { add: jest.fn() },
  emailQueue: { add: jest.fn() },
}));

jest.mock('../../../helpers/socketManager', () => ({
  socketManager: {
    isUserOnline: jest.fn(),
    emitToUser: jest.fn(),
  },
}));

jest.mock('../../../../lib/firebaseAdmin', () => ({
  getFirebaseAdmin: () => ({ messaging: () => ({ send: jest.fn() }) }),
}));

jest.mock('../../../utils/logger', () => ({
  __esModule: true,
  default: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

// Load mocks after declarations
const { notificationQueue, fcmQueue, emailQueue } = jest.requireMock('../../../../config/queue');
const { socketManager } = jest.requireMock('../../../helpers/socketManager');
let prisma = prismaMock;

const templateVars = [{ name: 'name', description: 'User name' }];

const baseTemplate = {
  type: NotificationType.RESULTS_READY,
  isActive: true,
  emailSubject: 'Subject {{name}}',
  emailBody: 'Email body {{name}}',
  pushTitle: 'Push title {{name}}',
  pushBody: 'Push body {{name}}',
  variables: templateVars,
};

describe('NotificationService.sendNotification', () => {
  beforeEach(() => {
    (notificationQueue.add as jest.Mock).mockReset();
    (fcmQueue.add as jest.Mock).mockReset();
    (emailQueue.add as jest.Mock).mockReset();
    (socketManager.isUserOnline as jest.Mock).mockReset();
    (socketManager.emitToUser as jest.Mock).mockReset();
    prisma.user.findUnique.mockReset();
    prisma.notificationTemplate.findUnique.mockReset();
    prisma.notification.create.mockReset();
    prisma.notification.update.mockReset();
    prisma.pushToken.findMany.mockReset();

    prisma.user.findUnique.mockResolvedValue({
      id: 'user-1',
      email: 'user@example.com',
      role: 'CUSTOMER',
    });

    prisma.notificationTemplate.findUnique.mockResolvedValue(baseTemplate);

    prisma.notification.create.mockResolvedValue({
      id: 'notif-1',
      deliveredVia: [],
    });

    prisma.notification.update.mockResolvedValue({});

    prisma.pushToken.findMany.mockResolvedValue([{ token: 'fcm-token', revoked: false }]);
  });

  it('queues FCM and email when user is offline and notification is critical', async () => {
    socketManager.isUserOnline.mockReturnValue(false);

    await NotificationService.sendNotification('user-1', NotificationType.RESULTS_READY, {
      name: 'John',
    });

    expect(prisma.notification.create).toHaveBeenCalledTimes(1);

    // FCM queued
    expect(fcmQueue.add).toHaveBeenCalledWith(
      expect.objectContaining({
        token: 'fcm-token',
        notification: { title: 'Push title John', body: 'Push body John' },
      }),
      expect.objectContaining({ attempts: 3 }),
    );

    // Email queued
    expect(emailQueue.add).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'user@example.com',
        subject: 'Subject John',
        html: 'Email body John',
      }),
      expect.any(Object),
    );

    // No socket emit
    expect(socketManager.emitToUser).not.toHaveBeenCalled();
  });

  it('emits via socket when user is online and skips FCM queue', async () => {
    socketManager.isUserOnline.mockReturnValue(true);

    await NotificationService.sendNotification('user-1', NotificationType.RESULTS_READY, {
      name: 'Jane',
    });

    // Socket emit
    expect(socketManager.emitToUser).toHaveBeenCalledWith(
      'user-1',
      'notification:new',
      expect.objectContaining({ title: 'Push title Jane' }),
    );

    // No FCM queued because user online
    expect(fcmQueue.add).not.toHaveBeenCalled();

    // Email still queued because high priority
    expect(emailQueue.add).toHaveBeenCalled();
  });
});
