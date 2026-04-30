import { Response } from 'express';
import {
  accessCookieOptions,
  clearCookieOptions,
  refreshCookieOptions,
  staleCookieOptionsList,
} from '../../../config/cookies';

const clearCookieVariant = (res: Response, name: 'refreshToken' | 'accessToken') => {
  staleCookieOptionsList.forEach((options) => {
    res.clearCookie(name, options);
  });
};

export const setAuthCookies = (
  res: Response,
  tokens: { accessToken: string; refreshToken: string },
) => {
  clearCookieVariant(res, 'refreshToken');
  clearCookieVariant(res, 'accessToken');

  res.cookie('refreshToken', tokens.refreshToken, refreshCookieOptions);
  res.cookie('accessToken', tokens.accessToken, accessCookieOptions);
};

export const clearAuthCookies = (res: Response) => {
  clearCookieVariant(res, 'refreshToken');
  clearCookieVariant(res, 'accessToken');
};

export { accessCookieOptions, clearCookieOptions, refreshCookieOptions };
