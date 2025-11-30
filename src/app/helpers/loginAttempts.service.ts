import redisClient from '../../config/redis';

const LOGIN_ATTEMPT_PREFIX = 'login_attempts';
const ACCOUNT_LOCK_PREFIX = 'account_lock';

// Configurable
const MAX_ATTEMPTS = 5; // number of failed attempts
const BLOCK_TIME = 10 * 60; // lock for 10 minutes

export const LoginAttemptService = {
  // Track failed attempts
  async recordFailedAttempt(email: string, ip: string) {
    const key = `${LOGIN_ATTEMPT_PREFIX}:${email}:${ip}`;

    const attempts = await redisClient.incr(key);

    // expire in 10 minutes
    if (attempts === 1) {
      await redisClient.expire(key, BLOCK_TIME);
    }

    // If too many attempts → lock the account
    if (attempts >= MAX_ATTEMPTS) {
      const lockKey = `${ACCOUNT_LOCK_PREFIX}:${email}`;
      await redisClient.set(lockKey, 'locked', 'EX', BLOCK_TIME);
    }

    return attempts;
  },

  // Check if the account is locked
  async isAccountLocked(email: string) {
    const lockKey = `${ACCOUNT_LOCK_PREFIX}:${email}`;
    const locked = await redisClient.get(lockKey);
    return locked === 'locked';
  },

  // Reset attempts after successful login
  async resetAttempts(email: string, ip: string) {
    const key = `${LOGIN_ATTEMPT_PREFIX}:${email}:${ip}`;
    await redisClient.del(key);
  },
};
