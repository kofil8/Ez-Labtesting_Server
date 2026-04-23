import { LabSubmissionResult } from './lab-provider.interface';

export interface SubmissionResponseParser {
  parse(rawResponse: unknown): Promise<LabSubmissionResult>;
}
