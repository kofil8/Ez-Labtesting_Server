import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  const adminPassword = await bcrypt.hash("admin123", 10);

  const company = await prisma.company.create({
    data: {
      name: "DevSync Technologies",
      address: "Dhaka, Bangladesh",
      country: "BD",
    },
  });

  const admin = await prisma.user.create({
    data: {
      email: "admin@devsync.com",
      password: adminPassword,
      fullName: "System Admin",
      role: "ADMIN",
      companyId: company.id,
    },
  });

  const team = await prisma.team.create({
    data: {
      name: "Core Development Team",
      companyId: company.id,
      members: { connect: { id: admin.id } },
    },
  });

  console.log("✅ Seed completed successfully!");
}

main()
  .catch((err) => {
    console.error("❌ Seed error:", err);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
