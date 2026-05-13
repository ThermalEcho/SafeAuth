#!/usr/bin/env node

/**
 * Debug script to test the SafeAuth network connection
 * Run: node test-connection.js
 */

import dotenv from "dotenv";
import fetch from "node-fetch";
import { fileURLToPath } from "node:url";

dotenv.config({ path: fileURLToPath(new URL("./.env", import.meta.url)) });

const API_URL = process.env.EXPO_PUBLIC_API_URL || "http://10.0.2.2:3000";
const BACKEND_URL = process.env.API_URL || "http://localhost:3000";

console.log("🔍 SafeAuth Network Connection Test\n");
console.log("📋 Configuration:");
console.log(`  - EXPO_PUBLIC_API_URL: ${process.env.EXPO_PUBLIC_API_URL || "NOT SET"}`);
console.log(`  - API_URL: ${process.env.API_URL || "NOT SET"}`);
console.log(`  - Using API URL: ${API_URL}\n`);

async function testConnection() {
  try {
    console.log("🧪 Test 1: Health Check");
    console.log(`   Testing: ${API_URL}/health`);
    const healthResponse = await fetch(`${API_URL}/health`, {
      method: "GET",
      timeout: 5000,
    });

    if (!healthResponse.ok) {
      console.log(`   ❌ Status: ${healthResponse.status} ${healthResponse.statusText}`);
      return;
    }

    const healthData = await healthResponse.json();
    console.log(`   ✅ Status: ${healthResponse.status}`);
    console.log(`   ✅ Response: ${JSON.stringify(healthData)}\n`);

    console.log("🧪 Test 2: Preflight OPTIONS Request");
    console.log(`   Testing: ${API_URL}/api/auth/sign-up`);
    const optionsResponse = await fetch(`${API_URL}/api/auth/sign-up`, {
      method: "OPTIONS",
      headers: {
        "Access-Control-Request-Method": "POST",
        "Access-Control-Request-Headers": "content-type",
        origin: "http://localhost",
      },
      timeout: 5000,
    });

    console.log(`   ✅ Status: ${optionsResponse.status}`);
    console.log(`   ✅ CORS Headers:`);
    console.log(`      - Access-Control-Allow-Origin: ${optionsResponse.headers.get("access-control-allow-origin")}`);
    console.log(`      - Access-Control-Allow-Methods: ${optionsResponse.headers.get("access-control-allow-methods")}`);
    console.log(`      - Access-Control-Allow-Headers: ${optionsResponse.headers.get("access-control-allow-headers")}\n`);

    console.log("🧪 Test 3: Test Sign-Up Request");
    console.log(`   Testing: POST ${API_URL}/api/auth/sign-up`);
    const signUpResponse = await fetch(`${API_URL}/api/auth/sign-up`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        origin: "http://localhost",
      },
      body: JSON.stringify({
        email: "test@example.com",
        password: "TestPassword123",
        name: "Test User",
      }),
      timeout: 5000,
    });

    console.log(`   Status: ${signUpResponse.status} ${signUpResponse.statusText}`);
    const responseText = await signUpResponse.text();
    console.log(`   Response: ${responseText}\n`);

    if (signUpResponse.status === 400) {
      console.log("   ℹ️  Status 400 is expected (duplicate email, CORS issue, etc.)");
      console.log("   ✅ But it means the server responded! Network connection works.\n");
    }
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
    console.log(`   💡 Tips:`);
    console.log(`      1. Make sure the backend is running: npm run start:server`);
    console.log(`      2. Check the backend logs for errors`);
    console.log(`      3. Verify EXPO_PUBLIC_API_URL is correct in .env`);
    console.log(`      4. Check CORS settings in backend/server.ts`);
    console.log(`      5. Ensure firewall/network allows connection\n`);
  }
}

await testConnection();
