import jwt, { Secret, SignOptions, JwtPayload } from 'jsonwebtoken';

const signToken = (
  payload: Record<string, unknown>,
  secret: Secret,
  expiresIn: SignOptions['expiresIn'],
) => {
  return jwt.sign(payload, secret, {
    algorithm: 'HS256',
    expiresIn,
  });
};

const verifyToken = (token: string, secret: Secret) => {
  return jwt.verify(token, secret) as JwtPayload;
};

export const jwtHelpers = {
  signToken,
  verifyToken,
};
