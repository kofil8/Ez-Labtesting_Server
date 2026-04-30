export type LabSubmissionAggregate = {
  order: Record<string, unknown>;
  patient: Record<string, unknown> | null;
  items: Record<string, unknown>[];
  drawCenter: Record<string, unknown> | null;
  requisitions: Record<string, unknown>[];
};

export type LabSubmissionResult = {
  success: boolean;
  retryable: boolean;
  externalOrderId?: string | null;
  requisition?: {
    requisitionNumber?: string | null;
    requisitionPdfUrl?: string | null;
    requisitionPdfPath?: string | null;
    drawCenterSnapshot?: Record<string, unknown> | null;
  } | null;
  rawPayload?: Record<string, unknown> | null;
  rawResponse?: Record<string, unknown> | null;
  errorCode?: string | null;
  errorMessage?: string | null;
};

export interface LabProvider {
  readonly code: string;
  validateSubmission(aggregate: LabSubmissionAggregate): Promise<void>;
  buildSubmissionPayload(aggregate: LabSubmissionAggregate): Promise<Record<string, unknown>>;
  submitOrder(aggregate: LabSubmissionAggregate): Promise<LabSubmissionResult>;
  scheduleResultSync(orderId: string): Promise<void>;
}
