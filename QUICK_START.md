# 🚀 Quick Start Guide - AWS S3 File Uploads

## Prerequisites Checklist

- [ ] AWS Account created
- [ ] S3 bucket created
- [ ] IAM user with S3 access created
- [ ] AWS credentials obtained (Access Key ID & Secret Access Key)

## Quick Setup (5 Minutes)

### 1. Add AWS Credentials to `.env`

```env
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-access-key-id
AWS_SECRET_ACCESS_KEY=your-secret-access-key
AWS_S3_BUCKET_NAME=your-bucket-name
```

### 2. Configure S3 Bucket CORS

In AWS Console → S3 → Your Bucket → Permissions → CORS:

```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
    "AllowedOrigins": ["http://localhost:3000", "https://yourdomain.com"],
    "ExposeHeaders": ["ETag"]
  }
]
```

### 3. Set Bucket Policy for Public Read

In AWS Console → S3 → Your Bucket → Permissions → Bucket Policy:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::YOUR-BUCKET-NAME/*"
    }
  ]
}
```

**Replace `YOUR-BUCKET-NAME` with your actual bucket name**

### 4. Start Your Server

```bash
yarn dev
```

### 5. Test Upload

Upload a profile image using your API endpoint:

```
PATCH /api/v1/profile/update
```

## Migrate Existing Files (Optional)

If you have existing files in the `uploads/` folder:

```bash
yarn s3:migrate
```

This will:

- Upload all files from `uploads/` to S3
- Update database URLs to S3 URLs
- Show progress and summary

## Verify Setup

### Test File Upload

```bash
curl -X PATCH http://localhost:7001/api/v1/profile/update \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@/path/to/image.jpg" \
  -F 'payload={"firstName":"Test"}'
```

### Expected Response

```json
{
  "success": true,
  "data": {
    "profileImage": "https://your-bucket.s3.us-east-1.amazonaws.com/uploads/image-xxx.jpg"
  }
}
```

### Verify File is Accessible

Open the S3 URL in your browser - you should see the image.

## Common Issues

### ❌ "Access Denied" Error

**Solution**: Check bucket policy allows public `GetObject`

### ❌ "Credentials not found" Error

**Solution**: Verify `.env` has all AWS variables and restart server

### ❌ "CORS Error" in Frontend

**Solution**: Add your frontend domain to bucket CORS policy

### ❌ "The bucket does not allow ACLs"

**Solution**: Go to Bucket → Permissions → Object Ownership → Enable ACLs

## Scripts Reference

| Command           | Description               |
| ----------------- | ------------------------- |
| `yarn dev`        | Start development server  |
| `yarn s3:migrate` | Migrate local files to S3 |
| `yarn build`      | Build for production      |
| `yarn start`      | Start production server   |

## File Structure Changes

```diff
src/
├── app/
│   ├── helpers/
- │   │   └── fileUploadHelper.ts (local storage)
+ │   │   └── fileUploadHelper.ts (S3 storage)
│   └── modules/
│       └── profile/
- │           └── profile.service.ts (local URLs)
+ │           └── profile.service.ts (S3 URLs + deletion)
├── config/
+ │   ├── index.ts (+ AWS config)
+ │   └── env.ts (+ AWS validation)
├── lib/
+ │   └── awsS3.ts (new - S3 client)
└── scripts/
+     └── migrate-to-s3.ts (new - migration script)
```

## Environment Variables Summary

**Required:**

```env
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=...
AWS_S3_BUCKET_NAME=your-bucket-name
```

**No longer needed:**

- ~~`BACKEND_FILE_URL`~~ (still used in config but not for uploads)

## Next Steps

1. ✅ Complete setup (steps above)
2. ✅ Test file upload
3. ✅ Migrate existing files (if any)
4. 📚 Read full documentation:
   - `MIGRATION_SUMMARY.md` - Complete change log
   - `AWS_S3_SETUP.md` - Detailed AWS setup guide

## Support

- **Setup Guide**: `AWS_S3_SETUP.md`
- **Implementation Details**: `MIGRATION_SUMMARY.md`
- **AWS S3 Docs**: https://docs.aws.amazon.com/s3/
- **multer-s3 Docs**: https://github.com/badunk/multer-s3

---

**Ready to go!** 🎉 Your app now uses AWS S3 for file uploads.
