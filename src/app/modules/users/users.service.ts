import config from '../../../config';
import bcrypt from 'bcrypt';
import { prisma } from '../../../config/db';

const getUsersFromDB = async () => {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      role: true,
      isVerified: true,
      createdAt: true,
      phoneNumber: true,
    },
  });

  if (!users || users.length === 0) {
    throw new Error('No users found');
  }

  return users;
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
      isVerified: true,
      createdAt: true,
      phoneNumber: true,
      bio: true,
      dateOfBirth: true,
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
  });

  if (!user) {
    throw new Error('User not found');
  }

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

  const hashedPassword = await bcrypt.hash(payload.password, Number(config.salt));

  const newUser = await prisma.user.create({
    data: {
      ...payload,
      password: hashedPassword,
      isVerified: true,
    },
  });
  return {
    id: newUser.id,
    email: newUser.email,
    firstName: newUser.firstName,
    lastName: newUser.lastName,
    role: newUser.role,
  };
};

const updateUserInDB = async (id: string, payload: any) => {
  const user = await prisma.user.findUnique({
    where: { id },
  });
  if (!user) {
    throw new Error('User not found');
  }
  const updatedUser = await prisma.user.update({
    where: { id },
    data: payload,
  });
  return updatedUser;
};

export const UsersService = {
  getUsersFromDB,
  getUserByIdFromDB,
  deleteUserFromDB,
  createUserInDB,
  updateUserInDB,
};
