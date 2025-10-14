-- Make User Admin - Simple Version
-- This script makes user e971e039-5c1c-4a83-b17a-1a39ab0bea33 an admin

-- =============================================
-- STEP 1: CHECK IF USER EXISTS
-- =============================================

-- Check if the user exists in auth.users
SELECT 
  'User found:' as status,
  u.id,
  u.email,
  u.created_at
FROM auth.users u
WHERE u.id = 'e971e039-5c1c-4a83-b17a-1a39ab0bea33';

-- =============================================
-- STEP 2: MAKE USER ADMIN
-- =============================================

-- Insert or update the user's role to admin
INSERT INTO public.user_roles (user_id, role)
VALUES ('e971e039-5c1c-4a83-b17a-1a39ab0bea33', 'admin')
ON CONFLICT (user_id, role) 
DO UPDATE SET role = 'admin';

-- =============================================
-- STEP 3: VERIFY ADMIN STATUS
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
WHERE u.id = 'e971e039-5c1c-4a83-b17a-1a39ab0bea33';

-- =============================================
-- STEP 4: CHECK ALL ADMINS
-- =============================================

-- See all users with admin role
SELECT 
  'All admin users:' as info,
  u.email,
  p.full_name,
  ur.role,
  u.created_at
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
LEFT JOIN public.user_roles ur ON u.id = ur.user_id
WHERE ur.role = 'admin'
ORDER BY u.created_at;

