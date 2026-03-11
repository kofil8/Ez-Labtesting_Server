import bcrypt from 'bcrypt';
import config from '../../../config';
import { prisma } from '../../../config/db';
import {
  PaginatedResponse,
  PaginationOptions,
  createPaginationMeta,
  getPaginationParams,
} from '../../../shared/utils';

type UserListItem = {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string;
  role: string;
  status: string;
  isVerified: boolean;
  createdAt: Date;
  phoneNumber: string | null;
};

const getUsersFromDB = async (
  options?: PaginationOptions & { role?: string },
): Promise<PaginatedResponse<UserListItem>> => {
  const { page, limit, skip, sortBy, sortOrder } = getPaginationParams(options);
  const searchTerm = options?.searchTerm || '';
  const roleFilter = options?.role;

  // Build where clause for search and role filtering
  const whereClause: any = {
    // Only show CUSTOMER and LAB_PARTNER roles
    role: { in: ['CUSTOMER', 'LAB_PARTNER'] },
  };

  // Add specific role filter if provided
  if (roleFilter && roleFilter !== 'all') {
    const roles = roleFilter.split(',').map((r: string) => r.trim());
    whereClause.role = { in: roles };
  }

  // Add search filter
  if (searchTerm) {
    whereClause.OR = [
      { firstName: { contains: searchTerm, mode: 'insensitive' as any } },
      { lastName: { contains: searchTerm, mode: 'insensitive' as any } },
      { email: { contains: searchTerm, mode: 'insensitive' as any } },
      { phoneNumber: { contains: searchTerm, mode: 'insensitive' as any } },
    ];
  }

  // Get total count
  const totalCount = await prisma.user.count({
    where: whereClause,
  });

  // Get users with pagination and sorting
  const users = await prisma.user.findMany({
    where: whereClause,
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      role: true,
      status: true,
      isVerified: true,
      createdAt: true,
      phoneNumber: true,
    },
    skip,
    take: limit,
    orderBy: {
      [sortBy]: sortOrder,
    },
  });

  return {
    data: users,
    meta: createPaginationMeta(totalCount, page, limit),
  };
};

const getUserByIdFromDB = async (id: string) => {
  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      role: true,
      status: true,
      isVerified: true,
      createdAt: true,
      updatedAt: true,
      phoneNumber: true,
      bio: true,
      dateOfBirth: true,
      address: true,
      bloodType: true,
      allergies: true,
      medicalConditions: true,
      medications: true,
      emergencyContactName: true,
      emergencyContactPhone: true,
      profileImage: true,
      lastLogin: true,
      lastAction: true,
    },
  });

  if (!user) {
    throw new Error('User not found');
  }
  return user;
};

const deleteUserFromDB = async (id: string) => {
  const user = await prisma.user.findUnique({
    where: { id },
    include: {
      _count: {
        select: {
          notifications: true,
        },
      },
    },
  });

  if (!user) {
    throw new Error('User not found');
  }

  // Check if user has active orders (if Order model exists)
  // This can be enhanced based on your schema relationships

  await prisma.user.delete({
    where: { id },
  });

  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
  };
};

const createUserInDB = async (payload: any) => {
  const userExists = await prisma.user.findUnique({
    where: { email: payload.email },
  });

  if (userExists) {
    throw new Error('User with this email already exists');
  }

  // Hash password if provided
  let hashedPassword = payload.password;
  if (payload.password) {
    hashedPassword = await bcrypt.hash(payload.password, Number(config.salt));
  }

  // Prepare user data
  const userData: any = {
    email: payload.email,
    password: hashedPassword,
    firstName: payload.firstName,
    lastName: payload.lastName,
    phoneNumber: payload.phoneNumber,
    role: payload.role || 'CUSTOMER',
    isVerified: payload.isVerified !== undefined ? payload.isVerified : true,
    status: payload.status || 'ACTIVE',
  };

  // Add optional fields if provided
  if (payload.gender) userData.gender = payload.gender;
  if (payload.dateOfBirth) userData.dateOfBirth = new Date(payload.dateOfBirth);
  if (payload.address) userData.address = payload.address;
  if (payload.bloodType) userData.bloodType = payload.bloodType;
  if (payload.allergies) userData.allergies = payload.allergies;
  if (payload.medicalConditions) userData.medicalConditions = payload.medicalConditions;
  if (payload.medications) userData.medications = payload.medications;
  if (payload.emergencyContactName) userData.emergencyContactName = payload.emergencyContactName;
  if (payload.emergencyContactPhone) userData.emergencyContactPhone = payload.emergencyContactPhone;
  if (payload.bio) userData.bio = payload.bio;
  if (payload.profileImage) userData.profileImage = payload.profileImage;

  const newUser = await prisma.user.create({
    data: userData,
  });

  // Return complete user data
  return {
    id: newUser.id,
    email: newUser.email,
    firstName: newUser.firstName,
    lastName: newUser.lastName,
    phoneNumber: newUser.phoneNumber,
    role: newUser.role,
    status: newUser.status,
    isVerified: newUser.isVerified,
    bio: newUser.bio,
    gender: newUser.gender,
    dateOfBirth: newUser.dateOfBirth?.toISOString(),
    address: newUser.address,
    bloodType: newUser.bloodType,
    allergies: newUser.allergies,
    medicalConditions: newUser.medicalConditions,
    medications: newUser.medications,
    emergencyContactName: newUser.emergencyContactName,
    emergencyContactPhone: newUser.emergencyContactPhone,
    profileImage: newUser.profileImage,
    createdAt: newUser.createdAt.toISOString(),
    updatedAt: newUser.updatedAt.toISOString(),
  };
};

const updateUserInDB = async (id: string, payload: any) => {
  const user = await prisma.user.findUnique({
    where: { id },
  });
  if (!user) {
    throw new Error('User not found');
  }

  // Prepare update data
  const updateData: any = {};

  // Only include fields that are provided in the payload
  if (payload.firstName !== undefined) updateData.firstName = payload.firstName;
  if (payload.lastName !== undefined) updateData.lastName = payload.lastName;
  if (payload.phoneNumber !== undefined) updateData.phoneNumber = payload.phoneNumber;
  if (payload.role !== undefined) updateData.role = payload.role;
  if (payload.isVerified !== undefined) updateData.isVerified = payload.isVerified;
  if (payload.status !== undefined) updateData.status = payload.status;
  if (payload.gender !== undefined) updateData.gender = payload.gender;
  if (payload.dateOfBirth !== undefined)
    updateData.dateOfBirth = payload.dateOfBirth ? new Date(payload.dateOfBirth) : null;
  if (payload.address !== undefined) updateData.address = payload.address;
  if (payload.bloodType !== undefined) updateData.bloodType = payload.bloodType;
  if (payload.allergies !== undefined) updateData.allergies = payload.allergies;
  if (payload.medicalConditions !== undefined)
    updateData.medicalConditions = payload.medicalConditions;
  if (payload.medications !== undefined) updateData.medications = payload.medications;
  if (payload.emergencyContactName !== undefined)
    updateData.emergencyContactName = payload.emergencyContactName;
  if (payload.emergencyContactPhone !== undefined)
    updateData.emergencyContactPhone = payload.emergencyContactPhone;
  if (payload.bio !== undefined) updateData.bio = payload.bio;
  if (payload.profileImage !== undefined) updateData.profileImage = payload.profileImage;

  // Update password if provided
  if (payload.password) {
    updateData.password = await bcrypt.hash(payload.password, Number(config.salt));
  }

  const updatedUser = await prisma.user.update({
    where: { id },
    data: updateData,
  });

  // Return complete user data
  return {
    id: updatedUser.id,
    email: updatedUser.email,
    firstName: updatedUser.firstName,
    lastName: updatedUser.lastName,
    phoneNumber: updatedUser.phoneNumber,
    role: updatedUser.role,
    status: updatedUser.status,
    isVerified: updatedUser.isVerified,
    bio: updatedUser.bio,
    gender: updatedUser.gender,
    dateOfBirth: updatedUser.dateOfBirth?.toISOString(),
    address: updatedUser.address,
    bloodType: updatedUser.bloodType,
    allergies: updatedUser.allergies,
    medicalConditions: updatedUser.medicalConditions,
    medications: updatedUser.medications,
    emergencyContactName: updatedUser.emergencyContactName,
    emergencyContactPhone: updatedUser.emergencyContactPhone,
    profileImage: updatedUser.profileImage,
    createdAt: updatedUser.createdAt.toISOString(),
    updatedAt: updatedUser.updatedAt.toISOString(),
  };
};

// Self-update: restricted fields (no role/status/isVerified/email).
const updateMeInDB = async (id: string, payload: any) => {
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) throw new Error('User not found');

  const updateData: any = {};

  if (payload.firstName !== undefined) updateData.firstName = payload.firstName;
  if (payload.lastName !== undefined) updateData.lastName = payload.lastName;
  if (payload.phoneNumber !== undefined) updateData.phoneNumber = payload.phoneNumber;
  if (payload.gender !== undefined) updateData.gender = payload.gender;
  if (payload.dateOfBirth !== undefined)
    updateData.dateOfBirth = payload.dateOfBirth ? new Date(payload.dateOfBirth) : null;
  if (payload.address !== undefined) updateData.address = payload.address;
  if (payload.bloodType !== undefined) updateData.bloodType = payload.bloodType;
  if (payload.allergies !== undefined) updateData.allergies = payload.allergies;
  if (payload.medicalConditions !== undefined) updateData.medicalConditions = payload.medicalConditions;
  if (payload.medications !== undefined) updateData.medications = payload.medications;
  if (payload.emergencyContactName !== undefined)
    updateData.emergencyContactName = payload.emergencyContactName;
  if (payload.emergencyContactPhone !== undefined)
    updateData.emergencyContactPhone = payload.emergencyContactPhone;
  if (payload.bio !== undefined) updateData.bio = payload.bio;
  if (payload.profileImage !== undefined) updateData.profileImage = payload.profileImage;

  if (payload.password) {
    updateData.password = await bcrypt.hash(payload.password, Number(config.salt));
  }

  const updatedUser = await prisma.user.update({ where: { id }, data: updateData });

  return {
    id: updatedUser.id,
    email: updatedUser.email,
    firstName: updatedUser.firstName,
    lastName: updatedUser.lastName,
    phoneNumber: updatedUser.phoneNumber,
    bio: updatedUser.bio,
    gender: updatedUser.gender,
    dateOfBirth: updatedUser.dateOfBirth?.toISOString(),
    address: updatedUser.address,
    bloodType: updatedUser.bloodType,
    allergies: updatedUser.allergies,
    medicalConditions: updatedUser.medicalConditions,
    medications: updatedUser.medications,
    emergencyContactName: updatedUser.emergencyContactName,
    emergencyContactPhone: updatedUser.emergencyContactPhone,
    profileImage: updatedUser.profileImage,
    createdAt: updatedUser.createdAt.toISOString(),
    updatedAt: updatedUser.updatedAt.toISOString(),
  };
};

export const UsersService = {
  getUsersFromDB,
  getUserByIdFromDB,
  deleteUserFromDB,
  createUserInDB,
  updateUserInDB,
  updateMeInDB,
};
