-- Sample Data for Cloud Chaperone
-- This migration adds sample data for testing and development

-- =============================================
-- IMPORTANT: This sample data requires real users to be created first!
-- =============================================

-- NOTE: This sample data will only work if you have real users in auth.users
-- To use this sample data:
-- 1. First register 4 users through your application
-- 2. Then run this migration
-- 3. Or modify the UUIDs below to match your actual user IDs

-- Sample profiles (only insert if users exist in auth.users)
-- Uncomment and modify the UUIDs below to match your actual user IDs

/*
-- Sample profiles (replace with your actual user IDs)
INSERT INTO public.profiles (id, email, full_name) VALUES
  ('YOUR_ADMIN_USER_ID_HERE', 'admin@example.com', 'Admin User'),
  ('YOUR_USER_1_ID_HERE', 'john.doe@example.com', 'John Doe'),
  ('YOUR_USER_2_ID_HERE', 'jane.smith@example.com', 'Jane Smith'),
  ('YOUR_USER_3_ID_HERE', 'bob.wilson@example.com', 'Bob Wilson')
ON CONFLICT (id) DO NOTHING;

-- Sample user roles (replace with your actual user IDs)
INSERT INTO public.user_roles (user_id, role) VALUES
  ('YOUR_ADMIN_USER_ID_HERE', 'admin'),
  ('YOUR_USER_1_ID_HERE', 'user'),
  ('YOUR_USER_2_ID_HERE', 'user'),
  ('YOUR_USER_3_ID_HERE', 'user')
ON CONFLICT (user_id, role) DO NOTHING;
*/

-- =============================================
-- SAMPLE FILES
-- =============================================

-- Sample files (replace user IDs with your actual user IDs)
-- Uncomment and modify the user IDs below to match your actual user IDs

/*
INSERT INTO public.files (id, user_id, name, size, mime_type, storage_path) VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'YOUR_USER_1_ID_HERE', 'project-proposal.pdf', 2048576, 'application/pdf', 'YOUR_USER_1_ID_HERE/1640995200000.pdf'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'YOUR_USER_1_ID_HERE', 'team-photo.jpg', 1536000, 'image/jpeg', 'YOUR_USER_1_ID_HERE/1640995201000.jpg'),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'YOUR_USER_2_ID_HERE', 'presentation.pptx', 5242880, 'application/vnd.openxmlformats-officedocument.presentationml.presentation', 'YOUR_USER_2_ID_HERE/1640995202000.pptx'),
  ('dddddddd-dddd-dddd-dddd-dddddddddddd', 'YOUR_USER_2_ID_HERE', 'data-analysis.xlsx', 1024000, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'YOUR_USER_2_ID_HERE/1640995203000.xlsx'),
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'YOUR_USER_3_ID_HERE', 'meeting-notes.docx', 512000, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'YOUR_USER_3_ID_HERE/1640995204000.docx'),
  ('ffffffff-ffff-ffff-ffff-ffffffffffff', 'YOUR_USER_3_ID_HERE', 'screenshot.png', 768000, 'image/png', 'YOUR_USER_3_ID_HERE/1640995205000.png')
ON CONFLICT (id) DO NOTHING;
*/

-- =============================================
-- SAMPLE FILE SHARES
-- =============================================

-- Sample file shares (replace user IDs with your actual user IDs)
-- Uncomment and modify the user IDs below to match your actual user IDs

/*
INSERT INTO public.file_shares (id, file_id, share_token, is_public, expires_at, created_by) VALUES
  ('gggggggg-gggg-gggg-gggg-gggggggggggg', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'abc123def456ghi789jkl012mno345pqr678', false, '2024-12-31 23:59:59+00', 'YOUR_USER_1_ID_HERE'),
  ('hhhhhhhh-hhhh-hhhh-hhhh-hhhhhhhhhhhh', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'stu901vwx234yza567bcd890efg123hij456', true, null, 'YOUR_USER_1_ID_HERE'),
  ('iiiiiiii-iiii-iiii-iiii-iiiiiiiiiiii', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'klm789nop012qrs345tuv678wxy901zab234', false, '2024-06-30 23:59:59+00', 'YOUR_USER_2_ID_HERE')
ON CONFLICT (id) DO NOTHING;
*/

-- =============================================
-- SAMPLE FILE PERMISSIONS
-- =============================================

-- Sample file permissions (replace user IDs with your actual user IDs)
-- Uncomment and modify the user IDs below to match your actual user IDs

/*
INSERT INTO public.file_permissions (id, file_id, user_id, permission_type, granted_by) VALUES
  ('jjjjjjjj-jjjj-jjjj-jjjj-jjjjjjjjjjjj', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'YOUR_USER_2_ID_HERE', 'view', 'YOUR_USER_1_ID_HERE'),
  ('kkkkkkkk-kkkk-kkkk-kkkk-kkkkkkkkkkkk', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'YOUR_USER_3_ID_HERE', 'edit', 'YOUR_USER_1_ID_HERE'),
  ('llllllll-llll-llll-llll-llllllllllll', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'YOUR_USER_1_ID_HERE', 'view', 'YOUR_USER_2_ID_HERE')
ON CONFLICT (id) DO NOTHING;
*/

-- =============================================
-- SAMPLE ACCESS REQUESTS
-- =============================================

-- Sample access requests (replace user IDs with your actual user IDs)
-- Uncomment and modify the user IDs below to match your actual user IDs

/*
INSERT INTO public.access_requests (id, file_id, requested_by, owner_id, status, requested_permission, message, created_at, responded_at) VALUES
  ('mmmmmmmm-mmmm-mmmm-mmmm-mmmmmmmmmmmm', 'dddddddd-dddd-dddd-dddd-dddddddddddd', 'YOUR_USER_1_ID_HERE', 'YOUR_USER_2_ID_HERE', 'pending', 'view', 'I need to review this data for the quarterly report.', '2024-01-10 10:00:00+00', null),
  ('nnnnnnnn-nnnn-nnnn-nnnn-nnnnnnnnnnnn', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'YOUR_USER_2_ID_HERE', 'YOUR_USER_3_ID_HERE', 'approved', 'edit', 'I need to update the meeting notes with additional information.', '2024-01-09 14:30:00+00', '2024-01-09 16:45:00+00'),
  ('oooooooo-oooo-oooo-oooo-oooooooooooo', 'ffffffff-ffff-ffff-ffff-ffffffffffff', 'YOUR_USER_1_ID_HERE', 'YOUR_USER_3_ID_HERE', 'denied', 'view', 'Can I see this screenshot?', '2024-01-08 09:15:00+00', '2024-01-08 11:20:00+00')
ON CONFLICT (id) DO NOTHING;
*/

-- =============================================
-- COMMENTS
-- =============================================

-- Add comments to explain the sample data
COMMENT ON TABLE public.profiles IS 'Sample data includes: Admin User, John Doe, Jane Smith, Bob Wilson';
COMMENT ON TABLE public.files IS 'Sample files include: PDF, JPG, PPTX, XLSX, DOCX, PNG files from different users';
COMMENT ON TABLE public.file_shares IS 'Sample shares include: private share with expiry, public share, private share with June expiry';
COMMENT ON TABLE public.file_permissions IS 'Sample permissions include: view access, edit access granted between users';
COMMENT ON TABLE public.access_requests IS 'Sample requests include: pending request, approved request, denied request';

-- =============================================
-- USAGE NOTES
-- =============================================

/*
SAMPLE DATA USAGE:

1. Admin User (11111111-1111-1111-1111-111111111111):
   - Has admin role
   - Can access all files and manage the system

2. John Doe (22222222-2222-2222-2222-222222222222):
   - Regular user
   - Owns: project-proposal.pdf, team-photo.jpg
   - Has view access to: data-analysis.xlsx
   - Has edit access to: meeting-notes.docx
   - Has pending request for: data-analysis.xlsx
   - Has denied request for: screenshot.png

3. Jane Smith (33333333-3333-3333-3333-333333333333):
   - Regular user
   - Owns: presentation.pptx, data-analysis.xlsx
   - Has view access to: project-proposal.pdf
   - Has approved request for: meeting-notes.docx

4. Bob Wilson (44444444-4444-4444-4444-444444444444):
   - Regular user
   - Owns: meeting-notes.docx, screenshot.png
   - Has edit access to: team-photo.jpg

TESTING SCENARIOS:
- Test admin access to all files
- Test user file ownership and permissions
- Test file sharing with tokens
- Test access request workflow
- Test permission-based file access
*/
