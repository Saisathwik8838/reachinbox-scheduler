import Redis from "ioredis";

export interface RateLimitResult {
  allowed: boolean;
  count: number;
  msUntilNextHour: number;
  hourWindow: number;
  key: string;
}

// Track email sends per sender per hour window in Redis: rate:{sender}:{hourWindow}
export async function checkAndIncrementHourlyLimit(
  redis: Redis,
  sender: string,
  limit: number,
  now: number = Date.now()
): Promise<RateLimitResult> {
  const hourWindow = Math.floor(now / 3600000);
  const msUntilNextHour = (hourWindow + 1) * 3600000 - now;
  const key = `rate:${sender}:${hourWindow}`;

  const count = await redis.incr(key);
  if (count === 1) {
    // Expire after 2 hours so keys don't linger indefinitely
    await redis.expire(key, 7200);
  }

  if (count > limit) {
    return {
      allowed: false,
      count,
      msUntilNextHour,
      hourWindow,
      key,
    };
  }

  return {
    allowed: true,
    count,
    msUntilNextHour,
    hourWindow,
    key,
  };
}

// Get the current hour counter without incrementing
export async function getHourlyCount(
  redis: Redis,
  sender: string,
  now: number = Date.now()
): Promise<number> {
  const hourWindow = Math.floor(now / 3600000);
  const key = `rate:${sender}:${hourWindow}`;
  const val = await redis.get(key);
  return val ? parseInt(val, 10) : 0;
}
