-- Make User Admin Script
-- This script makes a specific user an admin

-- =============================================
-- USER ID TO MAKE ADMIN
-- =============================================

-- Replace this with your actual user ID
\set user_id 'e971e039-5c1c-4a83-b17a-1a39ab0bea33'

-- =============================================
-- MAKE USER ADMIN
-- =============================================

-- First, check if the user exists
SELECT 
  'Checking if user exists...' as status,
  u.id,
  u.email,
  u.created_at
FROM auth.users u
WHERE u.id = :'user_id';

-- Make the user an admin (insert or update role)
INSERT INTO public.user_roles (user_id, role)
VALUES (:'user_id', 'admin')
ON CONFLICT (user_id, role) 
DO UPDATE SET role = 'admin';

-- =============================================
-- VERIFY ADMIN STATUS
-- =============================================

-- Check if the user is now an admin
SELECT 
  'Admin status updated!' as status,
  u.email,
  p.full_name,
  ur.role,
  ur.created_at as role_created
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
LEFT JOIN public.user_roles ur ON u.id = ur.user_id
WHERE u.id = :'user_id';

-- =============================================
-- ALTERNATIVE: SIMPLE VERSION (without variables)
-- =============================================

-- If your SQL editor doesn't support variables, use this instead:
/*
-- Make user admin
INSERT INTO public.user_roles (user_id, role)
VALUES ('e971e039-5c1c-4a83-b17a-1a39ab0bea33', 'admin')
ON CONFLICT (user_id, role) 
DO UPDATE SET role = 'admin';

-- Verify admin status
SELECT 
  'Admin status updated!' as status,
  u.email,
  p.full_name,
  ur.role
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
LEFT JOIN public.user_roles ur ON u.id = ur.user_id
WHERE u.id = 'e971e039-5c1c-4a83-b17a-1a39ab0bea33';
*/

