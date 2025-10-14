-- Get User IDs Script
-- Run this script to get your actual user IDs for sample data

-- =============================================
-- STEP 1: Get your user IDs
-- =============================================

-- This will show you all users in your auth.users table
SELECT 
  id,
  email,
  created_at,
  'Copy this ID for sample data' as note
FROM auth.users 
ORDER BY created_at;

-- =============================================
-- STEP 2: Check existing profiles
-- =============================================

-- This will show you existing profiles
SELECT 
  p.id,
  p.email,
  p.full_name,
  ur.role
FROM public.profiles p
LEFT JOIN public.user_roles ur ON p.id = ur.user_id
ORDER BY p.created_at;

-- =============================================
-- STEP 3: Sample data template
-- =============================================

-- After you get your user IDs, replace the placeholders below:

/*
-- Example: If your user IDs are:
-- Admin: 12345678-1234-1234-1234-123456789012
-- User 1: 87654321-4321-4321-4321-210987654321
-- User 2: 11111111-2222-3333-4444-555555555555
-- User 3: 66666666-7777-8888-9999-000000000000

-- Then uncomment and modify this sample data:

INSERT INTO public.files (id, user_id, name, size, mime_type, storage_path) VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '87654321-4321-4321-4321-210987654321', 'project-proposal.pdf', 2048576, 'application/pdf', '87654321-4321-4321-4321-210987654321/1640995200000.pdf'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '87654321-4321-4321-4321-210987654321', 'team-photo.jpg', 1536000, 'image/jpeg', '87654321-4321-4321-4321-210987654321/1640995201000.jpg'),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', '11111111-2222-3333-4444-555555555555', 'presentation.pptx', 5242880, 'application/vnd.openxmlformats-officedocument.presentationml.presentation', '11111111-2222-3333-4444-555555555555/1640995202000.pptx'),
  ('dddddddd-dddd-dddd-dddd-dddddddddddd', '11111111-2222-3333-4444-555555555555', 'data-analysis.xlsx', 1024000, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', '11111111-2222-3333-4444-555555555555/1640995203000.xlsx'),
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', '66666666-7777-8888-9999-000000000000', 'meeting-notes.docx', 512000, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', '66666666-7777-8888-9999-000000000000/1640995204000.docx'),
  ('ffffffff-ffff-ffff-ffff-ffffffffffff', '66666666-7777-8888-9999-000000000000', 'screenshot.png', 768000, 'image/png', '66666666-7777-8888-9999-000000000000/1640995205000.png')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.file_shares (id, file_id, share_token, is_public, expires_at, created_by) VALUES
  ('gggggggg-gggg-gggg-gggg-gggggggggggg', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'abc123def456ghi789jkl012mno345pqr678', false, '2024-12-31 23:59:59+00', '87654321-4321-4321-4321-210987654321'),
  ('hhhhhhhh-hhhh-hhhh-hhhh-hhhhhhhhhhhh', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'stu901vwx234yza567bcd890efg123hij456', true, null, '87654321-4321-4321-4321-210987654321'),
  ('iiiiiiii-iiii-iiii-iiii-iiiiiiiiiiii', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'klm789nop012qrs345tuv678wxy901zab234', false, '2024-06-30 23:59:59+00', '11111111-2222-3333-4444-555555555555')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.file_permissions (id, file_id, user_id, permission_type, granted_by) VALUES
  ('jjjjjjjj-jjjj-jjjj-jjjj-jjjjjjjjjjjj', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-2222-3333-4444-555555555555', 'view', '87654321-4321-4321-4321-210987654321'),
  ('kkkkkkkk-kkkk-kkkk-kkkk-kkkkkkkkkkkk', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '66666666-7777-8888-9999-000000000000', 'edit', '87654321-4321-4321-4321-210987654321'),
  ('llllllll-llll-llll-llll-llllllllllll', 'cccccccc-cccc-cccc-cccc-cccccccccccc', '87654321-4321-4321-4321-210987654321', 'view', '11111111-2222-3333-4444-555555555555')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.access_requests (id, file_id, requested_by, owner_id, status, requested_permission, message, created_at, responded_at) VALUES
  ('mmmmmmmm-mmmm-mmmm-mmmm-mmmmmmmmmmmm', 'dddddddd-dddd-dddd-dddd-dddddddddddd', '87654321-4321-4321-4321-210987654321', '11111111-2222-3333-4444-555555555555', 'pending', 'view', 'I need to review this data for the quarterly report.', '2024-01-10 10:00:00+00', null),
  ('nnnnnnnn-nnnn-nnnn-nnnn-nnnnnnnnnnnn', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', '11111111-2222-3333-4444-555555555555', '66666666-7777-8888-9999-000000000000', 'approved', 'edit', 'I need to update the meeting notes with additional information.', '2024-01-09 14:30:00+00', '2024-01-09 16:45:00+00'),
  ('oooooooo-oooo-oooo-oooo-oooooooooooo', 'ffffffff-ffff-ffff-ffff-ffffffffffff', '87654321-4321-4321-4321-210987654321', '66666666-7777-8888-9999-000000000000', 'denied', 'view', 'Can I see this screenshot?', '2024-01-08 09:15:00+00', '2024-01-08 11:20:00+00')
ON CONFLICT (id) DO NOTHING;
*/
