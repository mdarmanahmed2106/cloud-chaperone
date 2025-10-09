#!/usr/bin/env node

/**
 * Admin Setup Script
 * 
 * This script helps you set up the first admin user for your Cloud Chaperone app.
 * Run this after creating your Supabase project and getting credentials.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔐 Cloud Chaperone - Admin Setup Helper');
console.log('=====================================\n');

// Check if .env.local exists
const envPath = path.join(__dirname, '.env.local');
if (!fs.existsSync(envPath)) {
  console.error('❌ .env.local file not found!');
  console.log('Please create .env.local with your Supabase credentials first.');
  console.log('See SUPABASE_SETUP.md for instructions.\n');
  process.exit(1);
}

// Read .env.local
const envContent = fs.readFileSync(envPath, 'utf8');
const hasUrl = envContent.includes('VITE_SUPABASE_URL=') && !envContent.includes('YOUR-PROJECT-REF');
const hasKey = envContent.includes('VITE_SUPABASE_PUBLISHABLE_KEY=') && !envContent.includes('YOUR-ANON-KEY');

if (!hasUrl || !hasKey) {
  console.error('❌ Supabase credentials not properly configured!');
  console.log('Please update .env.local with your real Supabase URL and anon key.');
  console.log('See SUPABASE_SETUP.md for instructions.\n');
  process.exit(1);
}

console.log('✅ Environment variables configured correctly!\n');

console.log('📋 Admin Setup Instructions:');
console.log('============================');
console.log('1. Sign up for an account in your app');
console.log('2. Copy your user ID from Supabase dashboard:');
console.log('   - Go to Supabase Dashboard → Authentication → Users');
console.log('   - Find your user and copy the User UID');
console.log('3. Run this SQL command in Supabase SQL Editor:');
console.log('');
console.log('   UPDATE user_roles SET role = \'admin\' WHERE user_id = \'YOUR-USER-ID-HERE\';');
console.log('');
console.log('   OR if you don\'t have a user_roles entry yet:');
console.log('');
console.log('   INSERT INTO user_roles (user_id, role) VALUES (\'YOUR-USER-ID-HERE\', \'admin\');');
console.log('');
console.log('4. Refresh your app and navigate to /admin');
console.log('');
console.log('🎉 You\'ll now have admin access to:');
console.log('- View all files from all users');
console.log('- Delete any file');
console.log('- Manage access requests');
console.log('- View comprehensive statistics');
console.log('');
console.log('💡 Alternative: Use the Supabase dashboard to manually insert admin role');
console.log('   - Go to Table Editor → user_roles');
console.log('   - Add new row with your user_id and role = "admin"');
console.log('');
