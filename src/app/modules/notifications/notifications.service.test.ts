const mockFcmQueue = {
  add: jest.fn(),
};

const mockEmailQueue = {
  add: jest.fn(),
};

const mockNotificationQueue = {
  process: jest.fn(),
  on: jest.fn(),
};

const mockPrisma = {
  notification: {
    findUnique: jest.fn(),
    update: jest.fn(),
    count: jest.fn(),
  },
  pushToken: {
    findMany: jest.fn(),
    updateMany: jest.fn(),
  },
  user: {
    findUnique: jest.fn(),
  },
};

const mockSocketManager = {
  emitToUser: jest.fn(),
  isUserOnline: jest.fn(),
};

const mockFirebaseSend = jest.fn();

jest.mock('../../../config/queue', () => ({
  fcmQueue: mockFcmQueue,
  emailQueue: mockEmailQueue,
  notificationQueue: mockNotificationQueue,
}));

jest.mock('../../../shared/prisma', () => ({
  __esModule: true,
  default: mockPrisma,
  prisma: mockPrisma,
}));

jest.mock('../../../lib/firebaseAdmin', () => ({
  getFirebaseAdmin: jest.fn(() => ({
    messaging: () => ({
      send: mockFirebaseSend,
    }),
  })),
  getFirebaseMessaging: jest.fn(() => ({
    send: mockFirebaseSend,
  })),
}));

jest.mock('../../helpers/socketManager', () => ({
  socketManager: mockSocketManager,
}));

jest.mock('../../../config/redis', () => ({
  __esModule: true,
  default: {
    incr: jest.fn(),
    expire: jest.fn(),
  },
}));

jest.mock('../../utils/emailSender', () => jest.fn());

jest.mock('../../utils/logger', () => ({
  __esModule: true,
  default: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

import { processFCMNotification } from '../../helpers/notificationQueue.processor';
import { NotificationService } from './notifications.service';

const createNotification = (overrides: Record<string, unknown> = {}) =>
  ({
    id: 'notification-1',
    userId: 'user-1',
    type: 'ORDER_CREATED',
    title: 'Order Created',
    body: 'Your order was created',
    data: {
      orderId: 'EZ-123',
      amount: 42,
      nested: { ok: true },
    },
    priority: 'MEDIUM',
    isRead: false,
    readAt: null,
    deliveredVia: [],
    sentAt: new Date('2026-04-26T01:00:00.000Z'),
    expiresAt: new Date('2026-07-26T01:00:00.000Z'),
    createdAt: new Date('2026-04-26T01:00:00.000Z'),
    ...overrides,
  }) as any;

describe('NotificationService delivery pipeline', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.FRONTEND_URL = 'https://ezlabtesting.com';
  });

  it('serializes FCM data as strings with required notification fields', () => {
    const data = NotificationService.buildFcmData(createNotification());

    expect(data).toMatchObject({
      notificationId: 'notification-1',
      userId: 'user-1',
      type: 'ORDER_CREATED',
      priority: 'MEDIUM',
      orderId: 'EZ-123',
      amount: '42',
      nested: '{"ok":true}',
      clickAction: '/results/EZ-123',
      createdAt: '2026-04-26T01:00:00.000Z',
      sentAt: '2026-04-26T01:00:00.000Z',
    });
  });

  it('emits realtime and queues FCM even when the user is online', async () => {
    mockSocketManager.emitToUser.mockReturnValue(true);
    mockPrisma.notification.findUnique.mockResolvedValue({ deliveredVia: [] });
    mockPrisma.notification.update.mockResolvedValue({});
    mockPrisma.notification.count.mockResolvedValue(3);
    mockPrisma.pushToken.findMany.mockResolvedValue([{ token: 'token-1' }]);

    await NotificationService.dispatchNotification(createNotification(), null);

    expect(mockSocketManager.emitToUser).toHaveBeenCalledWith(
      'user-1',
      'notification:new',
      expect.objectContaining({
        id: 'notification-1',
        userId: 'user-1',
        type: 'ORDER_CREATED',
        isRead: false,
      }),
    );
    expect(mockFcmQueue.add).toHaveBeenCalledWith(
      expect.objectContaining({
        token: 'token-1',
        notificationId: 'notification-1',
        userId: 'user-1',
        type: 'ORDER_CREATED',
        data: expect.objectContaining({
          notificationId: 'notification-1',
          userId: 'user-1',
        }),
      }),
      expect.objectContaining({
        attempts: 3,
      }),
    );
  });

  it('revokes invalid FCM tokens in the processor', async () => {
    mockFirebaseSend.mockRejectedValueOnce({
      code: 'messaging/registration-token-not-registered',
    });
    mockPrisma.pushToken.updateMany.mockResolvedValue({ count: 1 });

    await expect(
      processFCMNotification({
        data: {
          token: 'bad-token',
          userId: 'user-1',
          notification: { title: 'Title', body: 'Body' },
          data: { clickAction: '/dashboard' },
        },
      }),
    ).resolves.toEqual({ success: false, reason: 'invalid_token_revoked' });

    expect(mockPrisma.pushToken.updateMany).toHaveBeenCalledWith({
      where: { token: 'bad-token' },
      data: { revoked: true },
    });
  });
});
