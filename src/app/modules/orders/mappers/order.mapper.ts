import { Order, OrderItem, OrderPatient, OrderStatus, PaymentStatus, Prisma } from '@prisma/client';

type OrderWithRelations = Order & {
  orderItems?: OrderItem[];
  patient?: OrderPatient | null;
};

const toNumber = (value: Prisma.Decimal | number | null | undefined) => Number(value || 0);

export const derivePublicOrderStatus = (order: {
  orderStatus: OrderStatus;
  paymentStatus: PaymentStatus;
}) => {
  if (order.orderStatus === 'PAYMENT_FAILED' || order.paymentStatus === 'FAILED') {
    return 'PAYMENT_FAILED';
  }

  return order.orderStatus;
};

export const toOrderSummary = (order: OrderWithRelations) => ({
  id: order.id,
  userId: order.userId,
  orderNumber: order.orderNumber,
  orderStatus: order.orderStatus,
  status: derivePublicOrderStatus(order),
  paymentStatus: order.paymentStatus,
  subtotal: toNumber(order.subtotal),
  tax: toNumber(order.tax),
  processingFee: toNumber(order.processingFee),
  discount: toNumber(order.discount),
  total: toNumber(order.total),
  currency: order.currency,
  customerEmailSnapshot: order.customerEmailSnapshot,
  customerPhoneSnapshot: order.customerPhoneSnapshot,
  paidAt: order.paidAt,
  userConfirmedAt: order.userConfirmedAt,
  submittedToLabAt: order.submittedToLabAt,
  labOrderPlacedAt: order.labOrderPlacedAt,
  requisitionPdfUrl: order.requisitionPdfUrl,
  accessOrderId: order.accessOrderId,
  accessSubmissionStatus: (order as any).accessSubmissionStatus,
  accessErrorMessage: (order as any).accessErrorMessage || null,
  labSubmissionErrorMessage: (order as any).labSubmissionErrorMessage || null,
  labSubmissionErrorCode: (order as any).labSubmissionErrorCode || null,
  cancelledAt: (order as any).cancelledAt || null,
  cancellationReason: (order as any).cancellationReason || null,
  manualReviewRequired: order.manualReviewRequired,
  currentTrackingStep: order.currentTrackingStep,
  createdAt: order.createdAt,
  updatedAt: order.updatedAt,
  itemCount: order.orderItems?.length || 0,
  patient: order.patient
    ? {
        firstName: order.patient.firstName,
        lastName: order.patient.lastName,
        relationToUser: order.patient.relationToUser,
      }
    : null,
});
