#!/bin/bash

# FreeResend Email Testing with cURL
# Replace these variables with your actual values

API_KEY=""  # Get from FreeResend API Keys tab
FROM_EMAIL="info@freeresend.com"  # Your verified domain email
TO_EMAIL="eibrahim@gmail.com"  # Your email address
BASE_URL="http://localhost:3000"

echo "🚀 Testing FreeResend with cURL"
echo "================================"

# Test 1: Send a simple email
echo "📧 Sending test email..."

curl -X POST "$BASE_URL/api/emails" \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d "{
    \"from\": \"$FROM_EMAIL\",
    \"to\": [\"$TO_EMAIL\"],
    \"subject\": \"🧪 FreeResend cURL Test\",
    \"html\": \"<h1>Success!</h1><p>This email was sent using <strong>FreeResend</strong> via cURL!</p><p>Your email setup is working! 🎉</p>\",
    \"text\": \"Success! This email was sent using FreeResend via cURL!\"
  }" | jq '.'

echo ""
echo "================================"

# Test 2: Check email logs
echo "📊 Checking recent email logs..."

curl -X GET "$BASE_URL/api/emails/logs?limit=3" \
  -H "Authorization: Bearer $API_KEY" | jq '.'

echo ""
echo "🎉 Testing complete!"
echo "📧 Check your email inbox"
echo "📊 Check FreeResend dashboard for logs"
