import { prisma } from '@/config/db';
import ApiError from '@/app/errors/ApiErrors';
import httpStatus from 'http-status';
import bcrypt from 'bcrypt';
import config from '@/config';

const getProfileFromDB = async (user: any) => {
  const profile = await prisma.user.findUnique({
    where: {
      id: user.id,
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      phoneNumber: true,
      profileImage: true,
      bio: true,
      dateOfBirth: true,
      role: true,
      isVerified: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!profile) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }

  return profile;
};

const updateMyProfileIntoDB = async (id: string, payload: any, file: any) => {
  const existingUser = await prisma.user.findUnique({ where: { id } });
  if (!existingUser) throw new ApiError(httpStatus.BAD_REQUEST, 'User not found');

  const profileImage =
    file && file.originalname
      ? `${config.backend_file_url}/uploads/${file.originalname}`
      : existingUser.profileImage;

  const parsedPayload = typeof payload === 'string' ? JSON.parse(payload) : payload;

  const updatedUser = await prisma.user.update({
    where: { id },
    data: {
      profileImage,
      ...parsedPayload,
    },
  });

  const { password, ...rest } = updatedUser;
  return Object.fromEntries(Object.entries(rest).filter(([_, v]) => v !== null));
};

const changePasswordInDB = async (user: any, payload: any) => {
  const userData = await prisma.user.findUnique({
    where: { id: user.id },
  });

  if (!userData) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }

  // Check old password is correct
  const isCorrectPassword = await bcrypt.compare(payload.oldPassword, userData.password);
  if (!isCorrectPassword) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Incorrect old password');
  }

  // Prevent using old password
  const isSameAsOld = await bcrypt.compare(payload.newPassword, userData.password);
  if (isSameAsOld) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      'New password cannot be the same as the old password',
    );
  }

  const hashedPassword = await bcrypt.hash(payload.newPassword, Number(config.salt));

  await prisma.user.update({
    where: { id: user.id },
    data: {
      password: hashedPassword,
    },
  });

  return {
    message: 'Password changed successfully',
  };
};

export const ProfileService = {
  getProfileFromDB,
  updateMyProfileIntoDB,
  changePasswordInDB,
};
