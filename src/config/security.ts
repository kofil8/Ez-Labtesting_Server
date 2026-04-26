import { CorsOptions } from 'cors';
import { NextFunction, Request, Response } from 'express';

const PRODUCTION_ORIGINS = ['https://ezlabtesting.com', 'https://www.ezlabtesting.com'];
const DEVELOPMENT_ORIGINS = ['http://localhost:3000', 'http://127.0.0.1:3000'];
const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

const splitCsv = (value?: string | null) =>
  (value || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

const normalizeOrigin = (origin: string) => {
  try {
    const parsed = new URL(origin);
    return parsed.origin;
  } catch {
    return origin.replace(/\/+$/, '');
  }
};

export const getAllowedOrigins = () => {
  const configuredOrigins = [
    ...splitCsv(process.env.ALLOWED_ORIGINS),
    ...splitCsv(process.env.FRONTEND_URL),
  ];

  const defaults = process.env.NODE_ENV === 'production' ? PRODUCTION_ORIGINS : DEVELOPMENT_ORIGINS;

  return Array.from(new Set([...configuredOrigins, ...defaults].map(normalizeOrigin)));
};

export const getTrustProxySetting = (): boolean | number | string | string[] => {
  const raw = process.env.TRUST_PROXY?.trim();

  if (!raw) {
    return process.env.NODE_ENV === 'production' ? 1 : false;
  }

  const normalized = raw.toLowerCase();
  if (['false', '0', 'off', 'no'].includes(normalized)) {
    return false;
  }

  if (['true', 'on', 'yes'].includes(normalized)) {
    return 1;
  }

  const numericValue = Number(raw);
  if (Number.isInteger(numericValue) && numericValue >= 0) {
    return numericValue;
  }

  const values = splitCsv(raw);
  return values.length > 1 ? values : raw;
};

export const buildCorsOptions = (allowedOrigins = getAllowedOrigins()): CorsOptions => ({
  origin(origin, callback) {
    if (!origin) {
      callback(null, true);
      return;
    }

    callback(null, allowedOrigins.includes(normalizeOrigin(origin)));
  },
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization', 'Idempotency-Key'],
  exposedHeaders: [
    'RateLimit-Limit',
    'RateLimit-Remaining',
    'RateLimit-Reset',
    'Retry-After',
  ],
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
});

export const enforceTrustedOrigin =
  (allowedOrigins = getAllowedOrigins()) =>
  (req: Request, res: Response, next: NextFunction) => {
    if (SAFE_METHODS.has(req.method.toUpperCase())) {
      next();
      return;
    }

    const origin = req.get('origin');
    if (!origin) {
      next();
      return;
    }

    if (allowedOrigins.includes(normalizeOrigin(origin))) {
      next();
      return;
    }

    res.status(403).json({
      success: false,
      message: 'Request origin is not allowed.',
    });
  };
