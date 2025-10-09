#!/usr/bin/env node

/**
 * Database Deployment Script
 * 
 * This script helps deploy your database schema to Supabase.
 * Run this after creating your Supabase project and getting credentials.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🚀 Cloud Chaperone - Database Deployment Helper');
console.log('================================================\n');

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

console.log('📋 Next Steps:');
console.log('1. Install Supabase CLI: npm install -g supabase');
console.log('2. Login to Supabase: supabase login');
console.log('3. Link your project: supabase link --project-ref YOUR-PROJECT-REF');
console.log('4. Deploy schema: supabase db push');
console.log('\n📖 See SUPABASE_SETUP.md for detailed instructions.\n');

console.log('🎉 Your app is ready to be fully functional!');
console.log('After completing the steps above, your app will have:');
console.log('- Real user authentication');
console.log('- File upload/storage');
console.log('- User profiles and roles');
console.log('- Admin capabilities');
console.log('- Production-ready database schema');
