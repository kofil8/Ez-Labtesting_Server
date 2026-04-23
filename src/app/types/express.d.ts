import { JwtPayload } from 'jsonwebtoken';

declare global {
  namespace Express {
    namespace Multer {
      interface File {
        location?: string;
        key?: string;
      }
    }

    interface Request {
      user?: JwtPayload | any;
      token?: string;
    }
  }
}
