import ApiError from '../../../../errors/ApiErrors';
import { accessCsvService } from '../../../../services/accessCsv.service';
import { accessUploadService } from '../../../../services/accessUpload.service';
import {
  LabProvider,
  LabSubmissionAggregate,
  LabSubmissionResult,
} from '../../contracts/lab-provider.interface';

export class AccessLabProvider implements LabProvider {
  readonly code = 'ACCESS';

  async validateSubmission(aggregate: LabSubmissionAggregate): Promise<void> {
    if (!aggregate.patient) {
      throw new ApiError(400, 'Order patient information is required before ACCESS submission');
    }

    if (!aggregate.items.length) {
      throw new ApiError(400, 'Order has no items to submit to ACCESS');
    }
  }

  async buildSubmissionPayload(aggregate: LabSubmissionAggregate): Promise<Record<string, unknown>> {
    const order = aggregate.order as Record<string, unknown>;
    const patient = aggregate.patient || {};
    const items = aggregate.items || [];

    return {
      orderId: order.id,
      orderNumber: order.orderNumber,
      patient,
      items,
      // TODO: Replace this generic payload builder with confirmed ACCESS contract fields.
    };
  }

  async submitOrder(aggregate: LabSubmissionAggregate): Promise<LabSubmissionResult> {
    const payload = await this.buildSubmissionPayload(aggregate);

    try {
      const orderId = String((aggregate.order as Record<string, unknown>).id || '');
      const firstItem = aggregate.items[0] as Record<string, unknown>;
      const accessPayload = {
        testCode: firstItem?.labTestCode,
        collectionType: 'PSC',
        patient: aggregate.patient || {},
        orderNumber: String((aggregate.order as Record<string, unknown>).orderNumber || ''),
      };

      const { csvContent, s3Url } = await accessCsvService.generateCsv(orderId, accessPayload as never);
      const uploadResult = await accessUploadService.uploadCsv(s3Url);

      return {
        success: true,
        retryable: false,
        externalOrderId: uploadResult.accessOrderId,
        requisition: {
          requisitionPdfUrl: uploadResult.requisitionPdfUrl || null,
          drawCenterSnapshot: uploadResult.confirmedLabLocation || null,
        },
        rawPayload: {
          ...payload,
          csvPreview: csvContent.slice(0, 500),
        },
        rawResponse: {
          accessOrderId: uploadResult.accessOrderId,
          requisitionPdfUrl: uploadResult.requisitionPdfUrl || null,
          confirmedLabLocation: uploadResult.confirmedLabLocation || null,
        },
      };
    } catch (error) {
      return {
        success: false,
        retryable: true,
        rawPayload: payload,
        rawResponse: null,
        errorMessage: error instanceof Error ? error.message : 'ACCESS submission failed',
      };
    }
  }

  async scheduleResultSync(_orderId: string): Promise<void> {
    // TODO: Hook repeatable ACCESS results sync once final result retrieval contract is confirmed.
  }
}
