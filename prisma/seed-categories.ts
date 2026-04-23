import { PrismaClient } from '@prisma/client';
import { CATEGORY_SEED_ROWS } from './seed-utils';

const prisma = new PrismaClient();

async function seedCategories() {
  let createdCount = 0;
  let updatedCount = 0;

  try {
    const existingCategories = await prisma.testCategory.findMany({
      select: { slug: true },
    });
    const existingSlugs = new Set(existingCategories.map((category) => category.slug));

    for (const category of CATEGORY_SEED_ROWS) {
      const existed = existingSlugs.has(category.slug);

      await prisma.testCategory.upsert({
        where: { slug: category.slug },
        update: {
          name: category.name,
          sortOrder: category.sortOrder,
          isActive: true,
        },
        create: {
          name: category.name,
          slug: category.slug,
          sortOrder: category.sortOrder,
          isActive: true,
        },
      });

      if (existed) {
        updatedCount += 1;
        console.log(`Updated category: ${category.slug}`);
      } else {
        createdCount += 1;
        existingSlugs.add(category.slug);
        console.log(`Created category: ${category.slug}`);
      }
    }

    console.log(`Categories created: ${createdCount}`);
    console.log(`Categories updated: ${updatedCount}`);
  } finally {
    await prisma.$disconnect();
  }
}

seedCategories().catch((error) => {
  console.error('Category seed failed', error);
  process.exitCode = 1;
});
