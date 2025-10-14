# Cloud Chaperone Database Setup Guide

This guide will help you set up the complete database schema for the Cloud Chaperone file sharing application.

## Overview

The Cloud Chaperone application uses Supabase as its backend with PostgreSQL and includes:

- **Authentication**: User registration and login via Supabase Auth
- **Role-based Access Control**: Admin and user roles
- **File Management**: Upload, download, view, and delete files
- **File Sharing**: Create shareable links with permissions
- **Access Control**: Request-based access system with approval workflow
- **Admin Dashboard**: Manage all files and users

## Database Schema

### Tables

1. **`profiles`** - User profile information
2. **`user_roles`** - Role assignments (admin/user)
3. **`files`** - File metadata and storage information
4. **`file_shares`** - Public file sharing links and settings
5. **`file_permissions`** - User-specific file permissions
6. **`access_requests`** - File access requests and approval workflow

### Enums

- **`app_role`**: `admin`, `user`
- **`permission_type`**: `view`, `edit`, `admin`
- **`request_status`**: `pending`, `approved`, `denied`

### Functions

- **`has_role(user_id, role)`** - Check if user has specific role
- **`has_file_permission(file_id, permission)`** - Check file permissions
- **`approve_access_request(request_id, permission)`** - Approve access requests
- **`deny_access_request(request_id)`** - Deny access requests

## Setup Instructions

### Option 1: Using Migration Files (Recommended)

1. **Apply the main schema migration:**
   ```bash
   supabase db push
   ```
   Or run the migration file directly in Supabase SQL editor:
   ```sql
   -- Copy and paste the contents of supabase/migrations/20250110000002_complete_schema.sql
   ```

2. **Apply sample data (optional):**
   ```sql
   -- Copy and paste the contents of supabase/migrations/20250110000003_sample_data.sql
   ```

### Option 2: Using the Complete Setup Script

1. **Run the complete setup script:**
   ```sql
   -- Copy and paste the contents of setup-database.sql into Supabase SQL editor
   ```

### Option 3: Manual Setup

If you prefer to set up manually, follow these steps in order:

1. Create the enums
2. Create the tables
3. Enable RLS on all tables
4. Create the functions
5. Create the triggers
6. Create the RLS policies
7. Set up storage bucket and policies
8. Create indexes

## Storage Configuration

The application uses Supabase Storage with a bucket named `user-files`:

- **Bucket ID**: `user-files`
- **Public**: `false` (private bucket)
- **File path structure**: `{user_id}/{timestamp}.{extension}`

## Row Level Security (RLS)

All tables have RLS enabled with comprehensive policies:

### Key Security Features

1. **User Isolation**: Users can only access their own data
2. **Admin Override**: Admins can access all data
3. **File Permissions**: Granular permission system for file access
4. **Access Requests**: Secure workflow for requesting file access
5. **Storage Security**: Files are stored with user-specific paths

### Policy Examples

- Users can only view their own files
- File owners can grant permissions to other users
- Admins can view and manage all files
- Access requests require owner approval

## Authentication Flow

1. **User Registration**: Automatically creates profile and assigns user role
2. **First User**: Automatically becomes admin
3. **Profile Management**: Users can update their own profiles
4. **Role Checking**: Functions verify user roles for access control

## File Management Flow

1. **Upload**: Files are stored in user-specific storage paths
2. **Metadata**: File information is stored in the `files` table
3. **Permissions**: Owners can grant view/edit/admin permissions
4. **Sharing**: Public or private share links can be created
5. **Access Requests**: Users can request access to files they don't own

## Admin Features

Admins have access to:

- View all files from all users
- Delete any file
- View all user profiles
- Manage all file permissions
- View all access requests
- Access all storage files

## Testing the Setup

### 1. Create a Test User

Register a new user through your application. The first user will automatically become an admin.

### 2. Upload a Test File

Upload a file through the application to test the file storage and metadata creation.

### 3. Test File Sharing

Create a share link for a file and test accessing it.

### 4. Test Access Requests

Create a second user and request access to the first user's file.

### 5. Test Admin Functions

Log in as the admin user and verify you can see all files and users.

## Sample Data

The sample data migration includes:

- 4 test users (1 admin, 3 regular users)
- 6 sample files of different types
- 3 file shares with different settings
- 3 file permissions showing different access levels
- 3 access requests in different states

## Troubleshooting

### Common Issues

1. **RLS Policies Not Working**
   - Ensure RLS is enabled on all tables
   - Check that policies are created correctly
   - Verify user authentication is working

2. **Storage Access Denied**
   - Check storage bucket policies
   - Verify file path structure matches policy expectations
   - Ensure user has proper permissions

3. **Functions Not Found**
   - Ensure all functions are created with `SECURITY DEFINER`
   - Check function signatures match usage in policies
   - Verify search_path is set correctly

4. **Triggers Not Firing**
   - Check trigger creation syntax
   - Verify trigger functions exist
   - Test trigger functions manually

### Verification Queries

```sql
-- Check if all tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- Check if RLS is enabled
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';

-- Check if functions exist
SELECT routine_name FROM information_schema.routines 
WHERE routine_schema = 'public' 
ORDER BY routine_name;

-- Check storage bucket
SELECT * FROM storage.buckets WHERE id = 'user-files';
```

## Security Considerations

1. **Never disable RLS** in production
2. **Review all policies** before deployment
3. **Test permission boundaries** thoroughly
4. **Monitor access patterns** for anomalies
5. **Keep functions secure** with `SECURITY DEFINER`
6. **Validate all inputs** in application code

## Maintenance

### Regular Tasks

1. **Monitor storage usage** and implement cleanup policies
2. **Review access requests** and clean up old ones
3. **Update user roles** as needed
4. **Backup database** regularly
5. **Monitor performance** and optimize queries

### Cleanup Queries

```sql
-- Clean up expired file shares
DELETE FROM file_shares 
WHERE expires_at < NOW() AND expires_at IS NOT NULL;

-- Clean up old access requests
DELETE FROM access_requests 
WHERE created_at < NOW() - INTERVAL '30 days' 
AND status IN ('approved', 'denied');
```

## Support

If you encounter issues:

1. Check the Supabase logs for errors
2. Verify your environment variables are set correctly
3. Ensure your Supabase project is properly configured
4. Review the application code for proper error handling

## Next Steps

After setting up the database:

1. Configure your environment variables
2. Test the application functionality
3. Set up monitoring and logging
4. Deploy to production
5. Set up backup and recovery procedures

The database is now ready to support your Cloud Chaperone application!
