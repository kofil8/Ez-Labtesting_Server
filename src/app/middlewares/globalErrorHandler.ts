import { Prisma } from '@prisma/client';
import { NextFunction, Request, Response } from 'express';
import httpStatus from 'http-status';
import { ZodError } from 'zod';
import config from '../../config';
import ApiError from '../errors/ApiErrors';
import { IGenericErrorMessage } from '../interfaces/error';

const GlobalErrorHandler = (error: unknown, _req: Request, res: Response, _next: NextFunction) => {
  let statusCode: number = httpStatus.INTERNAL_SERVER_ERROR;
  let message = (error as Error).message || 'Something went wrong!';
  let errorMessages: IGenericErrorMessage[] = [];

  if (error instanceof Prisma.PrismaClientValidationError) {
    const simplified = handleValidationError(error);
    statusCode = simplified.statusCode;
    message = simplified.message;
    errorMessages = simplified.errorMessages;
  } else if (error instanceof ZodError) {
    const simplified = handleZodError(error);
    statusCode = simplified.statusCode;
    message = simplified.message;
    errorMessages = simplified.errorMessages;
  } else if (error instanceof Prisma.PrismaClientKnownRequestError) {
    const simplified = handleClientError(error);
    statusCode = simplified.statusCode;
    message = simplified.message;
    errorMessages = simplified.errorMessages;
  } else if (error instanceof ApiError) {
    statusCode = error.statusCode;
    message = error.message;
    errorMessages = [{ path: '', message }];
  } else if (error instanceof Error) {
    message = error.message;
    errorMessages = [{ path: '', message }];
  }

  res.status(statusCode).json({
    success: false,
    message,
    errorMessages,
    stack: config.env !== 'production' && error instanceof Error ? error.stack : undefined,
  });

  _next(); // Call next to pass the error to the next middleware
};

function handleValidationError(error: Prisma.PrismaClientValidationError) {
  const message = 'Prisma validation error';
  const errorMessages = [
    {
      path: '',
      message: error.message,
    },
  ];
  return {
    statusCode: httpStatus.BAD_REQUEST,
    message,
    errorMessages,
  };
}

function handleZodError(error: ZodError<unknown>) {
  const errorMessages: IGenericErrorMessage[] = error.errors.map((err) => ({
    path: err.path.join('.'),
    message: err.message,
  }));

  return {
    statusCode: httpStatus.BAD_REQUEST,
    message: 'Validation error',
    errorMessages,
  };
}

function handleClientError(error: Prisma.PrismaClientKnownRequestError) {
  const message = 'Database request error';
  const statusCode = httpStatus.BAD_REQUEST;
  const errorMessages: IGenericErrorMessage[] = [
    {
      path: '',
      message: error.message,
    },
  ];

  // You can customize messages based on error.code if needed
  // For example:
  // if (error.code === 'P2002') {
  //   message = 'Unique constraint failed on the field(s)';
  //   statusCode = httpStatus.CONFLICT;
  // }

  return {
    statusCode,
    message,
    errorMessages,
  };
}

export default GlobalErrorHandler;
