import { NextFunction, Request, Response } from 'express';
import ApiError from '../errors/ApiErrors';

const parseBodyData = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Case 1: Data is wrapped in a 'data' field as JSON string (for FormData with file uploads)
    if (req.body && req.body.data && typeof req.body.data === 'string') {
      try {
        const parsedData = JSON.parse(req.body.data);
        req.body = { ...req.body, ...parsedData };
        delete req.body.data; // Remove the 'data' wrapper after extracting
      } catch {
        return next(new ApiError(400, 'Invalid JSON format in data field'));
      }
    }
    // Case 2: Data fields are already parsed by multer (multipart form data)
    // In this case, form fields are already directly in req.body, so no action needed

    next();
  } catch (error) {
    next(error);
  }
};

export default parseBodyData;
