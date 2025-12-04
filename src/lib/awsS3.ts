import { S3Client } from '@aws-sdk/client-s3';
import config from '../config';

if (!config.aws.accessKeyId || !config.aws.secretAccessKey) {
  console.error('❌ Missing AWS credentials. Check environment variables.');
  process.exit(1);
}

export const s3Client = new S3Client({
  region: config.aws.region,
  credentials: {
    accessKeyId: config.aws.accessKeyId,
    secretAccessKey: config.aws.secretAccessKey,
  },
});

export default s3Client;
