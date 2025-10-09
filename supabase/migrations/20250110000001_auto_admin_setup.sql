-- Auto-admin setup migration
-- This migration creates a function to automatically make the first user an admin

-- Function to automatically make the first user an admin
CREATE OR REPLACE FUNCTION public.setup_first_admin()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if this is the first user (no other users exist)
  IF NOT EXISTS (
    SELECT 1 FROM auth.users 
    WHERE id != NEW.id
  ) THEN
    -- Make the first user an admin
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger to automatically set first user as admin
DROP TRIGGER IF EXISTS on_first_user_admin ON auth.users;
CREATE TRIGGER on_first_user_admin
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.setup_first_admin();

-- If you already have users but no admin, you can manually run this:
-- UPDATE user_roles SET role = 'admin' WHERE user_id = (SELECT id FROM auth.users ORDER BY created_at LIMIT 1);
