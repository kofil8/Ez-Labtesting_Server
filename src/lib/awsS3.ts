import { S3Client } from '@aws-sdk/client-s3';
import config from '../config';

// Initialize S3 Client with credentials from environment variables
export const s3Client = new S3Client({
  region: config.aws.region,
  credentials: {
    accessKeyId: config.aws.accessKeyId,
    secretAccessKey: config.aws.secretAccessKey,
  },
});

export default s3Client;
