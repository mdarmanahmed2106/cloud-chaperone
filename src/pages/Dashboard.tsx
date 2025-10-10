import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Layout from "@/components/Layout";
import FileUpload from "@/components/FileUpload";
import FileGrid from "@/components/FileGrid";
import { useToast } from "@/hooks/use-toast";

interface FileData {
  id: string;
  name: string;
  size: number;
  mime_type: string;
  storage_path: string;
  created_at: string;
  user_id: string;
}

const Dashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [files, setFiles] = useState<FileData[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);

  useEffect(() => {
    checkAuth();
    fetchFiles();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
    }
  };

  const fetchFiles = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setFiles([]);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("files")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setFiles(data || []);
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

  const handleFileUpload = async (file: File) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const fileExt = file.name.split(".").pop();
    const fileName = `${user.id}/${Date.now()}.${fileExt}`;

    // Simulated progress: smoothly increase to 90% while the upload is in-flight
    let progressInterval: number | undefined;
    try {
      setUploadProgress(0);
      let current = 0;
      progressInterval = window.setInterval(() => {
        current = Math.min(current + 2, 90);
        setUploadProgress(current);
      }, 100);

      const { error: uploadError } = await supabase.storage
        .from("user-files")
        .upload(fileName, file, { upsert: false });

      if (uploadError) throw uploadError;

      const { error: dbError } = await supabase.from("files").insert({
        user_id: user.id,
        name: file.name,
        size: file.size,
        mime_type: file.type,
        storage_path: fileName,
      });

      if (dbError) throw dbError;

      // Finish progress to 100%
      setUploadProgress(100);
      setTimeout(() => setUploadProgress(null), 400);

      toast({
        title: "Success!",
        description: "File uploaded successfully",
      });

      fetchFiles();
    } catch (error) {
      console.error("Error uploading file:", error);
      setUploadProgress(null);
      toast({
        title: "Error",
        description: "Failed to upload file",
        variant: "destructive",
      });
    } finally {
      if (progressInterval) window.clearInterval(progressInterval);
    }
  };

  const handleFileDelete = async (fileId: string, storagePath: string) => {
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

      fetchFiles();
    } catch (error) {
      console.error("Error deleting file:", error);
      toast({
        title: "Error",
        description: "Failed to delete file",
        variant: "destructive",
      });
    }
  };

  return (
    <Layout>
      <div className="space-y-8">
        <div className="text-center space-y-2">
          <h2 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
            My Files
          </h2>
          <p className="text-muted-foreground">Upload and manage your files</p>
        </div>

        <FileUpload onUpload={handleFileUpload} uploadProgress={uploadProgress} />
        
        <FileGrid 
          files={files} 
          loading={loading} 
          onDelete={handleFileDelete}
        />
      </div>
    </Layout>
  );
};

export default Dashboard;
