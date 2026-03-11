import { GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { s3Client } from './awsS3';
import config from '../config';

/**
 * Parses common S3 HTTPS URL formats to { bucket, key }.
 * Supports:
 * - https://<bucket>.s3.<region>.amazonaws.com/<key>
 * - https://s3.<region>.amazonaws.com/<bucket>/<key>
 */
export function parseS3Url(url: string): { bucket: string; key: string } | null {
  try {
    const u = new URL(url);
    const host = u.hostname;
    const pathname = u.pathname.startsWith('/') ? u.pathname.slice(1) : u.pathname;

    // virtual-hosted style: <bucket>.s3.<region>.amazonaws.com
    const vh = host.match(/^([^.]+)\.s3[.-][^.]+\.amazonaws\.com$/);
    if (vh && vh[1]) {
      return { bucket: vh[1], key: decodeURIComponent(pathname) };
    }

    // path style: s3.<region>.amazonaws.com/<bucket>/<key>
    const ps = host.match(/^s3[.-][^.]+\.amazonaws\.com$/);
    if (ps) {
      const [bucket, ...rest] = pathname.split('/');
      if (!bucket || rest.length === 0) return null;
      return { bucket, key: decodeURIComponent(rest.join('/')) };
    }

    return null;
  } catch {
    return null;
  }
}

export async function signS3GetObject(params: {
  bucket?: string;
  key?: string;
  url?: string;
  expiresInSeconds: number;
}) {
  let bucket = params.bucket;
  let key = params.key;

  if ((!bucket || !key) && params.url) {
    const parsed = parseS3Url(params.url);
    if (parsed) {
      bucket = parsed.bucket;
      key = parsed.key;
    }
  }

  if (!bucket || !key) {
    // fallback to configured bucket if only key is embedded as a full URL elsewhere
    throw new Error('Unable to resolve S3 bucket/key for signing');
  }

  const command = new GetObjectCommand({ Bucket: bucket, Key: key });
  return await getSignedUrl(s3Client, command, { expiresIn: params.expiresInSeconds });
}
