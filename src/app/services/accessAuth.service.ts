import axios from 'axios';
import { env } from '../../config/env';
import redisClient from '../../config/redis';

class AccessAuthService {
  /**
   * Redis-backed cache key for the ACCESS session key.
   * Shared across instances to support horizontal scaling.
   */
  private readonly REDIS_SESSION_KEY = 'access:sessionkey';

  /**
   * A short-lived lock to prevent a thundering herd when many workers start up.
   */
  private readonly REDIS_SESSION_LOCK = 'access:sessionkey:lock';

  /**
   * Session keys are typically long-lived; cache for 23h to be safe.
   * Stored in Redis as a TTL (seconds).
   */
  private readonly SESSION_KEY_TTL_SECONDS = 23 * 60 * 60;

  /**
   * Max time to wait for another instance to refresh the session key.
   */
  private readonly LOCK_WAIT_MS = 5000;

  /**
   * Poll interval while waiting for the key to appear.
   */
  private readonly LOCK_POLL_MS = 200;

  /**
   * Get a valid ACCESS session key, using Redis as the source of truth.
   * - If key exists in Redis, return it.
   * - Otherwise acquire a distributed lock, authenticate, store key in Redis with TTL, return it.
   * - If lock is held by another instance, wait briefly for the key to appear.
   */
  async getSessionKey(): Promise<string> {
    // Fast path: key already cached
    const cached = await redisClient.get(this.REDIS_SESSION_KEY);
    if (cached && cached.trim().length > 0) return cached.trim();

    const lockToken = this.randomToken();

    const lockAcquired = await this.tryAcquireLock(lockToken);
    if (lockAcquired) {
      try {
        // Another instance could have set it between our GET and lock acquire
        const recheck = await redisClient.get(this.REDIS_SESSION_KEY);
        if (recheck && recheck.trim().length > 0) return recheck.trim();

        const sessionKey = await this.authenticate();

        // Store in Redis with TTL
        await redisClient.set(this.REDIS_SESSION_KEY, sessionKey, 'EX', this.SESSION_KEY_TTL_SECONDS);

        return sessionKey;
      } finally {
        await this.releaseLock(lockToken);
      }
    }

    // Lock not acquired: wait for the key to be populated
    const start = Date.now();
    while (Date.now() - start < this.LOCK_WAIT_MS) {
      const key = await redisClient.get(this.REDIS_SESSION_KEY);
      if (key && key.trim().length > 0) return key.trim();
      await this.sleep(this.LOCK_POLL_MS);
    }

    // If still missing, last resort: authenticate ourselves (no lock)
    // This prevents prolonged outage if a lock-holder crashed mid-flight.
    const sessionKey = await this.authenticate();
    await redisClient.set(this.REDIS_SESSION_KEY, sessionKey, 'EX', this.SESSION_KEY_TTL_SECONDS);
    return sessionKey;
  }

  /**
   * ACCESS API session key
   * Docs: GET authAPI.cgi?mode=getSessionkey&username=<UserName>&password=<encodedPassword>
   */
  private async authenticate(): Promise<string> {
    const baseUrl = env.ACCESS_BASE_URL || env.ACCESS_API_URL;
    const authUrl = `${baseUrl}/authAPI.cgi`;

    // Docs suggest encoding only special characters; encodeURIComponent is safest.
    const encodedPassword = encodeURIComponent(env.ACCESS_PASSWORD);

    try {
      const response = await axios.get(authUrl, {
        params: {
          mode: 'getSessionkey',
          username: env.ACCESS_USERNAME,
          password: encodedPassword,
        },
        timeout: 10000,
      });

      const data = response.data;

      // Response may be plain text or JSON depending on ACCESS configuration.
      if (typeof data === 'string') {
        const m = data.match(/sessionkey\s*[:=]\s*([A-Za-z0-9]+)/i);
        if (m?.[1]) return m[1].trim();
      }

      if (data && typeof data === 'object') {
        const key = (data.sessionkey || data.sessionKey || data.session_key) as string | undefined;
        if (key) return String(key).trim();
      }

      throw new Error(
        `Invalid authentication response: ${
          typeof data === 'string' ? data.slice(0, 200) : JSON.stringify(data)
        }`,
      );
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(
          `ACCESS Lab authentication failed: ${error.message} (Status: ${error.response?.status})`,
        );
      }
      throw new Error(
        `ACCESS Lab authentication failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  /**
   * Force refresh on next request.
   * This is called when ACCESS indicates the session key is expired.
   */
  async invalidateSessionKey() {
    await redisClient.del(this.REDIS_SESSION_KEY);
  }

  private async tryAcquireLock(token: string): Promise<boolean> {
    // SET key value NX PX <ms>
    const res = await redisClient.set(this.REDIS_SESSION_LOCK, token, 'PX', 15000, 'NX');
    return res === 'OK';
  }

  private async releaseLock(token: string) {
    // Release only if lock still owned by us (Lua check-and-del)
    const lua = `
      if redis.call("GET", KEYS[1]) == ARGV[1] then
        return redis.call("DEL", KEYS[1])
      else
        return 0
      end
    `;
    try {
      await redisClient.eval(lua, 1, this.REDIS_SESSION_LOCK, token);
    } catch (e) {
      // non-fatal
      console.warn('[AccessAuth] Failed to release lock:', e);
    }
  }

  private randomToken(): string {
    return `${Date.now()}_${Math.random().toString(16).slice(2)}`;
  }

  private sleep(ms: number) {
    return new Promise((r) => setTimeout(r, ms));
  }
}

export const accessAuthService = new AccessAuthService();
