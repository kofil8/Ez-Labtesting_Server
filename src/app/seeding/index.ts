import * as bcrypt from 'bcrypt';
import config from '../../config';
import { prisma } from '../../config/db';
import { seedNotificationTemplates } from './notificationTemplates';

const seedSuperAdmin = async (): Promise<void> => {
  try {
    const {
      super_admin_email,
      super_admin_password,
      super_admin_is_verified,
      super_admin_first_name,
      super_admin_last_name,
      super_admin_phone,
      salt,
    } = config;

    // ✅ Check if super admin already exists
    const isSuperAdminExists = await prisma.user.findUnique({
      where: { email: super_admin_email },
    });

    if (!isSuperAdminExists) {
      const hashedPassword = await bcrypt.hash(super_admin_password as string, Number(salt) || 12);

      await prisma.user.create({
        data: {
          firstName: super_admin_first_name,
          lastName: super_admin_last_name,
          email: super_admin_email,
          password: hashedPassword,
          phoneNumber: super_admin_phone,
          isVerified: super_admin_is_verified,
          role: 'SUPER_ADMIN',
        },
      });

      console.log('✅ Super Admin created successfully 🚀');
    } else {
      console.log('ℹ️ Super Admin already exists, skipping seeding.');
    }

    // ✅ Seed notification templates
    await seedNotificationTemplates();
  } catch (error) {
    console.error('❌ Error seeding Super Admin:', error);
  }
};

export default seedSuperAdmin;
