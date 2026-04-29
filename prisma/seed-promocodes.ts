import { DiscountType, PromoCodeStatus } from '@prisma/client';
import prisma from '../src/shared/prisma';

async function main() {
  const now = new Date();
  const expiresAt = new Date(now);
  expiresAt.setFullYear(expiresAt.getFullYear() + 2);

  const promos = [
    {
      code: 'NEW10',
      discountType: DiscountType.PERCENT,
      discountValue: 10,
      minOrder: 0,
      minimumMarginAmount: 0,
      maxUses: 5000,
      startsAt: now,
      expiresAt,
      isActive: true,
      status: PromoCodeStatus.ACTIVE,
    },
  ];

  for (const promo of promos) {
    await prisma.promoCode.upsert({
      where: { code: promo.code },
      update: promo,
      create: promo,
    });
  }

  console.log(`Seeded ${promos.length} promo code(s): ${promos.map((promo) => promo.code).join(', ')}`);
}

main()
  .catch((error) => {
    console.error('Failed to seed promo codes', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
