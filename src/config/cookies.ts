import { CookieOptions } from 'express';
import config from './index';
import { parseExpiryToMs, parseExpiryToSeconds } from '../app/utils/tokenExpiry';

const isProd = process.env.NODE_ENV === 'production';
const cookieDomain = process.env.COOKIE_DOMAIN?.trim() || (isProd ? '.ezlabtesting.com' : undefined);

const parseBoolean = (value: string | undefined, fallback: boolean) => {
  if (value === undefined) return fallback;
  return ['true', '1', 'yes', 'on'].includes(value.trim().toLowerCase());
};

const parseSameSite = (value: string | undefined): CookieOptions['sameSite'] => {
  const normalized = value?.trim().toLowerCase();
  if (normalized === 'strict' || normalized === 'none') {
    return normalized;
  }

  return 'lax';
};

const sameSite = parseSameSite(process.env.COOKIE_SAME_SITE);
const secureCookies = parseBoolean(process.env.COOKIE_SECURE, isProd || sameSite === 'none');

export const ACCESS_TOKEN_COOKIE_MAX_AGE = parseExpiryToMs(config.jwt.expires_in as string);

export const REFRESH_TOKEN_COOKIE_MAX_AGE = parseExpiryToMs(
  config.jwt.refresh_token_expires_in as string,
);

export const REFRESH_TOKEN_REDIS_TTL = parseExpiryToSeconds(
  config.jwt.refresh_token_expires_in as string,
);

const baseCookieOptions: CookieOptions = {
  httpOnly: true,
  secure: secureCookies,
  sameSite,
  path: '/',
};

export const accessCookieOptions: CookieOptions = {
  ...baseCookieOptions,
  ...(cookieDomain ? { domain: cookieDomain } : {}),
  maxAge: ACCESS_TOKEN_COOKIE_MAX_AGE,
};

export const refreshCookieOptions: CookieOptions = {
  ...baseCookieOptions,
  ...(cookieDomain ? { domain: cookieDomain } : {}),
  maxAge: REFRESH_TOKEN_COOKIE_MAX_AGE,
};

export const clearCookieOptions: CookieOptions = {
  ...baseCookieOptions,
  ...(cookieDomain ? { domain: cookieDomain } : {}),
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
