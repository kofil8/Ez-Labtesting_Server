import multer, { FileFilterCallback } from 'multer';
import multerS3 from 'multer-s3';
import path from 'path';
import { Request } from 'express';
import { DeleteObjectCommand } from '@aws-sdk/client-s3';
import { s3Client } from '../../lib/awsS3';
import config from '../../config';

// Type for multer file
type MulterFile = Express.Multer.File;

// Allowed file extensions for upload
const allowedExtensions = ['.pdf', '.xlsx', '.xls', '.png', '.jpg', '.jpeg', '.gif', '.webp'];

// Max file size (10MB)
const MAX_FILE_SIZE = 10 * 1024 * 1024;

// S3 Storage configuration
const storage = multerS3({
  s3: s3Client,
  bucket: config.aws.s3BucketName,
  contentType: multerS3.AUTO_CONTENT_TYPE,
  metadata: function (req, file, cb) {
    cb(null, { fieldName: file.fieldname });
  },
  key: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    let baseName = path.basename(file.originalname, ext);
    baseName = baseName.replace(/\s+/g, '-'); // Replace spaces with hyphens
    
    // Generate unique filename using timestamp and random string
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const finalName = `uploads/${baseName}-${uniqueSuffix}${ext}`;
    
    cb(null, finalName);
  },
});

// File filter to restrict allowed file types
const fileFilter = (req: Request, file: MulterFile, cb: FileFilterCallback) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowedExtensions.includes(ext)) {
    cb(null, true); // File type is allowed
  } else {
    cb(new Error(`Invalid file type: ${ext}`)); // Reject if file type is not allowed
  }
};

// Multer configuration
const upload = multer({
  storage, // Use S3 storage configuration
  fileFilter, // Apply file filter for type validation
  limits: { fileSize: MAX_FILE_SIZE }, // Set file size limit
});

export const uploadSingle = upload.single('file'); // For handling single file upload
export const uploadMultiple = upload.array('files', 10); // For handling multiple file uploads

// Delete file from S3
export const deleteFile = async (fileUrl: string): Promise<void> => {
  if (!fileUrl) return;

  try {
    // Extract S3 key from URL
    // URL format: https://bucket.s3.region.amazonaws.com/key or https://bucket.s3.amazonaws.com/key
    const url = new URL(fileUrl);
    const key = url.pathname.substring(1); // Remove leading '/'

    console.log('Attempting to delete file from S3:', key);

    const deleteCommand = new DeleteObjectCommand({
      Bucket: config.aws.s3BucketName,
      Key: key,
    });

    await s3Client.send(deleteCommand);
    console.log('File deleted successfully from S3:', key);
  } catch (error) {
    console.error('Error deleting file from S3:', error);
    throw error;
  }
};

export default upload;
