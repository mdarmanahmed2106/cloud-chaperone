import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Trash2, Download, Eye, User, Calendar, HardDrive, LogOut } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface FileWithUser {
  id: string;
  name: string;
  size: number;
  mime_type: string;
  created_at: string;
  user_id: string;
  profiles: {
    email: string;
    full_name: string | null;
  };
}

interface AccessRequest {
  id: string;
  file_id: string;
  requested_by: string;
  owner_id: string;
  status: 'pending' | 'approved' | 'denied';
  requested_permission: 'view' | 'edit' | 'admin';
  message: string | null;
  created_at: string;
  files: {
    name: string;
  };
  requester_profile: {
    email: string;
    full_name: string | null;
  };
  owner_profile: {
    email: string;
    full_name: string | null;
  };
}

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast({
        title: "Logout Failed",
        description: "There was an issue logging you out. Please try again.",
        variant: "destructive",
      });
    } else {
      navigate("/auth");
    }
  };
  const [files, setFiles] = useState<FileWithUser[]>([]);
  const [accessRequests, setAccessRequests] = useState<AccessRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterUser, setFilterUser] = useState<string>("all");
  const [filterType, setFilterType] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("created_at");

  useEffect(() => {
    checkAdminAccess();
  }, []);

  const checkAdminAccess = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
      return;
    }

    const { data: roles, error: rolesError } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", session.user.id)
      .eq("role", "admin")
      .maybeSingle();

    if (!roles) {
      navigate("/dashboard");
      toast({
        title: "Access Denied",
        description: "You don't have admin privileges",
        variant: "destructive",
      });
      return;
    }

    // If admin, load the data
    loadFiles();
    loadAccessRequests();
  };

  const loadFiles = async () => {
    try {
      setLoading(true);
      
      // First, get all files
      const { data: filesData, error: filesError } = await supabase
        .from('files')
        .select('*')
        .order(sortBy, { ascending: false });

      if (filesError) throw filesError;

      if (!filesData || filesData.length === 0) {
        setFiles([]);
        return;
      }

      // Get all unique user IDs from files
      const userIds = [...new Set(filesData.map(file => file.user_id))];
      
      // Fetch profiles for all users
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, email, full_name')
        .in('id', userIds);

      if (profilesError) throw profilesError;

      // Combine files with profile data
      const filesWithProfiles = filesData.map(file => ({
        ...file,
        profiles: profilesData?.find(profile => profile.id === file.user_id) || {
          email: 'Unknown',
          full_name: null
        }
      }));

      setFiles(filesWithProfiles);
    } catch (error) {
      console.error('Error loading files:', error);
      toast({
        title: "Error",
        description: "Failed to load files",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadAccessRequests = async () => {
    try {
      // First, get all access requests
      const { data: requestsData, error: requestsError } = await supabase
        .from('access_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (requestsError) throw requestsError;

      if (!requestsData || requestsData.length === 0) {
        setAccessRequests([]);
        return;
      }

      // Get unique file IDs and user IDs
      const fileIds = [...new Set(requestsData.map(req => req.file_id))];
      const userIds = [...new Set([
        ...requestsData.map(req => req.requested_by),
        ...requestsData.map(req => req.owner_id)
      ])];

      // Fetch files data
      const { data: filesData, error: filesError } = await supabase
        .from('files')
        .select('id, name')
        .in('id', fileIds);

      if (filesError) throw filesError;

      // Fetch profiles data
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, email, full_name')
        .in('id', userIds);

      if (profilesError) throw profilesError;

      // Combine access requests with related data
      const requestsWithData = requestsData.map(request => ({
        ...request,
        files: filesData?.find(file => file.id === request.file_id) || { name: 'Unknown File' },
        requester_profile: profilesData?.find(profile => profile.id === request.requested_by) || {
          email: 'Unknown',
          full_name: null
        },
        owner_profile: profilesData?.find(profile => profile.id === request.owner_id) || {
          email: 'Unknown',
          full_name: null
        }
      }));

      setAccessRequests(requestsWithData);
    } catch (error) {
      console.error('Error loading access requests:', error);
    }
  };

  const handleDeleteFile = async (fileId: string, fileName: string) => {
    if (!confirm(`Are you sure you want to delete "${fileName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      // Delete from storage first
      const { data: fileData } = await supabase
        .from('files')
        .select('storage_path, user_id')
        .eq('id', fileId)
        .maybeSingle();

      if (fileData) {
        const { error: storageError } = await supabase.storage
          .from('user-files')
          .remove([fileData.storage_path]);

        if (storageError) {
          console.warn('Storage deletion error:', storageError);
        }
      }

      // Delete from database
      const { error } = await supabase
        .from('files')
        .delete()
        .eq('id', fileId);

      if (error) throw error;

      toast({
        title: "Success",
        description: `File "${fileName}" deleted successfully`,
      });

      loadFiles();
    } catch (error) {
      console.error('Error deleting file:', error);
      toast({
        title: "Error",
        description: "Failed to delete file",
        variant: "destructive",
      });
    }
  };

  const handleDownloadFile = async (fileId: string, fileName: string) => {
    try {
      const { data: fileData } = await supabase
        .from('files')
        .select('storage_path, user_id')
        .eq('id', fileId)
        .maybeSingle();

      if (!fileData) throw new Error('File not found');

      const { data, error } = await supabase.storage
        .from('user-files')
        .download(fileData.storage_path);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "Success",
        description: `Downloaded "${fileName}"`,
      });
    } catch (error) {
      console.error('Error downloading file:', error);
      toast({
        title: "Error",
        description: "Failed to download file",
        variant: "destructive",
      });
    }
  };

  const handleApproveRequest = async (requestId: string, permission: string) => {
    try {
      const { data, error } = await supabase.rpc('approve_access_request', {
        request_id: requestId,
        granted_permission: permission
      });

      if (error) throw error;

      if (data) {
        toast({
          title: "Success",
          description: "Access request approved successfully",
        });
        loadAccessRequests();
      } else {
        throw new Error('Failed to approve request');
      }
    } catch (error) {
      console.error('Error approving request:', error);
      toast({
        title: "Error",
        description: "Failed to approve access request",
        variant: "destructive",
      });
    }
  };

  const handleDenyRequest = async (requestId: string) => {
    try {
      const { data, error } = await supabase.rpc('deny_access_request', {
        request_id: requestId
      });

      if (error) throw error;

      if (data) {
        toast({
          title: "Success",
          description: "Access request denied successfully",
        });
        loadAccessRequests();
      } else {
        throw new Error('Failed to deny request');
      }
    } catch (error) {
      console.error('Error denying request:', error);
      toast({
        title: "Error",
        description: "Failed to deny access request",
        variant: "destructive",
      });
    }
  };

  const filteredFiles = files.filter(file => {
    const matchesSearch = file.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         file.profiles.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesUser = filterUser === "all" || file.user_id === filterUser;
    const matchesType = filterType === "all" || file.mime_type.includes(filterType);
    
    return matchesSearch && matchesUser && matchesType;
  });

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return '🖼️';
    if (mimeType.startsWith('video/')) return '🎥';
    if (mimeType.startsWith('audio/')) return '🎵';
    if (mimeType.includes('pdf')) return '📄';
    if (mimeType.includes('word')) return '📝';
    if (mimeType.includes('sheet')) return '📊';
    return '📁';
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground">Manage all files and access requests</p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
            onClick={handleLogout}
            title="Logout"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </Button>
          <HardDrive className="w-5 h-5" />
          <span className="text-sm text-muted-foreground">
            {files.length} files total
          </span>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Files</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{files.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Set(files.map(f => f.user_id)).size}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Size</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatFileSize(files.reduce((sum, file) => sum + file.size, 0))}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Pending Requests</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {accessRequests.filter(r => r.status === 'pending').length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters & Search</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="search">Search</Label>
              <Input
                id="search"
                placeholder="Search files or users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="user-filter">User</Label>
              <Select value={filterUser} onValueChange={setFilterUser}>
                <SelectTrigger>
                  <SelectValue placeholder="All users" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All users</SelectItem>
                  {Array.from(new Set(files.map(f => f.user_id))).map(userId => {
                    const file = files.find(f => f.user_id === userId);
                    return (
                      <SelectItem key={userId} value={userId}>
                        {file?.profiles.full_name || file?.profiles.email}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="type-filter">File Type</Label>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger>
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All types</SelectItem>
                  <SelectItem value="image">Images</SelectItem>
                  <SelectItem value="video">Videos</SelectItem>
                  <SelectItem value="audio">Audio</SelectItem>
                  <SelectItem value="pdf">PDFs</SelectItem>
                  <SelectItem value="document">Documents</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="sort">Sort By</Label>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger>
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="created_at">Date Created</SelectItem>
                  <SelectItem value="name">File Name</SelectItem>
                  <SelectItem value="size">File Size</SelectItem>
                  <SelectItem value="mime_type">File Type</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          {/* Removed sort order controls */}
        </CardContent>
      </Card>

      {/* Files Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Files</CardTitle>
          <CardDescription>
            Manage files from all users
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading files...</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>File</TableHead>
                    <TableHead>Owner</TableHead>
                    <TableHead>Size</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredFiles.map((file) => (
                    <TableRow key={file.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{getFileIcon(file.mime_type)}</span>
                          <span className="font-medium">{file.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4" />
                          <div>
                            <div className="font-medium">
                              {file.profiles.full_name || 'Unknown'}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {file.profiles.email}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{formatFileSize(file.size)}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {file.mime_type.split('/')[0]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          {formatDate(file.created_at)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDownloadFile(file.id, file.name)}
                          >
                            <Download className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => window.open(`/file/${file.id}`, '_blank')}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDeleteFile(file.id, file.name)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {filteredFiles.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No files found matching your criteria
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Access Requests */}
      <Card>
        <CardHeader>
          <CardTitle>Access Requests</CardTitle>
          <CardDescription>
            Manage file access requests from users
          </CardDescription>
        </CardHeader>
        <CardContent>
          {accessRequests.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No access requests
            </div>
          ) : (
            <div className="space-y-4">
              {accessRequests.map((request) => (
                <div key={request.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Badge variant={request.status === 'pending' ? 'default' : request.status === 'approved' ? 'secondary' : 'destructive'}>
                          {request.status}
                        </Badge>
                        <Badge variant="outline">
                          {request.requested_permission}
                        </Badge>
                      </div>
                      <div>
                        <p className="font-medium">{request.files.name}</p>
                        <p className="text-sm text-muted-foreground">
                          <strong>{request.requester_profile.full_name || request.requester_profile.email}</strong> 
                          {' '}requested {request.requested_permission} access from{' '}
                          <strong>{request.owner_profile.full_name || request.owner_profile.email}</strong>
                        </p>
                        {request.message && (
                          <p className="text-sm mt-1">"{request.message}"</p>
                        )}
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatDate(request.created_at)}
                        </p>
                      </div>
                    </div>
                    {request.status === 'pending' && (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleApproveRequest(request.id, request.requested_permission)}
                        >
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDenyRequest(request.id)}
                        >
                          Deny
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminDashboard;
