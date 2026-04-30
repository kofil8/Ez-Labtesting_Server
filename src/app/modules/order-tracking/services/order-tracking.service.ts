import {
  OrderStatus,
  OrderTrackingEventType,
  Prisma,
  TrackingActorType,
} from '@prisma/client';
import prisma from '../../../../shared/prisma';
import { orderStateMachine } from '../../orders/state-machine/order-state-machine';
import { OrderTrackingRepository } from '../repositories/order-tracking.repository';

type TrackInput = {
  orderId: string;
  eventType: OrderTrackingEventType;
  previousStatus?: OrderStatus | null;
  nextStatus?: OrderStatus | null;
  actorType?: TrackingActorType;
  actorId?: string | null;
  message?: string;
  metadata?: Record<string, unknown> | Prisma.InputJsonValue | null;
};

export class OrderTrackingService {
  async track(input: TrackInput, tx?: Prisma.TransactionClient) {
    const db = tx || prisma;
    const repository = new OrderTrackingRepository(db);
    const nextStatus = input.nextStatus || undefined;
    const step = nextStatus ? orderStateMachine.getStep(nextStatus) : 0;

    await db.order.update({
      where: { id: input.orderId },
      data: {
        ...(nextStatus
          ? {
              currentTrackingStep: step,
              trackingUpdatedAt: new Date(),
              lastTransitionedAt: new Date(),
            }
          : {}),
      },
    });

    return repository.create({
      data: {
        orderId: input.orderId,
        step,
        eventType: input.eventType,
        actorType: input.actorType || 'SYSTEM',
        actorId: input.actorId || null,
        previousStatus: input.previousStatus || null,
        nextStatus: nextStatus || null,
        message: input.message,
        metadata:
          input.metadata === undefined
            ? Prisma.JsonNull
            : (input.metadata as Prisma.InputJsonValue | typeof Prisma.JsonNull),
        occurredAt: new Date(),
      },
    });
  }

  async list(orderId: string) {
    return new OrderTrackingRepository().findByOrderId(orderId);
  }
}

export const orderTrackingService = new OrderTrackingService();
