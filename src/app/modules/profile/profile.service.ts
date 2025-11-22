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

const updateProfileInDB = async (userId: string, req: any) => {
  const file = req.file;
  const payload = req.body;

  if (file) {
    payload.profileImage = `/uploads/${file.filename}`;
  }

  // If dateOfBirth is provided, ensure it's a Date object
  if (payload.dateOfBirth) {
    payload.dateOfBirth = new Date(payload.dateOfBirth);
  }

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: payload,
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

  return updatedUser;
};

const changePasswordInDB = async (user: any, payload: any) => {
  const userData = await prisma.user.findUnique({
    where: { id: user.id },
  });

  if (!userData) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }

  const isCorrectPassword = await bcrypt.compare(payload.oldPassword, userData.password);
  if (!isCorrectPassword) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Incorrect old password');
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
  updateProfileInDB,
  changePasswordInDB,
};
