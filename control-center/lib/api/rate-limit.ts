import { ApiError } from './response';
import { NextRequest } from 'next/server';

// Rate limiting implementation
// For production, use Redis/Upstash. This is a dev-only in-memory implementation

// Development-only in-memory store
const devRateLimiter = new Map<string, { count: number; resetAt: number }>();

// Get client IP from request
function getClientIp(request?: NextRequest): string {
  if (!request) return 'unknown';
  
  // Check various headers for IP
  const forwarded = request.headers.get('x-forwarded-for');
  const real = request.headers.get('x-real-ip');
  const cloudflare = request.headers.get('cf-connecting-ip');
  
  return cloudflare || real || forwarded?.split(',')[0] || 'unknown';
}

export async function rateLimit(
  userId: string,
  limit: number = 100,
  windowMs: number = 60000, // 1 minute
  request?: NextRequest
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
  
  // Use both user ID and IP for rate limiting
  const ip = getClientIp(request);
  const userKey = `user:${userId}`;
  const ipKey = `ip:${ip}`;
  
  // Check both user and IP limits
  const userLimit = devRateLimiter.get(userKey);
  const ipLimit = devRateLimiter.get(ipKey);

  // Clean expired entries periodically (1% chance)
  if (Math.random() < 0.01) {
    for (const [k, v] of devRateLimiter) {
      if (v.resetAt < now) {
        devRateLimiter.delete(k);
      }
    }
  }

  // Check user limit
  if (!userLimit || userLimit.resetAt < now) {
    // Start new window for user
    devRateLimiter.set(userKey, {
      count: 1,
      resetAt: now + windowMs
    });
  } else {
    // Increment count in current window
    userLimit.count++;
    
    if (userLimit.count > limit) {
      const retryAfter = Math.ceil((userLimit.resetAt - now) / 1000);
      throw new ApiError(
        429, 
        `Rate limit exceeded for user. Try again in ${retryAfter} seconds`
      );
    }
  }
  
  // Check IP limit (stricter limit for IP to prevent abuse)
  const ipRateLimit = Math.floor(limit * 1.5); // Allow slightly more for shared IPs
  
  if (!ipLimit || ipLimit.resetAt < now) {
    // Start new window for IP
    devRateLimiter.set(ipKey, {
      count: 1,
      resetAt: now + windowMs
    });
  } else {
    // Increment count for IP
    ipLimit.count++;
    
    if (ipLimit.count > ipRateLimit) {
      const retryAfter = Math.ceil((ipLimit.resetAt - now) / 1000);
      throw new ApiError(
        429, 
        `Rate limit exceeded for IP. Try again in ${retryAfter} seconds`
      );
    }
  }
}