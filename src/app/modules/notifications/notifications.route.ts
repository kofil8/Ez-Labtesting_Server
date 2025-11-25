import prisma from '@/shared/prisma';
import express, { Request, Response } from 'express';
import webpush from 'web-push';

const router = express.Router();

/**
 * Save subscription to DB
 */
router.post('/subscribe', async (req: Request, res: Response) => {
  const { subscription, userId } = req.body;

  if (!subscription) {
    return res.status(400).json({
      success: false,
      message: 'Subscription object is required',
    });
  }

  const { endpoint, keys } = subscription;

  if (!endpoint || !keys?.p256dh || !keys?.auth) {
    return res.status(400).json({
      success: false,
      message: 'Invalid subscription payload',
    });
  }

  try {
    await prisma.pushSubscription.upsert({
      where: { endpoint },
      update: {
        p256dh: keys.p256dh,
        auth: keys.auth,
        userId: userId || null,
      },
      create: {
        endpoint,
        p256dh: keys.p256dh,
        auth: keys.auth,
        userId: userId || null,
      },
    });

    return res.json({
      success: true,
      message: 'Subscription saved successfully',
    });
  } catch (error) {
    console.error('Push subscription save error:', error);
    return res.status(500).json({
      success: false,
      message: 'Database error',
    });
  }
});

/**
 * Send push notification to all subscribers (or a specific user)
 */
router.post('/send-push', async (req: Request, res: Response) => {
  const vapidPublic = process.env.VAPID_PUBLIC_KEY;
  const vapidPrivate = process.env.VAPID_PRIVATE_KEY;

  if (!vapidPublic || !vapidPrivate) {
    return res.status(500).json({
      success: false,
      message: 'Missing VAPID keys. Set VAPID_PUBLIC_KEY & VAPID_PRIVATE_KEY',
    });
  }

  webpush.setVapidDetails('mailto:ezlabtesting@gmail.com', vapidPublic, vapidPrivate);

  const { title, body, data, userId } = req.body;

  const payload = JSON.stringify({
    title: title || 'Ez LabTesting',
    body: body || 'New Notification',
    data: data || {},
  });

  const where = userId ? { userId } : {};

  const subscribers = await prisma.pushSubscription.findMany({ where });

  const results: Array<{ ok: boolean; err?: any }> = [];

  for (const sub of subscribers) {
    try {
      await webpush.sendNotification(
        {
          endpoint: sub.endpoint,
          keys: { p256dh: sub.p256dh, auth: sub.auth },
        } as any,
        payload,
      );
      results.push({ ok: true });
    } catch (err) {
      results.push({ ok: false, err });

      // Remove dead subscriptions
      if ((err as any).statusCode === 410 || (err as any).statusCode === 404) {
        await prisma.pushSubscription.delete({
          where: { endpoint: sub.endpoint },
        });
      }
    }
  }

  return res.json({
    success: true,
    count: results.length,
    results,
  });
});

export default router;
