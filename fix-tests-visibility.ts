/**
 * Quick script to diagnose and fix test visibility issues
 * Run with: ts-node fix-tests-visibility.ts
 */

import { prisma } from './src/config/db';

async function main() {
  console.log('🔍 Checking test database state...\n');

  try {
    // Count total tests
    const totalTests = await prisma.test.count();
    console.log(`📊 Total tests in database: ${totalTests}`);

    // Count published and active tests
    const publishedActive = await prisma.test.count({
      where: { isPublished: true, isActive: true },
    });
    console.log(`✅ Published & Active tests: ${publishedActive}`);

    // Count unpublished or inactive tests
    const notVisible = await prisma.test.count({
      where: {
        OR: [{ isPublished: false }, { isActive: false }],
      },
    });
    console.log(`❌ Unpublished or Inactive tests: ${notVisible}\n`);

    if (notVisible > 0) {
      console.log('🔧 Updating all tests to be published and active...');
      const result = await prisma.test.updateMany({
        where: {},
        data: {
          isPublished: true,
          isActive: true,
        },
      });
      console.log(`✨ Updated ${result.count} tests\n`);
    }

    // Show sample of updated tests
    const samples = await prisma.test.findMany({
      take: 3,
      select: {
        id: true,
        testName: true,
        testCode: true,
        price: true,
        isPublished: true,
        isActive: true,
        category: { select: { name: true } },
      },
    });

    console.log('📝 Sample tests:');
    samples.forEach((test) => {
      console.log(
        `  - ${test.testCode}: ${test.testName} ($${test.price}) [${test.category?.name}]`,
      );
      console.log(`    Published: ${test.isPublished}, Active: ${test.isActive}`);
    });

    console.log('\n✅ All tests should now be visible on the public /tests page');
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
