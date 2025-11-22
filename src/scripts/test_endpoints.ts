import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';
import path from 'path';
import Redis from 'ioredis';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

dotenv.config({ path: path.join(process.cwd(), '.env') });

const prisma = new PrismaClient();
const BASE_URL = `http://localhost:${process.env.PORT || 7001}/api/v1`;
const TEST_EMAIL = `test_${Date.now()}@example.com`;
const TEST_PASSWORD = 'Password123!';
const NEW_PASSWORD = 'NewPassword123!';

const redisClient = new Redis(process.env.REDIS_URL as string);

redisClient.on('error', (err) => console.log('Redis Client Error', err));

async function runTests() {
  try {
    // await redisClient.connect(); // ioredis connects automatically
    console.log('🚀 Starting Tests...');

    // 1. Register
    console.log('\n1. Registering User...');
    try {
      await axios.post(`${BASE_URL}/auth/register`, {
        firstName: 'Test',
        lastName: 'User',
        email: TEST_EMAIL,
        phoneNumber: '1234567890',
        password: TEST_PASSWORD,
      });
      console.log('✅ Registration successful');
    } catch (error: any) {
      console.error('❌ Registration failed:', error.response?.data || error.message);
      if (error.response) console.error('Status:', error.response.status);
      process.exit(1);
    }

    // 2. Manually Verify User (Direct DB Update)
    console.log('\n2. Verifying User (Direct DB Update)...');
    await prisma.user.update({
      where: { email: TEST_EMAIL },
      data: { isVerified: true },
    });
    console.log('✅ User verified in DB');

    // 3. Login
    console.log('\n3. Logging in...');
    let token = '';
    try {
      const res = await axios.post(`${BASE_URL}/auth/login`, {
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
      });
      token = res.data.data.accessToken;
      console.log('✅ Login successful');
    } catch (error: any) {
      console.error('❌ Login failed:', error.response?.data || error.message);
      process.exit(1);
    }

    // 4. Get Profile
    console.log('\n4. Fetching Profile...');
    try {
      const res = await axios.get(`${BASE_URL}/profile`, {
        headers: { Authorization: token },
      });
      console.log('✅ Profile fetched:', res.data.data.email);
    } catch (error: any) {
      console.error('❌ Get Profile failed:', error.response?.data || error.message);
    }

    // 5. Update Profile (Multipart)
    console.log('\n5. Updating Profile (with image)...');
    try {
      const form = new FormData();
      const data = JSON.stringify({
        firstName: 'UpdatedName',
        bio: 'Updated Bio',
      });
      form.append('data', data);
      
      // Create a dummy file
      const dummyFilePath = path.join(__dirname, 'test_image.png');
      fs.writeFileSync(dummyFilePath, 'dummy content');
      form.append('file', fs.createReadStream(dummyFilePath));

      const res = await axios.patch(`${BASE_URL}/profile`, form, {
        headers: {
          Authorization: token,
          ...form.getHeaders(),
        },
      });
      console.log('✅ Profile updated:', res.data.data.firstName);
      
      // Cleanup dummy file
      fs.unlinkSync(dummyFilePath);
    } catch (error: any) {
      console.error('❌ Update Profile failed:', error.response?.data || error.message);
    }

    // 6. Change Password
    console.log('\n6. Changing Password...');
    try {
      await axios.post(
        `${BASE_URL}/profile/change-password`,
        {
          oldPassword: TEST_PASSWORD,
          newPassword: NEW_PASSWORD,
        },
        { headers: { Authorization: token } }
      );
      console.log('✅ Password changed successfully');
    } catch (error: any) {
      console.error('❌ Change Password failed:', error.response?.data || error.message);
    }

    // 7. Login with New Password
    console.log('\n7. Logging in with New Password...');
    try {
      await axios.post(`${BASE_URL}/auth/login`, {
        email: TEST_EMAIL,
        password: NEW_PASSWORD,
      });
      console.log('✅ Login with new password successful');
    } catch (error: any) {
      console.error('❌ Login with new password failed:', error.response?.data || error.message);
    }

    // 8. Forgot Password
    console.log('\n8. Requesting Forgot Password OTP...');
    try {
      await axios.post(`${BASE_URL}/auth/forgot-password`, {
        email: TEST_EMAIL,
      });
      console.log('✅ OTP requested');
    } catch (error: any) {
      console.error('❌ Forgot Password failed:', error.response?.data || error.message);
    }

    // 9. Reset Password
    console.log('\n9. Resetting Password with OTP...');
    // We can't get the OTP from Redis because it's hashed.
    // However, we can verify that the OTP was sent (step 8 passed).
    // To test the RESET endpoint, we need a valid OTP.
    // Since we can't get the valid OTP (it's random and hashed), we can't easily test the success case of Reset Password 
    // unless we mock the OTP generation or intercept the email.
    // BUT, we can manually set a known hash in Redis for testing!
    
    // Manually set a known OTP hash in Redis
    const KNOWN_OTP = '123456';
    // We need bcrypt to hash it, but importing bcrypt might be annoying if not installed or types missing in script context.
    // Let's assume we can just skip the full reset verification or try to import bcrypt.
    // I'll try to import bcrypt.
    
    try {
        const bcrypt = require('bcrypt'); // Use require to avoid import issues if types missing
        const hashedOtp = await bcrypt.hash(KNOWN_OTP, 12);
        await redisClient.set(`otp_reset:${TEST_EMAIL}`, hashedOtp, 'EX', 300);
        console.log('   (Manually injected known OTP into Redis for testing)');

        await axios.post(`${BASE_URL}/auth/reset-password`, {
            email: TEST_EMAIL,
            otp: KNOWN_OTP,
            newPassword: TEST_PASSWORD, // Reset back to original
        });
        console.log('✅ Password reset successful');
    } catch (error: any) {
         console.error('❌ Reset Password failed (or bcrypt missing):', error.response?.data || error.message);
    }

  } catch (error) {
    console.error('❌ Test Script Error:', error);
  } finally {
    await redisClient.disconnect();
    await prisma.$disconnect();
  }
}

runTests();
