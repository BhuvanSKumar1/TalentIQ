import Redis from 'ioredis';
import { config } from '.';
import { logger } from '../utils/logger';

let redisConnected = false;

export const redis = new Redis(config.REDIS_URL, {
  maxRetriesPerRequest: 3,
  enableOfflineQueue: false,
  retryStrategy(times: number) {
    // Stop retrying after 3 attempts — Redis is optional
    if (times > 3) return null;
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
});

redis.on('connect', () => {
  redisConnected = true;
  logger.info('Redis connected');
});

redis.on('error', (err: any) => {
  // Only log the first error at warn level; suppress repeated retries
  if (!redisConnected && err?.code === 'ECONNREFUSED') {
    logger.warn('Redis unavailable — running without cache (performance may be reduced)');
  } else {
    logger.error({ err }, 'Redis connection error');
  }
});

export function isRedisAvailable(): boolean {
  return redisConnected && redis.status === 'ready';
}

export async function getCache<T>(key: string): Promise<T | null> {
  if (!isRedisAvailable()) return null;
  try {
    const data = await redis.get(key);
    if (!data) return null;
    return JSON.parse(data) as T;
  } catch {
    return null;
  }
}

export async function setCache(key: string, value: unknown, ttlSeconds = 300): Promise<void> {
  if (!isRedisAvailable()) return;
  try {
    await redis.setex(key, ttlSeconds, JSON.stringify(value));
  } catch {
    // Cache write failure is non-critical
  }
}

export async function deleteCache(pattern: string): Promise<void> {
  if (!isRedisAvailable()) return;
  try {
    const keys = await redis.keys(pattern);
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  } catch {
    // Cache delete failure is non-critical
  }
}
