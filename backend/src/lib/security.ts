import { Request, Response, NextFunction } from 'express';
import { timingSafeEqual } from 'crypto';
import net from 'net';

/** Compare a presented secret with the expected one without leaking timing. */
function same(a: string, b: string): boolean {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

/**
 * Requires header `x-app-token` to equal the env var named by `envName`.
 * If the variable is not set the server refuses every request, so a missing
 * secret can never leave an endpoint open by accident.
 */
export function requireToken(envName: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    const expected = process.env[envName];
    if (!expected) {
      res.status(503).json({ error: 'Server is not configured' });
      return;
    }
    const given = String(req.header('x-app-token') ?? '');
    if (!same(given, expected)) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    next();
  };
}

/** Per-IP sliding window limit, held in memory. */
export function rateLimit(max: number, windowMs: number) {
  const hits = new Map<string, number[]>();
  setInterval(() => {
    const cutoff = Date.now() - windowMs;
    for (const [k, v] of hits) {
      const fresh = v.filter((t) => t > cutoff);
      if (fresh.length) hits.set(k, fresh);
      else hits.delete(k);
    }
  }, windowMs).unref();

  return (req: Request, res: Response, next: NextFunction) => {
    const now = Date.now();
    const key = req.ip ?? 'unknown';
    const recent = (hits.get(key) ?? []).filter((t) => t > now - windowMs);
    if (recent.length >= max) {
      res.setHeader('Retry-After', Math.ceil(windowMs / 1000));
      res.status(429).json({ error: 'Too many requests. Try again shortly.' });
      return;
    }
    recent.push(now);
    hits.set(key, recent);
    next();
  };
}

/**
 * Caps total paid calls per UTC day, across all users. This is the spend
 * ceiling: even if a token leaks, cost stops at this many searches a day.
 */
export function dailyCap(limit: number) {
  let day = new Date().toISOString().slice(0, 10);
  let count = 0;
  return (_req: Request, res: Response, next: NextFunction) => {
    const today = new Date().toISOString().slice(0, 10);
    if (today !== day) {
      day = today;
      count = 0;
    }
    if (count >= limit) {
      res.status(503).json({ error: 'Daily search limit reached. Try again tomorrow.' });
      return;
    }
    count += 1;
    next();
  };
}

/** Only addresses on a home network (RFC 1918) may be used as a TV target. */
export function isPrivateIPv4(ip: unknown): ip is string {
  if (typeof ip !== 'string' || !net.isIPv4(ip)) return false;
  const [a, b] = ip.split('.').map(Number);
  return a === 10 || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168);
}
