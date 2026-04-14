import { CookieOptions } from 'express';
import config from './index';
import { parseExpiryToMs, parseExpiryToSeconds } from '../app/utils/tokenExpiry';

const getHostname = (value?: string | null) => {
  if (!value) {
    return null;
  }

  try {
    return new URL(value).hostname.toLowerCase();
  } catch {
    return null;
  }
};

const LOOPBACK_HOSTS = new Set(['localhost', '127.0.0.1', '::1']);
const backendHostname = getHostname(config.backend_base_url);
const isLocalBackend = backendHostname ? LOOPBACK_HOSTS.has(backendHostname) : false;
const isProd = process.env.NODE_ENV === 'production' && !isLocalBackend;

export const ACCESS_TOKEN_COOKIE_MAX_AGE = parseExpiryToMs(config.jwt.expires_in as string);

export const REFRESH_TOKEN_COOKIE_MAX_AGE = parseExpiryToMs(
  config.jwt.refresh_token_expires_in as string,
);

export const REFRESH_TOKEN_REDIS_TTL = parseExpiryToSeconds(
  config.jwt.refresh_token_expires_in as string,
);

const baseCookieOptions: CookieOptions = {
  httpOnly: true,
  secure: isProd,
  sameSite: isProd ? 'none' : 'lax',
  path: '/',
};

export const accessCookieOptions: CookieOptions = {
  ...baseCookieOptions,
  ...(isProd ? { domain: '.ezlabtesting.com' } : {}),
  maxAge: ACCESS_TOKEN_COOKIE_MAX_AGE,
};

export const refreshCookieOptions: CookieOptions = {
  ...baseCookieOptions,
  ...(isProd ? { domain: '.ezlabtesting.com' } : {}),
  maxAge: REFRESH_TOKEN_COOKIE_MAX_AGE,
};

export const clearCookieOptions: CookieOptions = {
  ...baseCookieOptions,
  ...(isProd ? { domain: '.ezlabtesting.com' } : {}),
};

export const legacyLocalhostCookieOptions: CookieOptions = {
  httpOnly: true,
  secure: true,
  sameSite: 'none',
  domain: 'localhost',
  path: '/',
};

export const legacyHostOnlyCookieOptions: CookieOptions = {
  httpOnly: true,
  secure: false,
  sameSite: 'lax',
  path: '/',
};

export const staleCookieOptionsList: CookieOptions[] = [
  clearCookieOptions,
  legacyLocalhostCookieOptions,
  legacyHostOnlyCookieOptions,
  {
    httpOnly: true,
    secure: true,
    sameSite: 'none',
    domain: '.ezlabtesting.com',
    path: '/',
  },
];
