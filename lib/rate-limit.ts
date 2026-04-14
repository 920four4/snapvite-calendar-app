import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

let _redis: Redis | null = null;
let _anonymousLimiter: Ratelimit | null = null;
let _freeLimiter: Ratelimit | null = null;

function getRedis(): Redis {
  if (!_redis) {
    _redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    });
  }
  return _redis;
}

export function getAnonymousLimiter(): Ratelimit {
  if (!_anonymousLimiter) {
    _anonymousLimiter = new Ratelimit({
      redis: getRedis(),
      limiter: Ratelimit.slidingWindow(3, "1 d"),
      prefix: "snapvite:anon",
    });
  }
  return _anonymousLimiter;
}

export function getFreeLimiter(): Ratelimit {
  if (!_freeLimiter) {
    _freeLimiter = new Ratelimit({
      redis: getRedis(),
      limiter: Ratelimit.slidingWindow(10, "1 d"),
      prefix: "snapvite:free",
    });
  }
  return _freeLimiter;
}
