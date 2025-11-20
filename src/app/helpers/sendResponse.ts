import { Response } from 'express';

type ISendResponse<T> = {
  statusCode: number;
  success?: boolean;
  message?: string;
  data?: T;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
  };
};

const sendResponse = <T>(res: Response, payload: ISendResponse<T>): void => {
  res.status(payload.statusCode).json({
    success: payload.success ?? true,
    message: payload.message,
    meta: payload.meta,
    data: payload.data,
  });
};

export default sendResponse;
