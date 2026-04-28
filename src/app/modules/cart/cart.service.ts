import httpStatus from 'http-status';
import redisClient from '../../../config/redis';
import prisma from '../../../shared/prisma';
import ApiError from '../../errors/ApiErrors';
import { socketManager } from '../../helpers/socketManager';
import { NotificationService } from '../notifications/notifications.service';
import { promoCodesService } from '../promo-codes/services/promo-codes.service';
import stateRestrictionService from '../stateRestriction/stateRestriction.service';
import { CartRepository } from './repositories/cart.repository';

type CartSummary = {
  laboratoryId: string | null;
  laboratoryCode: string | null;
  items: Array<{
    id: string;
    labTestId: string;
    testId: string;
    testName: string;
    laboratoryId: string;
    laboratoryCode: string;
    quantity: number;
    baseRetailPrice: number;
    effectiveUnitPrice: number;
    lineTotal: number;
    drawCenterId: string | null;
  }>;
  subtotal: number;
  discount: number;
  total: number;
  promoCode: string | null;
  promoClamped: boolean;
  lastSyncAt: Date;
};

type CartItemInput = {
  labTestId: string;
  quantity: number;
  drawCenterId?: string | null;
};

type CartSyncInput = {
  userId: string;
  localItems: CartItemInput[];
  clientTimestamp: Date;
  sourceDeviceId?: string;
};

const CART_LOCK_TTL_SECONDS = 15 * 60;
const cartLockKey = (userId: string) => `cart:lock:${userId}`;

class CartService {
  private readonly repository = new CartRepository();

  private round2(value: number) {
    return Math.round((value + Number.EPSILON) * 100) / 100;
  }

  private async resolveLabTest(labTestId: string) {
    return prisma.labTest.findUnique({
      where: { id: labTestId },
      include: {
        test: true,
        laboratory: true,
      },
    });
  }

  private emitCartUpdated(userId: string, cart: CartSummary, sourceDeviceId?: string) {
    socketManager.emitToUser(userId, 'cart:updated', {
      cart,
      sourceDeviceId: sourceDeviceId || null,
      updatedAt: new Date().toISOString(),
    });
  }

  private async assertCartIsMutable(userId: string) {
    const lock = await this.getCartLock(userId);
    if (lock.locked) {
      throw new ApiError(httpStatus.CONFLICT, 'Cart is locked while checkout is being processed');
    }
  }

  async getCartLock(userId: string) {
    const key = cartLockKey(userId);
    const [raw, ttl] = await Promise.all([redisClient.get(key), redisClient.ttl(key)]);
    if (!raw || ttl <= 0) {
      return { locked: false, expiresAt: null, ttlSeconds: 0, reason: null };
    }

    let reason: string | null = null;
    try {
      reason = JSON.parse(raw).reason || null;
    } catch {
      reason = raw;
    }

    return {
      locked: true,
      expiresAt: new Date(Date.now() + ttl * 1000),
      ttlSeconds: ttl,
      reason,
    };
  }

  async lockCart(input: { userId: string; ttlSeconds?: number; reason?: string }) {
    const ttlSeconds = input.ttlSeconds || CART_LOCK_TTL_SECONDS;
    const reason = input.reason || 'checkout';
    await redisClient.set(
      cartLockKey(input.userId),
      JSON.stringify({ reason, lockedAt: new Date().toISOString() }),
      'EX',
      ttlSeconds,
    );

    const lock = await this.getCartLock(input.userId);
    socketManager.emitToUser(input.userId, 'cart:locked', lock);
    return lock;
  }

  async unlockCart(userId: string) {
    await redisClient.del(cartLockKey(userId));
    socketManager.emitToUser(userId, 'cart:unlocked', {
      locked: false,
      expiresAt: null,
      ttlSeconds: 0,
      reason: null,
    });
  }

  async addItem(input: {
    userId: string;
    labTestId: string;
    quantity: number;
    drawCenterId?: string;
  }) {
    await this.assertCartIsMutable(input.userId);
    const candidate = await this.resolveLabTest(input.labTestId);

    if (!candidate || !candidate.isAvailable || !candidate.isVisible || !candidate.test.isActive) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Selected test is not available');
    }

    if (!candidate.laboratory.isActive || !candidate.laboratory.isVisibleToCustomers) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Selected laboratory is not active');
    }

    if ((candidate.laboratory.code || '').toUpperCase() !== 'ACCESS') {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Only ACCESS laboratory is active');
    }

    const existingCart = await this.repository.findUserCart(input.userId);
    const existingLaboratoryId = existingCart[0]?.laboratoryId;
    if (existingLaboratoryId && existingLaboratoryId !== candidate.laboratoryId) {
      throw new ApiError(httpStatus.CONFLICT, 'Cart can contain tests from only one laboratory');
    }

    if (input.drawCenterId) {
      const drawCenter = await prisma.drawCenter.findUnique({
        where: { id: input.drawCenterId },
      });
      if (!drawCenter || drawCenter.laboratoryId !== candidate.laboratoryId) {
        throw new ApiError(
          httpStatus.BAD_REQUEST,
          'Draw center does not belong to the cart laboratory',
        );
      }
    }

    const baseRetailPrice = Number(candidate.retailPrice);
    const effectiveUnitPrice = Number(candidate.salePrice ?? candidate.retailPrice);

    await this.repository.upsertItem({
      where: {
        userId_labTestId: {
          userId: input.userId,
          labTestId: input.labTestId,
        },
      },
      create: {
        userId: input.userId,
        testId: candidate.testId,
        laboratoryId: candidate.laboratoryId,
        labTestId: candidate.id,
        drawCenterId: input.drawCenterId || null,
        quantity: input.quantity,
        currency: candidate.currency,
        baseRetailPrice,
        effectiveUnitPrice,
      },
      update: {
        quantity: input.quantity,
        drawCenterId: input.drawCenterId || null,
        currency: candidate.currency,
        baseRetailPrice,
        effectiveUnitPrice,
      },
    });

    const cart = await this.getCart(input.userId);
    this.emitCartUpdated(input.userId, cart);
    return cart;
  }

  async getCart(userId: string, promoCode?: string): Promise<CartSummary> {
    const items = await this.repository.findUserCart(userId);
    return this.buildCartSummary(items, promoCode);
  }

  async updateItem(input: {
    userId: string;
    itemId: string;
    quantity?: number;
    drawCenterId?: string | null;
  }) {
    await this.assertCartIsMutable(input.userId);
    const existing = await this.repository.findItemById(input.itemId);
    if (!existing || existing.userId !== input.userId) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Cart item not found');
    }

    if (input.drawCenterId) {
      const drawCenter = await prisma.drawCenter.findUnique({
        where: { id: input.drawCenterId },
      });
      if (!drawCenter || drawCenter.laboratoryId !== existing.laboratoryId) {
        throw new ApiError(
          httpStatus.BAD_REQUEST,
          'Draw center does not belong to the cart laboratory',
        );
      }
    }

    await this.repository.updateItem({
      where: { id: input.itemId },
      data: {
        ...(input.quantity ? { quantity: input.quantity } : {}),
        ...(input.drawCenterId !== undefined ? { drawCenterId: input.drawCenterId } : {}),
      },
    });

    const cart = await this.getCart(input.userId);
    this.emitCartUpdated(input.userId, cart);
    return cart;
  }

  async removeItem(userId: string, itemId: string) {
    await this.assertCartIsMutable(userId);
    const existing = await this.repository.findItemById(itemId);
    if (!existing || existing.userId !== userId) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Cart item not found');
    }

    await this.repository.deleteItem(itemId);
    const cart = await this.getCart(userId);
    this.emitCartUpdated(userId, cart);
    return cart;
  }

  async validateCart(input: { userId: string; req: any; state?: string; promoCode?: string }) {
    const cart = await this.getCart(input.userId, input.promoCode);

    if (!cart.items.length) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Cart is empty');
    }

    for (const item of cart.items) {
      const restrictionStatus = await stateRestrictionService.getLocationStatus({
        req: input.req,
        checkoutState: input.state,
        testId: item.testId,
        laboratoryId: item.laboratoryId,
        laboratoryCode: cart.laboratoryCode || undefined,
      });

      if (!restrictionStatus.canOrder) {
        throw new ApiError(
          httpStatus.FORBIDDEN,
          restrictionStatus.reason || 'This test cannot be ordered for the selected location',
        );
      }
    }

    return cart;
  }

  /**
   * Sync cart from device: Merges local cart items with server cart
   * Server state is considered source of truth for timestamps
   * - If item exists on server with newer timestamp: keep server version
   * - If item exists on server with older timestamp: update with client version
   * - If item only on client: add it
   * - If item quantity is 0: remove it
   */
  async syncCart(input: CartSyncInput): Promise<CartSummary> {
    await this.assertCartIsMutable(input.userId);
    const serverItems = await this.repository.findUserCart(input.userId);
    let changed = false;

    // Process each local item
    for (const localItem of input.localItems) {
      const serverItem = serverItems.find((si) => si.labTestId === localItem.labTestId);

      if (localItem.quantity === 0) {
        // Remove item if quantity is 0
        if (serverItem) {
          await this.repository.deleteItem(serverItem.id);
          changed = true;
        }
      } else if (serverItem) {
        // Item exists on server - update if client is newer
        const serverUpdatedAt = serverItem.updatedAt.getTime();
        const clientTimestamp = input.clientTimestamp.getTime();

        // Only update if client is newer
        if (clientTimestamp >= serverUpdatedAt) {
          await this.repository.updateItem({
            where: { id: serverItem.id },
            data: {
              quantity: localItem.quantity,
              drawCenterId: localItem.drawCenterId || null,
            },
          });
          changed = true;
        }
      } else {
        // Item doesn't exist on server - add it
        try {
          const candidate = await this.resolveLabTest(localItem.labTestId);

          if (
            !candidate ||
            !candidate.isAvailable ||
            !candidate.isVisible ||
            !candidate.test.isActive
          ) {
            continue; // Skip invalid items
          }

          if (!candidate.laboratory.isActive || !candidate.laboratory.isVisibleToCustomers) {
            continue;
          }

          if ((candidate.laboratory.code || '').toUpperCase() !== 'ACCESS') {
            continue;
          }

          if (localItem.drawCenterId) {
            const drawCenter = await prisma.drawCenter.findUnique({
              where: { id: localItem.drawCenterId },
            });
            if (!drawCenter || drawCenter.laboratoryId !== candidate.laboratoryId) {
              continue;
            }
          }

          const currentCart = await this.repository.findUserCart(input.userId);
          const existingLaboratoryId = currentCart[0]?.laboratoryId;
          if (existingLaboratoryId && existingLaboratoryId !== candidate.laboratoryId) {
            continue;
          }

          const baseRetailPrice = Number(candidate.retailPrice);
          const effectiveUnitPrice = Number(candidate.salePrice ?? candidate.retailPrice);

          await this.repository.upsertItem({
            where: {
              userId_labTestId: {
                userId: input.userId,
                labTestId: localItem.labTestId,
              },
            },
            create: {
              userId: input.userId,
              testId: candidate.testId,
              laboratoryId: candidate.laboratoryId,
              labTestId: candidate.id,
              drawCenterId: localItem.drawCenterId || null,
              quantity: localItem.quantity,
              currency: candidate.currency,
              baseRetailPrice,
              effectiveUnitPrice,
            },
            update: {
              quantity: localItem.quantity,
              drawCenterId: localItem.drawCenterId || null,
            },
          });
          changed = true;
        } catch (error) {
          // Skip items that fail validation
          console.error(`Failed to sync cart item ${localItem.labTestId}:`, error);
          continue;
        }
      }
    }

    const cart = await this.getCart(input.userId);
    if (changed) {
      this.emitCartUpdated(input.userId, cart, input.sourceDeviceId);
      if (input.sourceDeviceId) {
        void NotificationService.sendCustomNotification(
          input.userId,
          'ADMIN_ANNOUNCEMENT',
          'Cart updated',
          'Your cart was updated on a signed-in device.',
          {
            type: 'CART_UPDATED',
            sourceDeviceId: input.sourceDeviceId,
            clickAction: '/cart',
          },
          null,
        ).catch((error) => {
          console.error('Failed to dispatch cart update notification:', error);
        });
      }
    }
    return cart;
  }

  async clearCart(userId: string) {
    await this.repository.deleteManyByUserId(userId);
    await this.unlockCart(userId);
    const cart = await this.getCart(userId);
    this.emitCartUpdated(userId, cart);
  }

  private async buildCartSummary(items: Array<any>, promoCode?: string): Promise<CartSummary> {
    const normalizedItems = items.map((item) => ({
      id: item.id,
      labTestId: item.labTestId,
      testId: item.testId,
      testName: item.test.name,
      laboratoryId: item.laboratoryId,
      laboratoryCode: item.laboratory.code,
      quantity: item.quantity,
      baseRetailPrice: Number(item.baseRetailPrice),
      effectiveUnitPrice: Number(item.effectiveUnitPrice),
      lineTotal: this.round2(Number(item.effectiveUnitPrice) * item.quantity),
      drawCenterId: item.drawCenterId || null,
      labCost: Number(item.labTest.labCost),
    }));

    const subtotal = this.round2(normalizedItems.reduce((sum, item) => sum + item.lineTotal, 0));
    let discount = 0;
    let promoClamped = false;

    if (promoCode) {
      const promo = await promoCodesService.validateForCheckout({
        code: promoCode,
        subtotal,
        items: normalizedItems.map((item) => ({
          quantity: item.quantity,
          effectiveUnitPrice: item.effectiveUnitPrice,
          labCost: item.labCost,
        })),
      });

      discount = this.round2(promo.appliedDiscount);
      promoClamped = promo.clamped;
    }

    return {
      laboratoryId: normalizedItems[0]?.laboratoryId || null,
      laboratoryCode: normalizedItems[0]?.laboratoryCode || null,
      items: normalizedItems.map(({ labCost, ...item }) => item),
      subtotal,
      discount,
      total: this.round2(subtotal - discount),
      promoCode: promoCode || null,
      promoClamped,
      lastSyncAt: new Date(),
    };
  }
}

export const cartService = new CartService();
