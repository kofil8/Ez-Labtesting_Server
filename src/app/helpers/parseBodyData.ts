import { Request, Response, NextFunction } from 'express';
import ApiError from '../errors/ApiErrors';

const parseBodyData = async (req: Request, res: Response, next: NextFunction) => {
  if (req.body && req.body.data) {
    try {
      req.body.bodyData = JSON.parse(req.body.data);
    } catch {
      return next(new ApiError(400, 'Invalid JSON format in bodyData'));
    }
  }
  next();
};

export default parseBodyData;
