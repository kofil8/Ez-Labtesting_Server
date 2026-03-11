import { GetObjectCommand } from '@aws-sdk/client-s3';
import axios from 'axios';
import FormData from 'form-data';
import { env } from '../../config/env';
import { s3Client } from '../../lib/awsS3';
import { serializeError } from '../utils/redactSensitive';
import { accessAuthService } from './accessAuth.service';

interface UploadResult {
  accessOrderId: string;
  requisitionPdfUrl?: string;
  confirmedLabLocation?: {
    siteId?: string;
    name?: string;
    address?: string;
    city?: string;
    state?: string;
    zip?: string;
    latitude?: number;
    longitude?: number;
    formattedAddress?: string;
    raw?: Record<string, string>;
  };
}

class AccessUploadService {
  /**
   * Upload CSV file from S3 to ACCESS Lab API
   */
  async uploadCsv(s3Url: string): Promise<UploadResult> {
    console.log('[AccessUpload] Uploading CSV from S3:', s3Url);

    try {
      // Get session key
      const sessionKey = await accessAuthService.getSessionKey();

      // Download CSV content from S3
      const csvContent = await this.downloadFromS3(s3Url);

      // Prepare form data
      const formData = new FormData();
      formData.append('mode', 'processCSV');
      formData.append('sessionkey', sessionKey);
      formData.append('remoteOrdersFile', csvContent, 'order.csv');

      // Upload URL
      const uploadUrl =
        env.ACCESS_ORDER_URL ||
        `${env.ACCESS_BASE_URL || env.ACCESS_API_URL}/orderAPI_landingPage.html`;

      console.log('[AccessUpload] Sending request to ACCESS Lab API');

      // Send request
      const response = await axios.post(uploadUrl, formData, {
        headers: {
          ...formData.getHeaders(),
        },
        timeout: 30000, // 30 second timeout
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
      });

      const responseText = response.data;

      console.log('[AccessUpload] Response received from ACCESS Lab API');

      // Parse response
      const result = this.parseUploadResponse(responseText);

      console.log('[AccessUpload] Upload successful, ACCESS Order ID:', result.accessOrderId);

      return result;
    } catch (error) {
      console.error('[AccessUpload] Upload failed:', serializeError(error));

      // If session key expired, invalidate cache and retry once
      if (this.isSessionKeyExpiredError(error)) {
        console.log('[AccessUpload] Session key expired, retrying with new session key');
        await accessAuthService.invalidateSessionKey();
        return await this.uploadCsvRetry(s3Url);
      }

      if (axios.isAxiosError(error)) {
        throw new Error(
          `ACCESS Lab upload failed: ${error.message} (Status: ${error.response?.status})`,
        );
      }

      throw new Error(
        `ACCESS Lab upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  /**
   * Download CSV content from S3
   */
  private async downloadFromS3(s3Url: string): Promise<Buffer> {
    console.log('[AccessUpload] Downloading CSV from S3');

    try {
      // Parse S3 URL to extract bucket and key
      const urlParts = s3Url.replace('https://', '').split('.s3');
      const bucket = urlParts[0];
      const keyPart = urlParts[1].substring(urlParts[1].indexOf('/') + 1); // Skip region info
      const key = keyPart.startsWith('/') ? keyPart.substring(1) : keyPart;

      const command = new GetObjectCommand({
        Bucket: bucket,
        Key: key,
      });

      const response = await s3Client.send(command);
      const chunks: Uint8Array[] = [];

      if (response.Body && typeof response.Body.transformToByteArray === 'function') {
        const byteArray = await response.Body.transformToByteArray();
        return Buffer.from(byteArray);
      }

      // Fallback for streaming response
      if (response.Body && 'pipe' in response.Body) {
        return new Promise((resolve, reject) => {
          const chunks: Uint8Array[] = [];
          (response.Body as any).on('data', (chunk: Uint8Array) => chunks.push(chunk));
          (response.Body as any).on('end', () => resolve(Buffer.concat(chunks)));
          (response.Body as any).on('error', reject);
        });
      }

      throw new Error('Unable to read S3 response body');
    } catch (error) {
      console.error('[AccessUpload] Failed to download from S3:', serializeError(error));
      throw error;
    }
  }

  /**
   * Retry upload with fresh session key
   */
  private async uploadCsvRetry(s3Url: string): Promise<UploadResult> {
    console.log('[AccessUpload] Retrying upload with fresh session key');

    const sessionKey = await accessAuthService.getSessionKey();

    // Download CSV content from S3
    const csvContent = await this.downloadFromS3(s3Url);

    const formData = new FormData();
    formData.append('mode', 'processCSV');
    formData.append('sessionkey', sessionKey);
    formData.append('remoteOrdersFile', csvContent, 'order.csv');

    const uploadUrl =
      env.ACCESS_ORDER_URL ||
      `${env.ACCESS_BASE_URL || env.ACCESS_API_URL}/orderAPI_landingPage.html`;

    const response = await axios.post(uploadUrl, formData, {
      headers: {
        ...formData.getHeaders(),
      },
      timeout: 30000,
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
    });

    const responseText = response.data;
    return this.parseUploadResponse(responseText);
  }

  /**
   * Parse upload response to extract ACCESS order ID and requisition PDF URL
   * Expected response format (may vary):
   * Success: orderId=<id>,requisitionUrl=<url>
   * Error: error=<message>
   */
  private parseUploadResponse(responseText: string): UploadResult {
    if (typeof responseText !== 'string') {
      throw new Error('Invalid ACCESS response format');
    }

    // Check for error
    if (responseText.toLowerCase().includes('error=')) {
      const errorMatch = responseText.match(/error=([^,\n]+)/i);
      const errorMessage = errorMatch ? errorMatch[1] : responseText;
      throw new Error(`ACCESS Lab API error: ${errorMessage}`);
    }

    const fields = this.parseKeyValueFields(responseText);

    // Extract order ID (required)
    const accessOrderId =
      this.pickFirstField(fields, ['orderId', 'accessOrderId', 'order_id']) ||
      (responseText.match(/orderId=([^,\n]+)/i)?.[1] ?? '').trim();

    if (!accessOrderId) {
      throw new Error('Failed to extract ACCESS order ID from response');
    }

    // Extract requisition PDF URL (optional)
    const requisitionPdfUrl =
      this.pickFirstField(fields, ['requisitionUrl', 'requisitionPdfUrl', 'pdfUrl']) ||
      responseText.match(/requisitionUrl=([^,\n]+)/i)?.[1]?.trim();

    const confirmedLabLocation = this.extractConfirmedLabLocation(fields);

    return {
      accessOrderId,
      requisitionPdfUrl,
      confirmedLabLocation,
    };
  }

  private parseKeyValueFields(responseText: string): Record<string, string> {
    const result: Record<string, string> = {};
    const keyValuePattern =
      /([A-Za-z0-9_]+)=([\s\S]*?)(?=,\s*[A-Za-z0-9_]+=|\n\s*[A-Za-z0-9_]+=|\r\n\s*[A-Za-z0-9_]+=|$)/g;
    let match: RegExpExecArray | null;

    while ((match = keyValuePattern.exec(responseText)) !== null) {
      const key = (match[1] || '').trim();
      const value = (match[2] || '').trim();
      if (!key || !value) continue;
      result[key.toLowerCase()] = value;
    }

    return result;
  }

  private pickFirstField(fields: Record<string, string>, keys: string[]): string | undefined {
    for (const key of keys) {
      const value = fields[key.toLowerCase()];
      if (value) return value;
    }
    return undefined;
  }

  private parseNumber(value?: string): number | undefined {
    if (!value) return undefined;
    const parsed = Number.parseFloat(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }

  private extractConfirmedLabLocation(fields: Record<string, string>) {
    const siteId = this.pickFirstField(fields, [
      'siteId',
      'labSiteId',
      'collectionSiteId',
      'pscId',
    ]);
    const name = this.pickFirstField(fields, ['siteName', 'labName', 'locationName', 'pscName']);
    const address = this.pickFirstField(fields, ['siteAddress', 'address', 'address1', 'street']);
    const city = this.pickFirstField(fields, ['siteCity', 'city']);
    const state = this.pickFirstField(fields, ['siteState', 'state']);
    const zip = this.pickFirstField(fields, ['siteZip', 'zip', 'postalCode']);
    const latitude = this.parseNumber(
      this.pickFirstField(fields, ['siteLat', 'latitude', 'lat', 'siteLatitude']),
    );
    const longitude = this.parseNumber(
      this.pickFirstField(fields, ['siteLng', 'longitude', 'lng', 'lon', 'siteLongitude']),
    );

    const formattedAddress =
      this.pickFirstField(fields, ['formattedAddress']) ||
      [address, city, state, zip].filter(Boolean).join(', ');

    const hasData = Boolean(
      siteId ||
      name ||
      address ||
      city ||
      state ||
      zip ||
      latitude !== undefined ||
      longitude !== undefined,
    );

    if (!hasData) {
      return undefined;
    }

    return {
      siteId,
      name,
      address,
      city,
      state,
      zip,
      latitude,
      longitude,
      formattedAddress: formattedAddress || undefined,
      raw: fields,
    };
  }

  /**
   * Check if error is due to expired session key
   */
  private isSessionKeyExpiredError(error: unknown): boolean {
    if (axios.isAxiosError(error)) {
      const responseText = error.response?.data;
      if (typeof responseText === 'string') {
        return (
          responseText.toLowerCase().includes('session') ||
          responseText.toLowerCase().includes('expired') ||
          responseText.toLowerCase().includes('invalid key')
        );
      }
    }
    return false;
  }
}

export const accessUploadService = new AccessUploadService();
