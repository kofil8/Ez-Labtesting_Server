import { PrismaClient } from '@prisma/client';
import { getFirebaseAdmin } from '../../../lib/firebaseAdmin';

const prisma = new PrismaClient();
const admin = getFirebaseAdmin();

export const NotificationService = {
  /* -------------------------------------------------------
     REGISTER TOKEN
  ------------------------------------------------------- */
  async registerToken(userId: string | null, token: string, platform = 'web') {
    return prisma.pushToken.upsert({
      where: { token },
      update: { userId, platform, revoked: false },
      create: { userId, token, platform },
    });
  },

  /* -------------------------------------------------------
     UNREGISTER TOKEN
  ------------------------------------------------------- */
  async unregisterToken(token: string) {
    return prisma.pushToken.deleteMany({
      where: { token },
    });
  },

  /* -------------------------------------------------------
     SEND TO A SINGLE TOKEN
  ------------------------------------------------------- */
  async sendToToken(token: string, title: string, body: string, data: Record<string, string> = {}) {
    const message = {
      token,
      notification: { title, body },
      data,
      webpush: {
        notification: {
          title,
          body,
          icon: '/logo.png',
        },
        fcmOptions: {
          link: 'https://localhost:3000/', // 🔥 Required for Web
        },
      },
    };

    try {
      const response = await admin.messaging().send(message);
      return { success: true, response };
    } catch (error: any) {
      const code = error.code;

      // Clean invalid tokens
      if (
        code === 'messaging/registration-token-not-registered' ||
        code === 'messaging/invalid-registration-token'
      ) {
        await prisma.pushToken.deleteMany({
          where: { token },
        });
      }

      console.error('🔥 sendToToken FCM Error:', error);
      return { success: false, error: error.message };
    }
  },

  /* -------------------------------------------------------
     SEND TO ALL DEVICES OF A USER
  ------------------------------------------------------- */
  async sendToUser(userId: string, title: string, body: string, data: Record<string, string> = {}) {
    const tokens = await prisma.pushToken.findMany({
      where: { userId, revoked: false },
    });

    if (!tokens.length) {
      return { success: false, message: 'No tokens found' };
    }

    const tokenList = tokens.map((t) => t.token);

    const multicastMessage = {
      tokens: tokenList,
      notification: { title, body },
      data,
      webpush: {
        notification: {
          title,
          body,
          icon: '/logo.png',
        },
        fcmOptions: {
          link: 'https://localhost:3000/',
        },
      },
    };

    // TS-safe, works in Admin SDK v11+
    const response = await admin.messaging().sendEachForMulticast(multicastMessage);

    // Collect invalid tokens
    const invalidTokens: string[] = [];

    response.responses.forEach((resp, index) => {
      if (!resp.success) {
        const errCode = (resp.error as any)?.code;

        if (
          errCode === 'messaging/registration-token-not-registered' ||
          errCode === 'messaging/invalid-registration-token' ||
          errCode === 'messaging/invalid-argument'
        ) {
          invalidTokens.push(tokenList[index]);
        }
      }
    });

    // Remove invalid tokens
    if (invalidTokens.length) {
      await prisma.pushToken.deleteMany({
        where: { token: { in: invalidTokens } },
      });
    }

    return {
      success: true,
      successCount: response.successCount,
      failureCount: response.failureCount,
    };
  },
};
