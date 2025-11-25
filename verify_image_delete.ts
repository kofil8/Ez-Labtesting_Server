import { PrismaClient } from '@prisma/client';
import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();
const API_URL = 'http://localhost:7001/api/v1';
const UPLOADS_DIR = path.join(process.cwd(), 'uploads');

// Helper to create a dummy image
const createDummyImage = (filename: string) => {
  const filePath = path.join(process.cwd(), filename);
  fs.writeFileSync(filePath, 'dummy image content');
  return filePath;
};

// Helper to register and login
const setupUser = async () => {
  const email = `test.${Date.now()}@example.com`;
  const password = 'Password@123';
  
  try {
    // Register
    await axios.post(`${API_URL}/auth/register`, {
      firstName: 'Test',
      lastName: 'User',
      email,
      password,
      phoneNumber: '1234567890',
    });
    console.log('User registered:', email);

    // Manually verify user
    await prisma.user.update({
      where: { email },
      data: { isVerified: true },
    });
    console.log('User verified manually.');

    // Login
    const response = await axios.post(`${API_URL}/auth/login`, {
      email,
      password,
    });
    return response.data.data.accessToken;
  } catch (error: any) {
    console.error('Setup failed:', JSON.stringify(error.response?.data, null, 2) || error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Headers:', error.response.headers);
    }
    process.exit(1);
  }
};

const runVerification = async () => {
  const token = await setupUser();
  console.log('Logged in successfully.');

  // 1. Upload first image
  const image1Path = createDummyImage('image1.png');
  const formData1 = new FormData();
  formData1.append('file', fs.createReadStream(image1Path));
  formData1.append('data', JSON.stringify({}));

  console.log('Uploading first image...');
  let response = await axios.patch(`${API_URL}/profile`, formData1, {
    headers: {
      ...formData1.getHeaders(),
      Authorization: token,
    },
  });

  const firstImageProfilePath = response.data.data.profileImage;
  const firstImageFilename = path.basename(firstImageProfilePath);
  console.log('First image uploaded:', firstImageProfilePath);

  if (!fs.existsSync(path.join(UPLOADS_DIR, firstImageFilename))) {
    console.error('First image not found in uploads!');
    process.exit(1);
  }

  // 2. Upload second image (should replace first)
  const image2Path = createDummyImage('image2.png');
  const formData2 = new FormData();
  formData2.append('file', fs.createReadStream(image2Path));
  formData2.append('data', JSON.stringify({}));

  console.log('Uploading second image...');
  response = await axios.patch(`${API_URL}/profile`, formData2, {
    headers: {
      ...formData2.getHeaders(),
      Authorization: token,
    },
  });

  const secondImageProfilePath = response.data.data.profileImage;
  console.log('Second image uploaded:', secondImageProfilePath);

  // 3. Verify first image is deleted
  if (fs.existsSync(path.join(UPLOADS_DIR, firstImageFilename))) {
    console.error('FAILED: Old image was NOT deleted!');
  } else {
    console.log('SUCCESS: Old image was deleted.');
  }

  // Cleanup local dummy files
  fs.unlinkSync(image1Path);
  fs.unlinkSync(image2Path);
};

runVerification();
