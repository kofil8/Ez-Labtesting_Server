import { LabSubmissionAggregate } from './lab-provider.interface';

export interface OrderPayloadBuilder {
  build(aggregate: LabSubmissionAggregate): Promise<Record<string, unknown>>;
}
