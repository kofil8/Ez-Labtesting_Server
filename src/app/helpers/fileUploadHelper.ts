import { DeleteObjectCommand } from '@aws-sdk/client-s3';
import { randomUUID } from 'crypto';
import { Request, Response, NextFunction } from 'express';
import multer, { FileFilterCallback } from 'multer';
import multerS3 from 'multer-s3';
import path from 'path';
import config from '../../config';
import { s3Client } from '../../lib/awsS3';

// Allowed file types
const allowedImageTypes = new Map<string, Set<string>>([
  ['.png', new Set(['image/png'])],
  ['.jpg', new Set(['image/jpeg'])],
  ['.jpeg', new Set(['image/jpeg'])],
  ['.gif', new Set(['image/gif'])],
  ['.webp', new Set(['image/webp'])],
]);

// Max 10 MB
const MAX_FILE_SIZE = 10 * 1024 * 1024;

// 🔥 DYNAMIC FOLDER SUPPORT → req.s3Folder will come from routes
const storage = multerS3({
  s3: s3Client,
  bucket: config.aws.s3BucketName,
  contentType: multerS3.AUTO_CONTENT_TYPE,

  metadata: (req, file, cb) => {
    cb(null, { fieldName: file.fieldname });
  },

  key: (req: any, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const baseName =
      path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9._-]+/g, '-').slice(0, 80) ||
      'upload';
    const unique = `${Date.now()}-${randomUUID()}`;

    // If route sets req.s3Folder, use it → otherwise default to uploads/
    const folder = req.s3Folder ? `uploads/${req.s3Folder}` : 'uploads';

    cb(null, `${folder}/${baseName}-${unique}${ext}`);
  },
});

// File validation
const fileFilter = (req: Request, file: Express.Multer.File, cb: FileFilterCallback) => {
  const ext = path.extname(file.originalname).toLowerCase();
  const allowedMimeTypes = allowedImageTypes.get(ext);

  if (allowedMimeTypes?.has(file.mimetype)) {
    cb(null, true);
    return;
  }

  cb(new Error(`Invalid image upload type: ${ext || file.mimetype}`));
};

// Multer instance
const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_FILE_SIZE },
});

// Exported middlewares
export const uploadSingle = upload.single('file');
export const uploadMultiple = upload.array('files', 10);

// 🔥 Custom middleware to set folder name per route
export const setS3Folder = (folder: string) => {
  return (req: any, res: Response, next: NextFunction) => {
    req.s3Folder = folder;
    next();
  };
};

// Delete file from S3
export const deleteFile = async (fileUrl: string): Promise<void> => {
  if (!fileUrl) return;

  try {
    const url = new URL(fileUrl);
    const key = decodeURIComponent(url.pathname.substring(1));

    await s3Client.send(
      new DeleteObjectCommand({
        Bucket: config.aws.s3BucketName,
        Key: key,
      }),
    );

    console.log('✔ Deleted from S3:', key);
  } catch (err) {
    console.error('❌ S3 delete error:', err);
    throw err;
  }
};

export default upload;
