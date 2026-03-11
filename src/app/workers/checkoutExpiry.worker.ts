import { Worker } from 'bullmq';
import { env } from '../../config/env';
import { checkoutService } from '../modules/checkout/checkout.service';

const redisUrl = new URL(env.REDIS_URL);

const redisConnection = {
  host: redisUrl.hostname,
  port: parseInt(redisUrl.port, 10),
  password: redisUrl.password || undefined,
};

export const checkoutExpiryWorker = new Worker(
  'checkout-session-expiry',
  async () => {
    const { expiredCount } = await checkoutService.expireOldSessions(new Date());
    if (expiredCount > 0) {
      console.log(`[CheckoutExpiryWorker] Expired ${expiredCount} checkout session(s)`);
    }
    return { expiredCount };
  },
  { connection: redisConnection },
);

checkoutExpiryWorker.on('failed', (job, err) => {
  console.error('[CheckoutExpiryWorker] Job failed', job?.id, err);
});

console.log('[Workers] Checkout expiry worker initialized');
