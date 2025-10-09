-- Add file sharing and permissions support
-- This migration adds tables for file sharing, access requests, and permissions

-- Create enum for permission types
CREATE TYPE public.permission_type AS ENUM ('view', 'edit', 'admin');

-- Create enum for request status
CREATE TYPE public.request_status AS ENUM ('pending', 'approved', 'denied');

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

-- Enable RLS on file_shares
ALTER TABLE public.file_shares ENABLE ROW LEVEL SECURITY;

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

-- Enable RLS on file_permissions
ALTER TABLE public.file_permissions ENABLE ROW LEVEL SECURITY;

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

-- Enable RLS on access_requests
ALTER TABLE public.access_requests ENABLE ROW LEVEL SECURITY;

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

-- Admin policies for file shares
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

-- Admin policies for file permissions
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

-- Admin policies for access requests
CREATE POLICY "Admins can view all access requests"
  ON public.access_requests FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

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

-- Update existing files policies to use the new permission function
DROP POLICY IF EXISTS "Users can view their own files" ON public.files;
DROP POLICY IF EXISTS "Admins can view all files" ON public.files;

CREATE POLICY "Users can view files they own or have permission for"
  ON public.files FOR SELECT
  USING (public.has_file_permission(id, 'view'));

CREATE POLICY "Users can delete files they own or have admin permission for"
  ON public.files FOR DELETE
  USING (
    user_id = auth.uid() OR 
    public.has_file_permission(id, 'admin')
  );
