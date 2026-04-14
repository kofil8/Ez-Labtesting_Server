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
  username: string | null;
  email: string;
  phoneNumber: string | null;
  role: string;
  status: string;
  isVerified: boolean;
  createdAt: Date;
  lastLogin: Date | null;
};

// Valid fields for sorting
const VALID_SORT_FIELDS = [
  'id',
  'firstName',
  'lastName',
  'email',
  'role',
  'status',
  'isVerified',
  'createdAt',
  'lastLogin',
] as const;

const getUsersFromDB = async (
  options?: PaginationOptions & { role?: string; search?: string },
): Promise<PaginatedResponse<UserListItem>> => {
  const paginationParams = getPaginationParams(options);
  let { page, limit, skip, sortBy, sortOrder } = paginationParams;
  const search = ((options as any)?.search || options?.search || '').trim();
  const roleFilter = options?.role;

  // Validate and sanitize sortBy field
  if (!VALID_SORT_FIELDS.includes(sortBy as any)) {
    sortBy = 'createdAt';
  }

  // Build AND conditions to properly combine role and search filters
  const andConditions: any[] = [];

  // Add role filter (default to CUSTOMER and LAB_PARTNER)
  const rolesToFilter: string[] = [];
  if (roleFilter && roleFilter !== 'all') {
    const roles = roleFilter
      .split(',')
      .map((r: string) => r.trim())
      .filter((r) => r);
    if (roles.length > 0) {
      rolesToFilter.push(...roles);
    } else {
      rolesToFilter.push('CUSTOMER', 'LAB_PARTNER');
    }
  } else {
    rolesToFilter.push('CUSTOMER', 'LAB_PARTNER');
  }
  andConditions.push({ role: { in: rolesToFilter } });

  // Add search filter - search across multiple fields
  if (search) {
    andConditions.push({
      OR: [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phoneNumber: { contains: search, mode: 'insensitive' } },
        { username: { contains: search, mode: 'insensitive' } },
      ],
    });
  }

  // Build final where clause using AND to combine all conditions
  const whereClause = andConditions.length > 1 ? { AND: andConditions } : andConditions[0];

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
      username: true,
      email: true,
      phoneNumber: true,
      role: true,
      status: true,
      isVerified: true,
      createdAt: true,
      lastLogin: true,
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
      username: true,
      email: true,
      role: true,
      status: true,
      addressLine1: true,
      addressLine2: true,
      city: true,
      state: true,
      zipCode: true,
      isVerified: true,
      createdAt: true,
      updatedAt: true,
      phoneNumber: true,
      dateOfBirth: true,
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
  const userExists = await prisma.user.findFirst({
    where: {
      OR: [{ email: payload.email }, { phoneNumber: payload.phoneNumber }],
    },
  });

  if (userExists) {
    throw new Error('User with this email or phone number already exists');
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
    status: payload.status || 'INACTIVE',
  };

  // Add optional fields if provided
  if (payload.gender) userData.gender = payload.gender;
  if (payload.dateOfBirth) userData.dateOfBirth = new Date(payload.dateOfBirth);
  if (payload.addressLine1) userData.addressLine1 = payload.addressLine1;
  if (payload.addressLine2) userData.addressLine2 = payload.addressLine2;
  if (payload.city) userData.city = payload.city;
  if (payload.state) userData.state = payload.state;
  if (payload.zipCode) userData.zipCode = payload.zipCode;
  if (payload.bio) userData.bio = payload.bio;

  const newUser = await prisma.user.create({
    data: userData,
  });

  // Return complete user data
  return {
    id: newUser.id,
    email: newUser.email,
    firstName: newUser.firstName,
    lastName: newUser.lastName,
    username: newUser.username,
    phoneNumber: newUser.phoneNumber,
    role: newUser.role,
    status: newUser.status,
    isVerified: newUser.isVerified,
    bio: newUser.bio,
    gender: newUser.gender,
    dateOfBirth: newUser.dateOfBirth?.toISOString(),
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
  if (payload.bio !== undefined) updateData.bio = payload.bio;
  if (payload.addressLine1 !== undefined) updateData.addressLine1 = payload.addressLine1;
  if (payload.addressLine2 !== undefined) updateData.addressLine2 = payload.addressLine2;
  if (payload.city !== undefined) updateData.city = payload.city;
  if (payload.state !== undefined) updateData.state = payload.state;
  if (payload.zipCode !== undefined) updateData.zipCode = payload.zipCode;

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
    username: updatedUser.username,
    phoneNumber: updatedUser.phoneNumber,
    role: updatedUser.role,
    status: updatedUser.status,
    isVerified: updatedUser.isVerified,
    gender: updatedUser.gender,
    dateOfBirth: updatedUser.dateOfBirth?.toISOString(),
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
};
