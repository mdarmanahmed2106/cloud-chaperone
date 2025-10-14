-- Complete Cloud Chaperone Database Schema
-- This migration creates the full database schema for the file sharing application

-- =============================================
-- ENUMS
-- =============================================

-- Create enum for user roles
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- Create enum for permission types
CREATE TYPE public.permission_type AS ENUM ('view', 'edit', 'admin');

-- Create enum for request status
CREATE TYPE public.request_status AS ENUM ('pending', 'approved', 'denied');

-- =============================================
-- TABLES
-- =============================================

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'user',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);

-- Create files table
CREATE TABLE public.files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  size BIGINT NOT NULL,
  mime_type TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create file_shares table for public file links
CREATE TABLE public.file_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_id UUID REFERENCES public.files(id) ON DELETE CASCADE NOT NULL,
  share_token TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
  is_public BOOLEAN NOT NULL DEFAULT false,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL
);

-- Create file_permissions table for user-specific permissions
CREATE TABLE public.file_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_id UUID REFERENCES public.files(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  permission_type permission_type NOT NULL,
  granted_by UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  granted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(file_id, user_id)
);

-- Create access_requests table for requesting file access
CREATE TABLE public.access_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_id UUID REFERENCES public.files(id) ON DELETE CASCADE NOT NULL,
  requested_by UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  status request_status NOT NULL DEFAULT 'pending',
  requested_permission permission_type NOT NULL DEFAULT 'view',
  message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  responded_at TIMESTAMPTZ,
  UNIQUE(file_id, requested_by)
);

-- =============================================
-- ROW LEVEL SECURITY
-- =============================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.file_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.file_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.access_requests ENABLE ROW LEVEL SECURITY;

-- =============================================
-- FUNCTIONS
-- =============================================

-- Function to check if user has a specific role
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Function to check if user has permission for a file
CREATE OR REPLACE FUNCTION public.has_file_permission(
  file_uuid UUID,
  required_permission permission_type DEFAULT 'view'
)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if user is the owner
  IF EXISTS (
    SELECT 1 FROM files 
    WHERE id = file_uuid AND user_id = auth.uid()
  ) THEN
    RETURN TRUE;
  END IF;
  
  -- Check if user has explicit permission
  IF EXISTS (
    SELECT 1 FROM file_permissions 
    WHERE file_id = file_uuid 
    AND user_id = auth.uid() 
    AND (
      (required_permission = 'view' AND permission_type IN ('view', 'edit', 'admin')) OR
      (required_permission = 'edit' AND permission_type IN ('edit', 'admin')) OR
      (required_permission = 'admin' AND permission_type = 'admin')
    )
  ) THEN
    RETURN TRUE;
  END IF;
  
  -- Check if user is admin
  IF public.has_role(auth.uid(), 'admin') THEN
    RETURN TRUE;
  END IF;
  
  RETURN FALSE;
END;
$$;

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name'
  );
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (new.id, 'user');
  
  RETURN new;
END;
$$;

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

-- Function to handle access request approval
CREATE OR REPLACE FUNCTION public.approve_access_request(
  request_id UUID,
  granted_permission permission_type DEFAULT 'view'
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  request_record access_requests%ROWTYPE;
BEGIN
  -- Get the access request
  SELECT * INTO request_record
  FROM access_requests
  WHERE id = request_id AND status = 'pending';
  
  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;
  
  -- Check if the current user is the owner
  IF NOT EXISTS (
    SELECT 1 FROM files 
    WHERE id = request_record.file_id AND user_id = auth.uid()
  ) AND NOT public.has_role(auth.uid(), 'admin') THEN
    RETURN FALSE;
  END IF;
  
  -- Insert permission
  INSERT INTO file_permissions (file_id, user_id, permission_type, granted_by)
  VALUES (
    request_record.file_id,
    request_record.requested_by,
    granted_permission,
    auth.uid()
  )
  ON CONFLICT (file_id, user_id)
  DO UPDATE SET
    permission_type = granted_permission,
    granted_by = auth.uid(),
    granted_at = now();
  
  -- Update request status
  UPDATE access_requests
  SET status = 'approved', responded_at = now()
  WHERE id = request_id;
  
  RETURN TRUE;
END;
$$;

-- Function to handle access request denial
CREATE OR REPLACE FUNCTION public.deny_access_request(request_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if the current user is the owner
  IF NOT EXISTS (
    SELECT 1 FROM access_requests ar
    JOIN files f ON f.id = ar.file_id
    WHERE ar.id = request_id AND (f.user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))
  ) THEN
    RETURN FALSE;
  END IF;
  
  -- Update request status
  UPDATE access_requests
  SET status = 'denied', responded_at = now()
  WHERE id = request_id;
  
  RETURN TRUE;
END;
$$;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- =============================================
-- TRIGGERS
-- =============================================

-- Trigger for new user creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Trigger to automatically set first user as admin
CREATE TRIGGER on_first_user_admin
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.setup_first_admin();

-- Trigger for profiles updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================
-- RLS POLICIES
-- =============================================

-- Profiles policies
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- User roles policies
CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all user roles"
  ON public.user_roles FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- Files policies
CREATE POLICY "Users can view files they own or have permission for"
  ON public.files FOR SELECT
  USING (public.has_file_permission(id, 'view'));

CREATE POLICY "Users can insert their own files"
  ON public.files FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete files they own or have admin permission for"
  ON public.files FOR DELETE
  USING (
    user_id = auth.uid() OR 
    public.has_file_permission(id, 'admin')
  );

-- File shares policies
CREATE POLICY "File owners can create shares for their files"
  ON public.file_shares FOR INSERT
  WITH CHECK (
    created_by = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.files 
      WHERE id = file_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "File owners can view their file shares"
  ON public.file_shares FOR SELECT
  USING (
    created_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.files 
      WHERE id = file_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "File owners can update their file shares"
  ON public.file_shares FOR UPDATE
  USING (
    created_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.files 
      WHERE id = file_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "File owners can delete their file shares"
  ON public.file_shares FOR DELETE
  USING (
    created_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.files 
      WHERE id = file_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all file shares"
  ON public.file_shares FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- File permissions policies
CREATE POLICY "Users can view permissions for files they own or have access to"
  ON public.file_permissions FOR SELECT
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.files 
      WHERE id = file_id AND user_id = auth.uid()
    ) OR
    public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "File owners can grant permissions"
  ON public.file_permissions FOR INSERT
  WITH CHECK (
    granted_by = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.files 
      WHERE id = file_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "File owners can update permissions"
  ON public.file_permissions FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.files 
      WHERE id = file_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "File owners can revoke permissions"
  ON public.file_permissions FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.files 
      WHERE id = file_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage all file permissions"
  ON public.file_permissions FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- Access requests policies
CREATE POLICY "Users can create access requests"
  ON public.access_requests FOR INSERT
  WITH CHECK (
    requested_by = auth.uid() AND
    owner_id != auth.uid()
  );

CREATE POLICY "Users can view their own access requests"
  ON public.access_requests FOR SELECT
  USING (requested_by = auth.uid());

CREATE POLICY "File owners can view access requests for their files"
  ON public.access_requests FOR SELECT
  USING (
    owner_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.files 
      WHERE id = file_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "File owners can update access requests"
  ON public.access_requests FOR UPDATE
  USING (
    owner_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.files 
      WHERE id = file_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all access requests"
  ON public.access_requests FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- =============================================
-- STORAGE SETUP
-- =============================================

-- Create storage bucket for files
INSERT INTO storage.buckets (id, name, public)
VALUES ('user-files', 'user-files', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for user files
CREATE POLICY "Users can upload their own files"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'user-files' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can view their own files"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'user-files' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete their own files"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'user-files' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Admins can view all files in storage"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'user-files' AND
    public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Admins can delete any file in storage"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'user-files' AND
    public.has_role(auth.uid(), 'admin')
  );

-- =============================================
-- INDEXES
-- =============================================

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_files_user_id ON public.files(user_id);
CREATE INDEX IF NOT EXISTS idx_files_created_at ON public.files(created_at);
CREATE INDEX IF NOT EXISTS idx_file_shares_file_id ON public.file_shares(file_id);
CREATE INDEX IF NOT EXISTS idx_file_shares_share_token ON public.file_shares(share_token);
CREATE INDEX IF NOT EXISTS idx_file_permissions_file_id ON public.file_permissions(file_id);
CREATE INDEX IF NOT EXISTS idx_file_permissions_user_id ON public.file_permissions(user_id);
CREATE INDEX IF NOT EXISTS idx_access_requests_file_id ON public.access_requests(file_id);
CREATE INDEX IF NOT EXISTS idx_access_requests_requested_by ON public.access_requests(requested_by);
CREATE INDEX IF NOT EXISTS idx_access_requests_owner_id ON public.access_requests(owner_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);

-- =============================================
-- COMMENTS
-- =============================================

COMMENT ON TABLE public.profiles IS 'User profile information';
COMMENT ON TABLE public.user_roles IS 'User role assignments for role-based access control';
COMMENT ON TABLE public.files IS 'File metadata and storage information';
COMMENT ON TABLE public.file_shares IS 'Public file sharing links and settings';
COMMENT ON TABLE public.file_permissions IS 'User-specific file permissions';
COMMENT ON TABLE public.access_requests IS 'File access requests and approval workflow';

COMMENT ON FUNCTION public.has_role(UUID, app_role) IS 'Check if a user has a specific role';
COMMENT ON FUNCTION public.has_file_permission(UUID, permission_type) IS 'Check if a user has permission for a file';
COMMENT ON FUNCTION public.approve_access_request(UUID, permission_type) IS 'Approve an access request and grant permission';
COMMENT ON FUNCTION public.deny_access_request(UUID) IS 'Deny an access request';
