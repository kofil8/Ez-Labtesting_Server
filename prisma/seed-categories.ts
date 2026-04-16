import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

type SeedCategory = {
  name: string;
  slug: string;
  description: string;
  sortOrder: number;
  isActive: boolean;
};

const categories: SeedCategory[] = [
  {
    name: 'Allergy & Sensitivity',
    slug: 'allergy-and-sensitivity',
    description: 'Allergy & Sensitivity tests and panels',
    sortOrder: 10,
    isActive: true,
  },
  {
    name: 'Autoimmune',
    slug: 'autoimmune',
    description: 'Autoimmune tests and panels',
    sortOrder: 20,
    isActive: true,
  },
  {
    name: 'Bone Health',
    slug: 'bone-health',
    description: 'Bone Health tests and panels',
    sortOrder: 30,
    isActive: true,
  },
  {
    name: 'Cancer',
    slug: 'cancer',
    description: 'Cancer tests and panels',
    sortOrder: 40,
    isActive: true,
  },
  {
    name: 'Cardiac',
    slug: 'cardiac',
    description: 'Cardiac tests and panels',
    sortOrder: 50,
    isActive: true,
  },
  {
    name: 'Digestive',
    slug: 'digestive',
    description: 'Digestive tests and panels',
    sortOrder: 60,
    isActive: true,
  },
  {
    name: 'Endocrine',
    slug: 'endocrine',
    description: 'Endocrine tests and panels',
    sortOrder: 70,
    isActive: true,
  },
  {
    name: 'General Health',
    slug: 'general-health',
    description: 'General Health tests and panels',
    sortOrder: 80,
    isActive: true,
  },
  {
    name: 'Genetics',
    slug: 'genetics',
    description: 'Genetics tests and panels',
    sortOrder: 90,
    isActive: true,
  },
  {
    name: 'Hematology',
    slug: 'hematology',
    description: 'Hematology tests and panels',
    sortOrder: 100,
    isActive: true,
  },
  {
    name: 'Hormones',
    slug: 'hormones',
    description: 'Hormones tests and panels',
    sortOrder: 110,
    isActive: true,
  },
  {
    name: 'Immunology',
    slug: 'immunology',
    description: 'Immunology tests and panels',
    sortOrder: 120,
    isActive: true,
  },
  {
    name: 'Infectious Disease',
    slug: 'infectious-disease',
    description: 'Infectious Disease tests and panels',
    sortOrder: 130,
    isActive: true,
  },
  {
    name: 'Liver',
    slug: 'liver',
    description: 'Liver tests and panels',
    sortOrder: 140,
    isActive: true,
  },
  {
    name: "Men's Health",
    slug: 'mens-health',
    description: "Men's Health tests and panels",
    sortOrder: 150,
    isActive: true,
  },
  {
    name: 'Mental Health',
    slug: 'mental-health',
    description: 'Mental Health tests and panels',
    sortOrder: 160,
    isActive: true,
  },
  {
    name: 'Metabolic',
    slug: 'metabolic',
    description: 'Metabolic tests and panels',
    sortOrder: 170,
    isActive: true,
  },
  {
    name: 'Neurology',
    slug: 'neurology',
    description: 'Neurology tests and panels',
    sortOrder: 180,
    isActive: true,
  },
  {
    name: 'Nutrition',
    slug: 'nutrition',
    description: 'Nutrition tests and panels',
    sortOrder: 190,
    isActive: true,
  },
  {
    name: 'Occupational Health',
    slug: 'occupational-health',
    description: 'Occupational Health tests and panels',
    sortOrder: 200,
    isActive: true,
  },
  {
    name: 'Prenatal',
    slug: 'prenatal',
    description: 'Prenatal tests and panels',
    sortOrder: 210,
    isActive: true,
  },
  {
    name: 'Renal',
    slug: 'renal',
    description: 'Renal tests and panels',
    sortOrder: 220,
    isActive: true,
  },
  {
    name: 'Reproductive Health',
    slug: 'reproductive-health',
    description: 'Reproductive Health tests and panels',
    sortOrder: 230,
    isActive: true,
  },
  {
    name: 'Rheumatology',
    slug: 'rheumatology',
    description: 'Rheumatology tests and panels',
    sortOrder: 240,
    isActive: true,
  },
  {
    name: 'STD',
    slug: 'std',
    description: 'STD tests and panels',
    sortOrder: 250,
    isActive: true,
  },
  {
    name: 'Thyroid',
    slug: 'thyroid',
    description: 'Thyroid tests and panels',
    sortOrder: 260,
    isActive: true,
  },
  {
    name: 'Toxicology',
    slug: 'toxicology',
    description: 'Toxicology tests and panels',
    sortOrder: 270,
    isActive: true,
  },
  {
    name: "Women's Health",
    slug: 'womens-health',
    description: "Women's Health tests and panels",
    sortOrder: 280,
    isActive: true,
  },
];

async function seedCategories() {
  console.log('🌱 Seeding categories...');

  for (const category of categories) {
    await prisma.testCategory.upsert({
      where: { slug: category.slug },
      create: {
        name: category.name,
        slug: category.slug,
        description: category.description,
        sortOrder: category.sortOrder,
        isActive: category.isActive,
      },
      update: {
        name: category.name,
        description: category.description,
        sortOrder: category.sortOrder,
        isActive: category.isActive,
      },
    });

    console.log(`✅ Upserted category: ${category.name} (${category.slug})`);
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
