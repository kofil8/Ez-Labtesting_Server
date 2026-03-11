import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedCategories() {
  console.log('🌱 Seeding categories...');

  const categoryNames = [
    'General Health',
    'Infectious Disease',
    'Autoimmune',
    'Hormones',
    'Immunology',
    'Liver',
    'Nutrition',
    'Thyroid',
    'Renal',
    'Cardiac',
    'Digestive',
    "Women's Health",
    'Cancer',
    'Hematology',
    'Prenatal',
    'Genetics',
    'STD Screening',
    'Toxicology',
    'Allergy & Sensitivity',
    'Endocrine',
    "Men's Health",
    'Mental Health',
    'Neurology',
    'Bone Health',
    'Metabolic',
    'Occupational Health',
    'Reproductive Health',
    'Rheumatology',
  ];

  for (const name of categoryNames) {
    await prisma.category.upsert({
      where: { name },
      create: { name },
      update: { name },
    });
    console.log(`✅ Upserted category: ${name}`);
  }

  console.log('✅ Categories seeded successfully!');
}

async function main() {
  try {
    await seedCategories();
  } catch (error) {
    console.error('Error during seeding:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
});
