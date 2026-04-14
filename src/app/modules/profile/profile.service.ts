import { Gender } from '@prisma/client';
import bcrypt from 'bcrypt';
import httpStatus from 'http-status';
import config from '../../../config';
import { prisma } from '../../../config/db';
import ApiError from '../../errors/ApiErrors';
import { deleteFile } from '../../helpers/fileUploadHelper';

const GENDER_ALIASES: Record<string, Gender> = {
  male: 'MALE',
  female: 'FEMALE',
  non_binary: 'NON_BINARY',
  prefer_not_to_say: 'PREFER_NOT_TO_SAY',
  other: 'OTHER',
};

const GENDER_ENUM_VALUES = new Set<Gender>(Object.values(GENDER_ALIASES));

const normalizeGender = (value: unknown): Gender | undefined => {
  if (typeof value !== 'string') {
    return undefined;
  }

  const trimmedValue = value.trim();
  if (!trimmedValue) {
    return undefined;
  }

  const upperValue = trimmedValue.toUpperCase() as Gender;
  if (GENDER_ENUM_VALUES.has(upperValue)) {
    return upperValue;
  }

  return GENDER_ALIASES[trimmedValue.toLowerCase()];
};

const getProfileFromDB = async (user: any) => {
  const profile = await prisma.user.findUnique({
    where: {
      id: user.id,
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      username: true,
      email: true,
      phoneNumber: true,
      profileImage: true,
      bio: true,
      gender: true,
      addressLine1: true,
      addressLine2: true,
      city: true,
      state: true,
      zipCode: true,
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

  let profileImage = existingUser.profileImage;
  const parsedPayload = typeof payload === 'string' ? JSON.parse(payload) : payload;
  const normalizedPayload =
    parsedPayload && typeof parsedPayload === 'object' ? { ...parsedPayload } : {};

  const shouldRemoveProfileImage =
    normalizedPayload.removeProfileImage === true ||
    normalizedPayload.removeProfileImage === 'true';

  delete normalizedPayload.removeProfileImage;

  if (shouldRemoveProfileImage && existingUser.profileImage && !(file && file.location)) {
    try {
      await deleteFile(existingUser.profileImage);
    } catch (error) {
      console.error('Failed to delete profile image from S3:', error);
    }

    profileImage = null;
  }

  // If new file is uploaded, delete old file from S3 and use new file URL
  if (file && file.location) {
    // Delete old profile image from S3 if it exists
    if (existingUser.profileImage) {
      try {
        await deleteFile(existingUser.profileImage);
      } catch (error) {
        console.error('Failed to delete old profile image:', error);
        // Continue with update even if deletion fails
      }
    }

    // Use S3 URL from multer-s3 (file.location contains the full S3 URL)
    profileImage = file.location;
  }

  if (Object.prototype.hasOwnProperty.call(normalizedPayload, 'gender')) {
    const normalizedGender = normalizeGender(normalizedPayload.gender);

    if (!normalizedGender) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid gender value');
    }

    normalizedPayload.gender = normalizedGender;
  }

  const updatedUser = await prisma.user.update({
    where: { id },
    data: {
      profileImage,
      ...normalizedPayload,
    },
  });

  const { password, ...rest } = updatedUser;
  return Object.fromEntries(Object.entries(rest).filter(([_, v]) => v !== null));
};

const changePasswordInDB = async (
  user: any,
  payload: {
    oldPassword: string;
    newPassword: string;
  },
) => {
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
