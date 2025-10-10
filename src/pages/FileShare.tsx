import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Download, 
  Share2, 
  Lock, 
  User, 
  Calendar, 
  HardDrive, 
  Eye,
  AlertCircle,
  CheckCircle,
  Clock
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface FileData {
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
  status: 'pending' | 'approved' | 'denied';
  requested_permission: 'view' | 'edit' | 'admin';
  message: string | null;
  created_at: string;
}

const FileShare = () => {
  const { fileId } = useParams<{ fileId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [file, setFile] = useState<FileData | null>(null);
  const [hasAccess, setHasAccess] = useState<boolean>(false);
  const [accessRequest, setAccessRequest] = useState<AccessRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [requestingAccess, setRequestingAccess] = useState(false);
  const [requestMessage, setRequestMessage] = useState("");
  const [requestPermission, setRequestPermission] = useState<'view' | 'edit'>('view');
  const [showRequestDialog, setShowRequestDialog] = useState(false);

  useEffect(() => {
    if (fileId) {
      loadFileData();
    }
  }, [fileId]);

  const loadFileData = async () => {
    try {
      setLoading(true);
      
      // Get file information
      const { data: fileData, error: fileError } = await supabase
        .from('files')
        .select('*')
        .eq('id', fileId)
        .single();

      if (fileError) throw fileError;

      // Get profile information for the file owner
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id, email, full_name')
        .eq('id', fileData.user_id)
        .maybeSingle();

      if (profileError) throw profileError;

      // Combine file data with profile data
      const fileWithProfile = {
        ...fileData,
        profiles: profileData || {
          email: 'Unknown',
          full_name: null
        }
      };

      setFile(fileWithProfile);

      // Check if current user has access
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        // Check if user is the owner
        if (fileWithProfile.user_id === user.id) {
          setHasAccess(true);
        } else {
          // Check if user has explicit permission
          const { data: permission } = await supabase
            .from('file_permissions')
            .select('permission_type')
            .eq('file_id', fileId)
            .eq('user_id', user.id)
            .maybeSingle();

          if (permission) {
            setHasAccess(true);
          } else {
            // Check for existing access request
            const { data: request } = await supabase
              .from('access_requests')
              .select('*')
              .eq('file_id', fileId)
              .eq('requested_by', user.id)
              .maybeSingle();

            if (request) {
              setAccessRequest(request);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error loading file:', error);
      toast({
        title: "Error",
        description: "Failed to load file information",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRequestAccess = async () => {
    if (!file) return;

    try {
      setRequestingAccess(true);
      
      const { error } = await supabase
        .from('access_requests')
        .insert({
          file_id: file.id,
          requested_by: (await supabase.auth.getUser()).data.user!.id,
          owner_id: file.user_id,
          requested_permission: requestPermission,
          message: requestMessage || null
        });

      if (error) throw error;

      toast({
        title: "Access Request Sent",
        description: "Your request has been sent to the file owner",
      });

      setShowRequestDialog(false);
      setRequestMessage("");
      loadFileData(); // Reload to show the request status
    } catch (error) {
      console.error('Error requesting access:', error);
      toast({
        title: "Error",
        description: "Failed to send access request",
        variant: "destructive",
      });
    } finally {
      setRequestingAccess(false);
    }
  };

  const handleDownload = async () => {
    if (!file || !hasAccess) return;

    try {
      const { data: fileData } = await supabase
        .from('files')
        .select('storage_path, user_id')
        .eq('id', file.id)
        .maybeSingle();

      if (!fileData) throw new Error('File not found');

      const { data, error } = await supabase.storage
        .from('user-files')
        .download(fileData.storage_path);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "Download Started",
        description: `Downloading "${file.name}"`,
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
      month: 'long',
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

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading file...</p>
        </div>
      </div>
    );
  }

  if (!file) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="pt-6">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                File not found. The file may have been deleted or the link is invalid.
              </AlertDescription>
            </Alert>
            <div className="mt-4">
              <Button onClick={() => navigate('/dashboard')}>
                Go to Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="text-6xl">{getFileIcon(file.mime_type)}</div>
              <div>
                <CardTitle className="text-2xl">{file.name}</CardTitle>
                <CardDescription className="mt-2">
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-1">
                      <HardDrive className="w-4 h-4" />
                      {formatFileSize(file.size)}
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {formatDate(file.created_at)}
                    </div>
                  </div>
                </CardDescription>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <Share2 className="w-4 h-4 mr-2" />
                Share
              </Button>
              {hasAccess && (
                <Button onClick={handleDownload}>
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* File Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold mb-2">File Information</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Type:</span>
                  <Badge variant="secondary">{file.mime_type}</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Size:</span>
                  <span>{formatFileSize(file.size)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Created:</span>
                  <span>{formatDate(file.created_at)}</span>
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="font-semibold mb-2">Owner</h3>
              <div className="flex items-center gap-2">
                <User className="w-4 h-4" />
                <div>
                  <div className="font-medium">
                    {file.profiles.full_name || 'Unknown User'}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {file.profiles.email}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Access Status */}
          {hasAccess ? (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                You have access to this file. You can download it using the button above.
              </AlertDescription>
            </Alert>
          ) : accessRequest ? (
            <Alert>
              {accessRequest.status === 'pending' && <Clock className="h-4 h-4" />}
              {accessRequest.status === 'approved' && <CheckCircle className="h-4 w-4" />}
              {accessRequest.status === 'denied' && <AlertCircle className="h-4 w-4" />}
              <AlertDescription>
                {accessRequest.status === 'pending' && 
                  `You have requested ${accessRequest.requested_permission} access to this file. Waiting for owner approval.`
                }
                {accessRequest.status === 'approved' && 
                  `Your request for ${accessRequest.requested_permission} access has been approved!`
                }
                {accessRequest.status === 'denied' && 
                  `Your request for ${accessRequest.requested_permission} access has been denied.`
                }
              </AlertDescription>
            </Alert>
          ) : (
            <Alert>
              <Lock className="h-4 w-4" />
              <AlertDescription>
                You don't have access to this file. Request access from the owner to view or download it.
              </AlertDescription>
            </Alert>
          )}

          {/* Request Access Form */}
          {!hasAccess && !accessRequest && (
            <div className="border-t pt-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Request Access</h3>
                <Dialog open={showRequestDialog} onOpenChange={setShowRequestDialog}>
                  <DialogTrigger asChild>
                    <Button>
                      <Eye className="w-4 h-4 mr-2" />
                      Request Access
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Request File Access</DialogTitle>
                      <DialogDescription>
                        Send a request to {file.profiles.full_name || file.profiles.email} for access to "{file.name}"
                      </DialogDescription>
                    </DialogHeader>
                    
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="permission">Permission Level</Label>
                        <Select value={requestPermission} onValueChange={(value: 'view' | 'edit') => setRequestPermission(value)}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="view">View Only - Download the file</SelectItem>
                            <SelectItem value="edit">Edit - Upload new versions or delete</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div>
                        <Label htmlFor="message">Message (Optional)</Label>
                        <Textarea
                          id="message"
                          placeholder="Explain why you need access to this file..."
                          value={requestMessage}
                          onChange={(e) => setRequestMessage(e.target.value)}
                        />
                      </div>
                      
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => setShowRequestDialog(false)}>
                          Cancel
                        </Button>
                        <Button onClick={handleRequestAccess} disabled={requestingAccess}>
                          {requestingAccess ? 'Sending...' : 'Send Request'}
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
              
              <p className="text-sm text-muted-foreground">
                Contact the file owner to request access. They will be notified of your request and can grant you permission to view or edit this file.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default FileShare;
