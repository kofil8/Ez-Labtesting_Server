import { PrismaClient, Role, UserStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const TOTAL_USERS = 100;
const CUSTOMER_COUNT = 90;
const ADMIN_COUNT = 5;
const LAB_PARTNER_COUNT = 5;
const DEFAULT_PASSWORD = 'Test@1234';

type SeedUser = {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  role: Role;
  username: string;
};

const makePhoneNumber = (index: number) => `+1555${index.toString().padStart(7, '0')}`;

const makeEmail = (prefix: string, index: number) =>
  `${prefix}.${index.toString().padStart(3, '0')}@example.com`;

const makeUsername = (prefix: string, index: number) =>
  `${prefix}_${index.toString().padStart(3, '0')}`;

const buildUsers = (): SeedUser[] => {
  const users: SeedUser[] = [];

  for (let index = 1; index <= CUSTOMER_COUNT; index += 1) {
    users.push({
      firstName: 'Seed',
      lastName: `Customer ${index.toString().padStart(3, '0')}`,
      email: makeEmail('customer', index),
      phoneNumber: makePhoneNumber(index),
      role: Role.CUSTOMER,
      username: makeUsername('customer', index),
    });
  }

  for (let index = 1; index <= ADMIN_COUNT; index += 1) {
    const userIndex = CUSTOMER_COUNT + index;

    users.push({
      firstName: 'Seed',
      lastName: `Admin ${index.toString().padStart(3, '0')}`,
      email: makeEmail('admin', index),
      phoneNumber: makePhoneNumber(userIndex),
      role: Role.ADMIN,
      username: makeUsername('admin', index),
    });
  }

  for (let index = 1; index <= LAB_PARTNER_COUNT; index += 1) {
    const userIndex = CUSTOMER_COUNT + ADMIN_COUNT + index;

    users.push({
      firstName: 'Seed',
      lastName: `LabPartner ${index.toString().padStart(3, '0')}`,
      email: makeEmail('lab.partner', index),
      phoneNumber: makePhoneNumber(userIndex),
      role: Role.LAB_PARTNER,
      username: makeUsername('lab_partner', index),
    });
  }

  return users;
};

async function seedUsers() {
  console.log(`🌱 Seeding ${TOTAL_USERS} users...`);

  const hashedPassword = bcrypt.hashSync(DEFAULT_PASSWORD, 10);
  const users = buildUsers();

  let createdCount = 0;
  let updatedCount = 0;

  for (const user of users) {
    const payload = {
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phoneNumber: user.phoneNumber,
      username: user.username,
      password: hashedPassword,
      role: user.role,
      isVerified: true,
      status: UserStatus.ACTIVE,
    };

    const existingUser = await prisma.user.findUnique({
      where: { email: user.email },
      select: { id: true },
    });

    if (existingUser) {
      await prisma.user.update({
        where: { id: existingUser.id },
        data: payload,
      });
      updatedCount += 1;
      continue;
    }

    await prisma.user.create({ data: payload });
    createdCount += 1;
  }

  console.log(`✅ Users seeded. Created: ${createdCount}, Updated: ${updatedCount}`);
  console.log(`🔐 Default password for all seeded users: ${DEFAULT_PASSWORD}`);
}

async function main() {
  try {
    await seedUsers();
  } catch (error) {
    console.error('Error during seeding:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
