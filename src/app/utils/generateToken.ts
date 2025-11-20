import jwt, { Secret } from "jsonwebtoken";

export const generateToken = (
  payload: {
    id: string;
    email: string;
    role: string;
    fcmToken?: string | null;
    isOnline?: boolean;
    isVerified?: boolean;
  },
  secret: Secret,
  expiresIn: string
) => {
  const token = jwt.sign(payload, secret, {
    algorithm: "HS256",
    expiresIn: expiresIn,
  });
  return token;
};
