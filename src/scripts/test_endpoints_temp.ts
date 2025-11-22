import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';
import path from 'path';
import { createClient } from 'redis';
import dotenv from 'dotenv';

dotenv.config({ path: path.join(process.cwd(), '.env') });

const BASE_URL = `http://localhost:${process.env.PORT || 9001}/api/v1`;
const TEST_EMAIL = `test_${Date.now()}@example.com`;
const TEST_PASSWORD = 'Password123!';
const NEW_PASSWORD = 'NewPassword123!';

const redisClient = createClient({
  url: process.env.REDIS_URL,
});

redisClient.on('error', (err) => console.log('Redis Client Error', err));

async function connectRedis() {
  await redisClient.connect();
}

async function disconnectRedis() {
  await redisClient.disconnect();
}

async function runTests() {
  try {
    await connectRedis();
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
      process.exit(1);
    }

    // Manually verify user for testing purposes (since we can't easily check email for verification OTP here without more complex setup, 
    // BUT wait, we can get the verification OTP from Redis too! Let's do that properly.)
    
    console.log('\n1b. Verifying Email...');
    const verifyOtpHash = await redisClient.get(`otp:${TEST_EMAIL}`);
    // We can't easily de-hash the OTP. 
    // For the sake of this test, we will manually update the user to be verified in DB? 
    // Or we can just login? The login requires verification.
    // Actually, I can't verify the email properly without the plain text OTP. 
    // I will use a workaround: I'll try to login, if it fails with "verify email", I'll know it's working as expected.
    // But to proceed, I need a verified user.
    // I'll assume I can use the `prisma` client here to update the user? 
    // Importing prisma might be heavy/complex with ts-node if not configured perfectly.
    // Let's try to just use the "Forgot Password" flow which sends an OTP, maybe I can intercept that?
    // No, "Forgot Password" is for resetting password.
    
    // Alternative: I'll just use the `prisma` client to mark the user as verified.
    // But I can't easily import prisma here without potentially issues.
    // Let's try to use the `verify-otp` endpoint if I can guess the OTP? No.
    
    // Okay, I'll skip the "Register -> Verify" flow and just assume I can Login if I hack the DB?
    // Or I can just use the `prisma` client. It should work.
    
    // Wait, I can't import prisma easily if it's not compiled? 
    // I'll try to use the `prisma` CLI to update the user?
    // `npx prisma db execute --stdin`? No.
    
    // Let's try to just use the `redis` to get the OTP? 
    // Wait, the service hashes the OTP *before* storing it in Redis. So I can't get the plain OTP from Redis.
    // `await redisClient.set(\`otp:\${newUser.email}\`, hashedOtp, 'EX', 5 * 60);`
    
    // Okay, so I can't verify the user "legitimately" in this script without reading the email.
    // I will use a direct DB update via a child process calling a script, or just try to import prisma.
    // Let's try importing prisma.
    
  } catch (e) {
    console.error(e);
  }
}

// Re-writing the script to be simpler and robust.
// I will use a separate "setup" step to create a verified user if needed, or just use the API.
// Since I can't verify, I will use a "seed" user if one exists? 
// The `seedSuperAdmin` exists. I can use that? 
// `super_admin_email` is in env.
// But I want to test Profile update, which I shouldn't do on Super Admin maybe?
// Okay, I will try to use `prisma` to update the user.

