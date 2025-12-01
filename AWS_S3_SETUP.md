# AWS S3 File Upload Configuration Guide

## Overview

The application has been migrated from local file storage to AWS S3 for handling file uploads. This guide will help you set up AWS S3 for your project.

## Prerequisites

- AWS Account
- AWS CLI installed (optional but recommended)
- Access to AWS IAM console

## Step 1: Create an S3 Bucket

1. Log in to [AWS Console](https://console.aws.amazon.com/)
2. Navigate to **S3** service
3. Click **Create bucket**
4. Configure your bucket:
   - **Bucket name**: Choose a unique name (e.g., `ez-labtesting-uploads`)
   - **AWS Region**: Select your preferred region (e.g., `us-east-1`)
   - **Block Public Access settings**: Uncheck "Block all public access" (we'll set specific permissions)
   - Click **Create bucket**

## Step 2: Configure Bucket CORS

1. Open your bucket
2. Go to **Permissions** tab
3. Scroll to **Cross-origin resource sharing (CORS)**
4. Click **Edit** and add:

```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "PUT", "POST", "DELETE", "HEAD"],
    "AllowedOrigins": ["http://localhost:3000", "https://yourdomain.com"],
    "ExposeHeaders": ["ETag"]
  }
]
```

## Step 3: Set Bucket Policy for Public Read

1. In the **Permissions** tab
2. Scroll to **Bucket policy**
3. Click **Edit** and add:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::YOUR-BUCKET-NAME/*"
    }
  ]
}
```

Replace `YOUR-BUCKET-NAME` with your actual bucket name.

## Step 4: Create IAM User with S3 Access

1. Navigate to **IAM** service
2. Click **Users** → **Add users**
3. Set user name (e.g., `ez-labtesting-s3-user`)
4. Select **Access key - Programmatic access**
5. Click **Next: Permissions**
6. Click **Attach existing policies directly**
7. Select **AmazonS3FullAccess** (or create custom policy for specific bucket)
8. Click through to **Create user**
9. **IMPORTANT**: Save the **Access Key ID** and **Secret Access Key**

### Custom IAM Policy (Recommended - More Secure)

Instead of `AmazonS3FullAccess`, create a custom policy:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": ["s3:PutObject", "s3:GetObject", "s3:DeleteObject", "s3:ListBucket"],
      "Resource": ["arn:aws:s3:::YOUR-BUCKET-NAME", "arn:aws:s3:::YOUR-BUCKET-NAME/*"]
    }
  ]
}
```

## Step 5: Configure Environment Variables

Add the following to your `.env` file:

```env
# AWS S3 Configuration
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-access-key-id-here
AWS_SECRET_ACCESS_KEY=your-secret-access-key-here
AWS_S3_BUCKET_NAME=your-bucket-name-here
```

## Step 6: Test the Setup

1. Start your server:

   ```bash
   yarn dev
   ```

2. Test file upload using the profile image endpoint:

   ```bash
   PATCH /api/v1/profile/update
   ```

3. Upload should return an S3 URL like:
   ```
   https://your-bucket-name.s3.us-east-1.amazonaws.com/uploads/filename-123456789.png
   ```

## Changes Made

### 1. File Upload Helper (`src/app/helpers/fileUploadHelper.ts`)

- ✅ Replaced `multer.diskStorage` with `multer-s3`
- ✅ Files now upload directly to S3
- ✅ Unique filenames using timestamp + random string
- ✅ `deleteFile()` now uses S3 `DeleteObjectCommand`

### 2. Profile Service (`src/app/modules/profile/profile.service.ts`)

- ✅ Uses S3 URL from `file.location` (provided by multer-s3)
- ✅ Deletes old profile image from S3 before uploading new one
- ✅ Fixed bug: now uses correct filename instead of originalname

### 3. AWS S3 Client (`src/lib/awsS3.ts`)

- ✅ New file: Initializes S3Client with credentials

### 4. Configuration (`src/config/index.ts`, `src/config/env.ts`)

- ✅ Added AWS configuration section
- ✅ Environment variable validation for AWS credentials

### 5. App Configuration (`src/app.ts`)

- ✅ Removed static file serving middleware (`/uploads`)
- ✅ Files are now served directly from S3

## File URL Format

**Before (Local):**

```
http://localhost:7001/uploads/profile-pic.png
```

**After (S3):**

```
https://bucket-name.s3.region.amazonaws.com/uploads/profile-pic-1733097600000-123456789.png
```

## Optional: CloudFront CDN Setup

For better performance and cost optimization:

1. Navigate to **CloudFront** in AWS Console
2. Click **Create Distribution**
3. Set **Origin Domain** to your S3 bucket
4. Configure settings and create
5. Update file URLs to use CloudFront domain:
   ```
   https://d1234567890abc.cloudfront.net/uploads/file.png
   ```

## Security Best Practices

1. ✅ **Never commit** `.env` file or AWS credentials
2. ✅ Use **IAM roles** instead of access keys when deploying to AWS (EC2, Lambda, etc.)
3. ✅ Enable **S3 bucket versioning** for data protection
4. ✅ Enable **S3 access logging** for audit trails
5. ✅ Set **lifecycle policies** to automatically delete old files
6. ✅ Use **CloudFront** signed URLs for private content

## Cost Optimization

- **S3 Storage**: ~$0.023 per GB/month (us-east-1)
- **Data Transfer**: First 100 GB free, then ~$0.09 per GB
- **Requests**: GET requests are $0.0004 per 1,000 requests

### Tips:

- Use CloudFront to reduce S3 data transfer costs
- Set lifecycle policies to move old files to S3 Glacier
- Compress images before upload

## Troubleshooting

### Error: "Access Denied"

- Check bucket policy allows public read
- Verify IAM user has correct permissions
- Ensure CORS is configured

### Error: "The bucket does not allow ACLs"

- Go to bucket **Permissions** → **Object Ownership**
- Select **ACLs enabled**

### Error: "Credentials not found"

- Verify `.env` file has all AWS variables
- Check environment variables are loaded correctly
- Restart server after updating `.env`

### Files not accessible

- Check bucket policy allows public `GetObject`
- Verify CORS configuration matches your frontend domain

## Migration Script for Existing Files

If you have existing files in the `uploads/` folder, use this script to migrate them to S3:

```typescript
// scripts/migrate-to-s3.ts
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import fs from 'fs';
import path from 'path';
import { prisma } from '../src/config/db';
import config from '../src/config';

const s3Client = new S3Client({
  region: config.aws.region,
  credentials: {
    accessKeyId: config.aws.accessKeyId,
    secretAccessKey: config.aws.secretAccessKey,
  },
});

async function migrateFiles() {
  const uploadsDir = path.join(process.cwd(), 'uploads');
  const files = fs.readdirSync(uploadsDir);

  for (const file of files) {
    const filePath = path.join(uploadsDir, file);
    const fileContent = fs.readFileSync(filePath);
    const key = `uploads/${file}`;

    // Upload to S3
    await s3Client.send(
      new PutObjectCommand({
        Bucket: config.aws.s3BucketName,
        Key: key,
        Body: fileContent,
      }),
    );

    const s3Url = `https://${config.aws.s3BucketName}.s3.${config.aws.region}.amazonaws.com/${key}`;
    console.log(`Uploaded: ${file} -> ${s3Url}`);

    // Update database URLs
    await prisma.user.updateMany({
      where: {
        profileImage: {
          contains: file,
        },
      },
      data: {
        profileImage: s3Url,
      },
    });
  }

  console.log('Migration complete!');
}

migrateFiles();
```

Run with:

```bash
ts-node scripts/migrate-to-s3.ts
```

## Support

For issues or questions:

- AWS S3 Documentation: https://docs.aws.amazon.com/s3/
- multer-s3 GitHub: https://github.com/badunk/multer-s3
- AWS SDK for JavaScript: https://docs.aws.amazon.com/sdk-for-javascript/

## Summary

Your application now:

- ✅ Uploads files directly to AWS S3
- ✅ Deletes old files when updating
- ✅ Serves files from S3 (no local storage)
- ✅ Uses secure S3 URLs
- ✅ Scales automatically with S3

Remember to configure your AWS credentials in `.env` before testing!
