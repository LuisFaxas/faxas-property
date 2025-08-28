import { ApiError } from './response';

// Rate limiting implementation
// For production, use Redis/Upstash. This is a dev-only in-memory implementation

// Development-only in-memory store
const devRateLimiter = new Map<string, { count: number; resetAt: number }>();

export async function rateLimit(
  userId: string,
  limit: number = 100,
  windowMs: number = 60000 // 1 minute
): Promise<void> {
  // Skip rate limiting in test environment
  if (process.env.NODE_ENV === 'test') {
    return;
  }

  // Production should use Redis/Upstash
  if (process.env.NODE_ENV === 'production') {
    // TODO: Implement with Upstash Redis
    // For now, just log a warning
    if (!process.env.UPSTASH_REDIS_REST_URL) {
      console.warn('Rate limiting disabled in production - configure Upstash Redis');
      return;
    }
    
    // Production implementation would be:
    // const redis = new Redis({
    //   url: process.env.UPSTASH_REDIS_REST_URL,
    //   token: process.env.UPSTASH_REDIS_REST_TOKEN,
    // });
    // const key = `rate_limit:${userId}`;
    // const current = await redis.incr(key);
    // if (current === 1) {
    //   await redis.expire(key, Math.floor(windowMs / 1000));
    // }
    // if (current > limit) {
    //   throw new ApiError(429, 'Rate limit exceeded');
    // }
    
    return;
  }

  // Development mode: Use in-memory store
  const now = Date.now();
  const key = userId;
  const userLimit = devRateLimiter.get(key);

  // Clean expired entries periodically (1% chance)
  if (Math.random() < 0.01) {
    for (const [k, v] of devRateLimiter) {
      if (v.resetAt < now) {
        devRateLimiter.delete(k);
      }
    }
  }

  if (!userLimit || userLimit.resetAt < now) {
    // Start new window
    devRateLimiter.set(key, {
      count: 1,
      resetAt: now + windowMs
    });
    return;
  }

  // Increment count in current window
  userLimit.count++;

  if (userLimit.count > limit) {
    const retryAfter = Math.ceil((userLimit.resetAt - now) / 1000);
    throw new ApiError(
      429, 
      `Rate limit exceeded. Try again in ${retryAfter} seconds`
    );
  }
}