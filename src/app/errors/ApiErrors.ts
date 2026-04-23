class ApiError extends Error {
  statusCode: number;
  code?: string;
  details?: Record<string, unknown>;

  constructor(
    statusCode: number,
    message: string | undefined,
    details?: Record<string, unknown>,
    code?: string,
    stack = "",
  ) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

export default ApiError;
