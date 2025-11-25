import { createClient } from 'redis';

const redisUrl = process.env.REDIS_URL || '';

async function main() {
  if (!redisUrl) {
    console.warn('REDIS_URL not provided');
    return;
  }

  const client = createClient({ url: redisUrl });
  await client.connect();

  console.log('[worker] Notification worker running...');

  // Demo publishing (replace with real job events)
  setInterval(async () => {
    const msg = {
      to: 'user:1',
      event: 'notification',
      payload: {
        title: 'Demo',
        body: 'Hello from worker',
      },
    };

    await client.publish('notifications', JSON.stringify(msg));
    console.log('[worker] published demo notification');
  }, 30000);
}

main().catch(console.error);
