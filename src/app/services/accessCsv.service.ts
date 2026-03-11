import { PutObjectCommand } from '@aws-sdk/client-s3';
import config from '../../config';
import { s3Client } from '../../lib/awsS3';

interface AccessPatientInfo {
  firstName: string;
  lastName: string;
  dateOfBirth: string; // MMDDYYYY
  gender: 'M' | 'F' | 'O';
  phone: string; // 10 digits
  email: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  middleInitial?: string;
  race?: string;
}

interface AccessOrderPayload {
  testCode: string;
  collectionType: string; // PSC
  patient: AccessPatientInfo;
  physicianNumber?: string;
  collectionDate?: string; // MMDDYYYY
  collectionTime?: string; // HHMM
  orderComment?: string;
  source?: string;
  docchart?: string;
  orderNumber?: string;
}

interface CsvGenerationResult {
  csvContent: string;
  s3Url: string;
}

class AccessCsvService {
  private readonly S3_FOLDER = 'access-csv';

  /**
   * Generate ACCESS Lab CSV file from order payload and upload to S3
   */
  async generateCsv(orderId: string, payload: AccessOrderPayload): Promise<CsvGenerationResult> {
    console.log('[AccessCsv] Generating CSV for order:', orderId);

    // Build CSV content
    const csvContent = this.buildCsvContent(payload);

    // Generate unique filename
    const timestamp = new Date().getTime();
    const filename = `order_${orderId}_${timestamp}.csv`;
    const s3Key = `${this.S3_FOLDER}/${filename}`;

    // Upload to S3
    try {
      await s3Client.send(
        new PutObjectCommand({
          Bucket: config.aws.s3BucketName,
          Key: s3Key,
          Body: csvContent,
          ContentType: 'text/csv',
        }),
      );

      const s3Url = `https://${config.aws.s3BucketName}.s3.${config.aws.region}.amazonaws.com/${s3Key}`;

      console.log('[AccessCsv] CSV file uploaded to S3:', s3Url);

      return {
        csvContent,
        s3Url,
      };
    } catch (error) {
      console.error('[AccessCsv] Failed to upload CSV to S3:', error);
      throw error;
    }
  }

  /**
   * Build CSV content matching ACCESS Lab exact format
   * CSV Format (comma-separated, no quotes):
   * LastName,FirstName,MI,DOB,Gender,Phone,Email,Address,City,State,Zip,Race,TestCode,CollectionType,PhysicianNumber,CollectionDate,CollectionTime,InsuranceNumber,OrderComment,Source,DocChart,OrderNumber
   */
  private buildCsvContent(payload: AccessOrderPayload): string {
    const { patient, testCode, collectionType } = payload;

    // Header row
    const headers = [
      'LastName',
      'FirstName',
      'MI',
      'DOB',
      'Gender',
      'Phone',
      'Email',
      'Address',
      'City',
      'State',
      'Zip',
      'Race',
      'TestCode',
      'CollectionType',
      'PhysicianNumber',
      'CollectionDate',
      'CollectionTime',
      'InsuranceNumber',
      'OrderComment',
      'Source',
      'DocChart',
      'OrderNumber',
    ];

    // Data row
    const dataRow = [
      patient.lastName || '',
      patient.firstName || '',
      patient.middleInitial || '',
      patient.dateOfBirth || '', // MMDDYYYY
      patient.gender || '',
      patient.phone || '', // 10 digits
      patient.email || '',
      patient.address || '',
      patient.city || '',
      patient.state || '',
      patient.zip || '',
      patient.race || '',
      testCode || '',
      collectionType || 'PSC',
      payload.physicianNumber || '',
      payload.collectionDate || '',
      payload.collectionTime || '',
      '',
      payload.orderComment || '',
      payload.source || '',
      payload.docchart || '',
      payload.orderNumber || '',
    ];

    // Validate required fields
    this.validateRequiredFields(dataRow);

    // Build CSV (no quotes around fields)
    const csvLines = [headers.join(','), dataRow.join(',')];

    return csvLines.join('\n');
  }

  /**
   * Validate required fields are present
   */
  private validateRequiredFields(dataRow: string[]) {
    const requiredIndices = {
      lastName: 0,
      firstName: 1,
      dob: 3,
      gender: 4,
      phone: 5,
      email: 6,
      testCode: 12,
      collectionType: 13,
    };

    const errors: string[] = [];

    if (!dataRow[requiredIndices.lastName]) {
      errors.push('LastName is required');
    }

    if (!dataRow[requiredIndices.firstName]) {
      errors.push('FirstName is required');
    }

    if (!dataRow[requiredIndices.dob]) {
      errors.push('DOB is required');
    } else if (!/^\d{8}$/.test(dataRow[requiredIndices.dob])) {
      errors.push('DOB must be in MMDDYYYY format (8 digits)');
    }

    if (!dataRow[requiredIndices.gender]) {
      errors.push('Gender is required');
    } else if (!['M', 'F', 'O'].includes(dataRow[requiredIndices.gender])) {
      errors.push('Gender must be M, F, or O');
    }

    if (!dataRow[requiredIndices.phone]) {
      errors.push('Phone is required');
    } else if (!/^\d{10}$/.test(dataRow[requiredIndices.phone])) {
      errors.push('Phone must be 10 digits');
    }

    if (!dataRow[requiredIndices.email]) {
      errors.push('Email is required');
    }

    if (!dataRow[requiredIndices.testCode]) {
      errors.push('TestCode is required');
    }

    if (!dataRow[requiredIndices.collectionType]) {
      errors.push('CollectionType is required');
    }

    if (errors.length > 0) {
      throw new Error(`CSV validation failed: ${errors.join(', ')}`);
    }
  }
}

export const accessCsvService = new AccessCsvService();
