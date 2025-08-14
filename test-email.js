#!/usr/bin/env node

/**
 * FreeResend Email Testing Script
 *
 * This script tests email sending functionality using both:
 * 1. Direct API calls (curl equivalent)
 * 2. Resend package compatibility
 */

const API_BASE_URL = "http://localhost:3000";
const API_KEY = "frs_f0GrND5i_e_jmHrSf7abrlAv8Wo-ZYo1DvEaTmxit"; // Replace with your actual API key from FreeResend
const FROM_EMAIL = "info@freeresend.com"; // Replace with your verified domain
const TO_EMAIL = "eibrahim@gmail.com"; // Replace with your email address

// Test 1: Direct API call
async function testDirectAPI() {
  console.log("🧪 Testing Direct API Call...\n");

  const response = await fetch(`${API_BASE_URL}/api/emails`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: FROM_EMAIL,
      to: [TO_EMAIL],
      subject: "🎉 FreeResend Test Email - Direct API",
      html: `
        <h1>Success! 🚀</h1>
        <p>This email was sent using <strong>FreeResend</strong> via direct API call.</p>
        <p>If you received this, your email setup is working perfectly!</p>
        <hr>
        <p><small>Sent at: ${new Date().toISOString()}</small></p>
      `,
      text: "Success! This email was sent using FreeResend via direct API call.",
    }),
  });

  const result = await response.json();

  if (response.ok) {
    console.log("✅ Direct API Success!");
    console.log("📧 Email ID:", result.id);
    console.log("📧 Created:", result.created_at);
  } else {
    console.log("❌ Direct API Failed:");
    console.log(result);
  }
  console.log("\n" + "=".repeat(50) + "\n");
}

// Test 2: Resend package compatibility
async function testResendPackage() {
  console.log("🧪 Testing Resend Package Compatibility...\n");

  try {
    // Set environment variable for Resend package to use FreeResend endpoint
    process.env.RESEND_BASE_URL = `${API_BASE_URL}/api`;

    // Import Resend package (install with: npm install resend)
    const { Resend } = await import("resend");

    // Initialize Resend with FreeResend - no custom config needed!
    const resend = new Resend(API_KEY);

    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: [TO_EMAIL],
      subject: "🎉 FreeResend Test Email - Resend Package",
      html: `
        <h1>Amazing! 🎯</h1>
        <p>This email was sent using the <strong>Resend package</strong> pointing to <strong>FreeResend</strong>!</p>
        <p>This proves FreeResend is a true drop-in replacement for Resend! 🔄</p>
        <ul>
          <li>✅ Same API interface</li>
          <li>✅ Same package compatibility</li>
          <li>✅ Same developer experience</li>
          <li>✅ Zero code changes needed!</li>
        </ul>
        <hr>
        <p><small>Sent at: ${new Date().toISOString()}</small></p>
      `,
      text: "Amazing! This email was sent using the Resend package pointing to FreeResend!",
    });

    if (error) {
      console.log("❌ Resend Package Failed:");
      console.log(error);
    } else {
      console.log("✅ Resend Package Success!");
      console.log("📧 Email ID:", data.id);
      console.log("🔄 Drop-in replacement working perfectly!");
    }
  } catch (error) {
    console.log("❌ Resend Package Error (maybe not installed?):");
    console.log("💡 Install with: npm install resend");
    console.log(error.message);
  }
  console.log("\n" + "=".repeat(50) + "\n");
}

// Test 3: Check email logs
async function checkEmailLogs() {
  console.log("🧪 Checking Email Logs...\n");

  const response = await fetch(`${API_BASE_URL}/api/emails/logs?limit=5`, {
    headers: {
      Authorization: `Bearer ${API_KEY}`,
    },
  });

  const result = await response.json();

  if (response.ok) {
    console.log("✅ Email Logs Retrieved!");
    console.log(`📊 Total emails: ${result.data.pagination.total}`);
    console.log("📧 Recent emails:");

    result.data.emails.forEach((email, index) => {
      console.log(
        `   ${index + 1}. ${email.subject} (${email.status}) - ${
          email.created_at
        }`
      );
    });
  } else {
    console.log("❌ Failed to get email logs:");
    console.log(result);
  }
  console.log("\n" + "=".repeat(50) + "\n");
}

// Main test function
async function runTests() {
  console.log("🚀 FreeResend Email Testing\n");
  console.log("=".repeat(50));

  // Validate configuration
  if (API_KEY === "YOUR_API_KEY_HERE") {
    console.log(
      "❌ Please update API_KEY in this script with your actual API key from FreeResend"
    );
    return;
  }

  if (FROM_EMAIL === "test@freeresend.com") {
    console.log("❌ Please update FROM_EMAIL with your verified domain email");
    return;
  }

  if (TO_EMAIL === "your-email@example.com") {
    console.log("❌ Please update TO_EMAIL with your actual email address");
    return;
  }

  console.log(`📧 From: ${FROM_EMAIL}`);
  console.log(`📧 To: ${TO_EMAIL}`);
  console.log(`🔑 API Key: ${API_KEY.substring(0, 10)}...`);
  console.log("=".repeat(50) + "\n");

  try {
    await testDirectAPI();
    await testResendPackage();
    await checkEmailLogs();

    console.log("🎉 All tests completed!");
    console.log("📧 Check your email inbox for test messages");
    console.log("📊 Check the Email Logs tab in FreeResend dashboard");
  } catch (error) {
    console.log("❌ Test error:", error);
  }
}

// Run tests
runTests();
