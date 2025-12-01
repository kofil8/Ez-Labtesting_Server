import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

dotenv.config({ path: path.join(process.cwd(), '.env') });

const prisma = new PrismaClient();

// Load config manually for scripts
const config = {
  aws: {
    region: process.env.AWS_REGION as string,
    accessKeyId: process.env.AWS_ACCESS_KEY_ID as string,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY as string,
    s3BucketName: process.env.AWS_S3_BUCKET_NAME as string,
  },
  backend_file_url: process.env.BACKEND_FILE_URL as string,
};

const s3Client = new S3Client({
  region: config.aws.region,
  credentials: {
    accessKeyId: config.aws.accessKeyId,
    secretAccessKey: config.aws.secretAccessKey,
  },
});

async function migrateFilesToS3() {
  console.log('🚀 Starting migration of local files to AWS S3...\n');

  const uploadsDir = path.join(process.cwd(), 'uploads');

  // Check if uploads directory exists
  if (!fs.existsSync(uploadsDir)) {
    console.log('❌ No uploads directory found. Nothing to migrate.');
    return;
  }

  const files = fs.readdirSync(uploadsDir);

  if (files.length === 0) {
    console.log('ℹ️  No files found in uploads directory.');
    return;
  }

  console.log(`📁 Found ${files.length} file(s) to migrate\n`);

  let successCount = 0;
  let failCount = 0;

  for (const file of files) {
    try {
      const filePath = path.join(uploadsDir, file);
      const fileStats = fs.statSync(filePath);

      // Skip if it's a directory
      if (fileStats.isDirectory()) {
        console.log(`⏭️  Skipping directory: ${file}`);
        continue;
      }

      const fileContent = fs.readFileSync(filePath);
      const ext = path.extname(file);
      const contentType = getContentType(ext);
      const key = `uploads/${file}`;

      console.log(`⬆️  Uploading: ${file} (${formatBytes(fileStats.size)})...`);

      // Upload to S3
      await s3Client.send(
        new PutObjectCommand({
          Bucket: config.aws.s3BucketName,
          Key: key,
          Body: fileContent,
          ContentType: contentType,
        }),
      );

      const s3Url = `https://${config.aws.s3BucketName}.s3.${config.aws.region}.amazonaws.com/${key}`;
      console.log(`✅ Uploaded successfully: ${s3Url}`);

      // Update database URLs - find users with old local URLs
      const oldUrl1 = `${config.backend_file_url}/uploads/${file}`;
      const oldUrl2 = `/uploads/${file}`;

      const updateResult = await prisma.user.updateMany({
        where: {
          OR: [{ profileImage: oldUrl1 }, { profileImage: oldUrl2 }, { profileImage: file }],
        },
        data: {
          profileImage: s3Url,
        },
      });

      if (updateResult.count > 0) {
        console.log(`   📝 Updated ${updateResult.count} user record(s) in database`);
      }

      successCount++;
      console.log('');
    } catch (error) {
      console.error(`❌ Failed to migrate ${file}:`, error);
      failCount++;
      console.log('');
    }
  }

  console.log('═══════════════════════════════════════');
  console.log('📊 Migration Summary:');
  console.log(`   ✅ Successful: ${successCount}`);
  console.log(`   ❌ Failed: ${failCount}`);
  console.log(`   📁 Total: ${files.length}`);
  console.log('═══════════════════════════════════════\n');

  if (successCount > 0) {
    console.log('🎉 Migration completed successfully!');
    console.log(
      '💡 Tip: You can now safely delete the local uploads/ folder after verifying all files are accessible from S3.',
    );
  }

  await prisma.$disconnect();
}

// Helper function to determine content type based on file extension
function getContentType(ext: string): string {
  const contentTypes: { [key: string]: string } = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.pdf': 'application/pdf',
    '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    '.xls': 'application/vnd.ms-excel',
  };

  return contentTypes[ext.toLowerCase()] || 'application/octet-stream';
}

// Helper function to format bytes to human-readable size
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

// Run the migration
migrateFilesToS3()
  .then(() => {
    console.log('✨ Migration script finished.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Migration failed:', error);
    process.exit(1);
  });
