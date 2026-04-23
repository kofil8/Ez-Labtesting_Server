export interface RequisitionHandler {
  extract(rawResponse: unknown): Promise<Record<string, unknown>>;
}
