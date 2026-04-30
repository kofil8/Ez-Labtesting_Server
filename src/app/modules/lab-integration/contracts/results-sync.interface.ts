export interface ResultsSyncProvider {
  schedule(orderId: string): Promise<void>;
}
