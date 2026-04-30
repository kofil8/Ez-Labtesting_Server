import { Prisma, RequisitionStatus } from '@prisma/client';
import { RequisitionsRepository } from '../repositories/requisitions.repository';

type CreateRequisitionInput = {
  orderId: string;
  orderItemId?: string | null;
  laboratoryId?: string | null;
  providerCode?: string | null;
  requisitionNumber?: string | null;
  requisitionPdfUrl?: string | null;
  requisitionPdfPath?: string | null;
  fileStorageKey?: string | null;
  downloadFileName?: string | null;
  labOrderId?: string | null;
  drawCenterSnapshotJson?: Prisma.InputJsonValue | null;
  rawPayloadJson?: Prisma.InputJsonValue | null;
  rawResponseJson?: Prisma.InputJsonValue | null;
  fileMetadataJson?: Prisma.InputJsonValue | null;
  status?: RequisitionStatus;
};

export class RequisitionsService {
  async create(input: CreateRequisitionInput, tx?: Prisma.TransactionClient) {
    const repository = new RequisitionsRepository(tx);
    return repository.create({
      data: {
        orderId: input.orderId,
        orderItemId: input.orderItemId || null,
        laboratoryId: input.laboratoryId || null,
        providerCode: input.providerCode || null,
        requisitionNumber: input.requisitionNumber || null,
        requisitionPdfUrl: input.requisitionPdfUrl || null,
        requisitionPdfPath: input.requisitionPdfPath || null,
        fileStorageKey: input.fileStorageKey || null,
        downloadFileName: input.downloadFileName || null,
        labOrderId: input.labOrderId || null,
        drawCenterSnapshotJson:
          input.drawCenterSnapshotJson === undefined || input.drawCenterSnapshotJson === null
            ? Prisma.JsonNull
            : input.drawCenterSnapshotJson,
        rawPayloadJson:
          input.rawPayloadJson === undefined || input.rawPayloadJson === null
            ? Prisma.JsonNull
            : input.rawPayloadJson,
        rawResponseJson:
          input.rawResponseJson === undefined || input.rawResponseJson === null
            ? Prisma.JsonNull
            : input.rawResponseJson,
        fileMetadataJson:
          input.fileMetadataJson === undefined || input.fileMetadataJson === null
            ? Prisma.JsonNull
            : input.fileMetadataJson,
        status: input.status || 'READY',
        submittedAt: new Date(),
        readyAt: new Date(),
      },
    });
  }

  async getLatestByOrderId(orderId: string) {
    return new RequisitionsRepository().findLatestByOrderId(orderId);
  }
}

export const requisitionsService = new RequisitionsService();
