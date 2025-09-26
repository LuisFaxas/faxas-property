// Script to verify Firebase service account configuration
const fs = require('fs');
const path = require('path');

// Read the service account JSON from .env.local
const envPath = path.join(__dirname, '..', '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');

// Extract the FIREBASE_SERVICE_ACCOUNT_BASE64 value
const match = envContent.match(/FIREBASE_SERVICE_ACCOUNT_BASE64=(.+)/);
if (!match) {
  console.error('❌ FIREBASE_SERVICE_ACCOUNT_BASE64 not found in .env.local');
  process.exit(1);
}

const base64String = match[1].trim();
console.log('✓ Found FIREBASE_SERVICE_ACCOUNT_BASE64');
console.log('  Length:', base64String.length);

try {
  // Decode base64
  const decoded = Buffer.from(base64String, 'base64').toString('utf-8');
  console.log('✓ Base64 decoded successfully');
  console.log('  Decoded length:', decoded.length);

  // Parse JSON
  const serviceAccount = JSON.parse(decoded);
  console.log('✓ JSON parsed successfully');

  // Check required fields
  const requiredFields = ['type', 'project_id', 'private_key', 'client_email'];
  for (const field of requiredFields) {
    if (serviceAccount[field]) {
      console.log(`✓ Field "${field}" exists`);
    } else {
      console.error(`❌ Missing required field: ${field}`);
    }
  }

  console.log('\n✅ Firebase service account configuration is valid!');
  console.log('\nFor Vercel, make sure to:');
  console.log('1. Copy the entire FIREBASE_SERVICE_ACCOUNT_BASE64 value');
  console.log('2. Paste it exactly as is in Vercel environment variables');
  console.log('3. Do NOT add quotes around the value in Vercel');

} catch (error) {
  console.error('❌ Error:', error.message);
  console.error('\nDebug info:');
  console.error('First 100 chars of base64:', base64String.substring(0, 100));

  try {
    const decoded = Buffer.from(base64String, 'base64').toString('utf-8');
    console.error('First 100 chars of decoded:', decoded.substring(0, 100));
  } catch (e) {
    console.error('Failed to decode base64');
  }
}