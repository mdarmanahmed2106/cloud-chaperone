import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash2, User, Loader2, FileIcon, Image } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface FileWithUser {
  id: string;
  name: string;
  size: number;
  mime_type: string;
  storage_path: string;
  created_at: string;
  user_id: string;
  profiles: {
    email: string;
    full_name: string | null;
  } | null;
}

const Admin = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [files, setFiles] = useState<FileWithUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    checkAdminAccess();
  }, []);

  const checkAdminAccess = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
      return;
    }

    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", session.user.id)
      .eq("role", "admin")
      .single();

    if (!roles) {
      navigate("/dashboard");
      toast({
        title: "Access Denied",
        description: "You don't have admin privileges",
        variant: "destructive",
      });
      return;
    }

    setIsAdmin(true);
    fetchAllFiles();
  };

  const fetchAllFiles = async () => {
    try {
      const { data: filesData, error: filesError } = await supabase
        .from("files")
        .select("*")
        .order("created_at", { ascending: false });

      if (filesError) throw filesError;

      const { data: profilesData, error: profilesError } = await supabase
        .from("profiles")
        .select("id, email, full_name");

      if (profilesError) throw profilesError;

      const filesWithUsers = filesData?.map(file => {
        const profile = profilesData?.find(p => p.id === file.user_id);
        return {
          ...file,
          profiles: profile || null
        };
      });

      setFiles(filesWithUsers || []);
    } catch (error) {
      console.error("Error fetching files:", error);
      toast({
        title: "Error",
        description: "Failed to load files",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (fileId: string, storagePath: string) => {
    try {
      const { error: storageError } = await supabase.storage
        .from("user-files")
        .remove([storagePath]);

      if (storageError) throw storageError;

      const { error: dbError } = await supabase
        .from("files")
        .delete()
        .eq("id", fileId);

      if (dbError) throw dbError;

      toast({
        title: "Success!",
        description: "File deleted successfully",
      });

      fetchAllFiles();
    } catch (error) {
      console.error("Error deleting file:", error);
      toast({
        title: "Error",
        description: "Failed to delete file",
        variant: "destructive",
      });
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  if (!isAdmin) {
    return null;
  }

  return (
    <Layout isAdmin={isAdmin}>
      <div className="space-y-8">
        <div className="text-center space-y-2">
          <h2 className="text-4xl font-bold bg-gradient-to-r from-accent to-primary bg-clip-text text-transparent">
            Admin Dashboard
          </h2>
          <p className="text-muted-foreground">Manage all user files</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : files.length === 0 ? (
          <Card className="bg-gradient-to-br from-card to-card/80 border-border/50 shadow-card">
            <CardContent className="p-12 text-center">
              <div className="flex justify-center mb-4">
                <div className="bg-muted p-4 rounded-full">
                  <FileIcon className="w-8 h-8 text-muted-foreground" />
                </div>
              </div>
              <h3 className="text-xl font-semibold mb-2">No files yet</h3>
              <p className="text-muted-foreground">No users have uploaded files</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {files.map((file) => (
              <Card
                key={file.id}
                className="hover:shadow-elegant transition-all duration-300 border-border/50 bg-gradient-to-br from-card to-card/80"
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {file.mime_type.startsWith("image/") ? (
                        <div className="bg-gradient-to-br from-primary/10 to-accent/10 p-3 rounded-lg border border-primary/20">
                          <Image className="w-5 h-5 text-primary" />
                        </div>
                      ) : (
                        <div className="bg-gradient-to-br from-accent/10 to-primary/10 p-3 rounded-lg border border-accent/20">
                          <FileIcon className="w-5 h-5 text-accent" />
                        </div>
                      )}
                      <div>
                        <CardTitle className="text-lg">{file.name}</CardTitle>
                        <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                          <User className="w-4 h-4" />
                          <span>
                            {file.profiles?.full_name || file.profiles?.email || "Unknown User"}
                          </span>
                        </div>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDelete(file.id, file.storage_path)}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span>{formatFileSize(file.size)}</span>
                  <span>•</span>
                  <span>{new Date(file.created_at).toLocaleDateString()}</span>
                  <span>•</span>
                  <span className="text-xs font-mono bg-muted px-2 py-1 rounded">
                    {file.mime_type}
                  </span>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Admin;
