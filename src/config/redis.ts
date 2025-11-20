import Redis from 'ioredis';
import { env } from './env';

const redisClient = new Redis(env.REDIS_URL, {
  connectTimeout: 10000,
  retryStrategy: (times) => Math.min(times * 200, 2000),
});

// Only log errors — avoid "connect" event here (causes race issues)
redisClient.on('error', (err) => {
  console.error('❌ Redis connection error:', err.message);
});

export default redisClient;
