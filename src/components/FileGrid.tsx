import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileIcon, Trash2, Eye, Loader2, Image } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
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

interface FileGridProps {
  files: FileData[];
  loading: boolean;
  onDelete: (fileId: string, storagePath: string) => void;
}

const FileGrid = ({ files, loading, onDelete }: FileGridProps) => {
  const { toast } = useToast();
  const [viewingFile, setViewingFile] = useState<string | null>(null);

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  const handleView = async (file: FileData) => {
    try {
      const { data, error } = await supabase.storage
        .from("user-files")
        .createSignedUrl(file.storage_path, 3600);

      if (error) throw error;

      if (file.mime_type.startsWith("image/")) {
        setViewingFile(data.signedUrl);
      } else {
        window.open(data.signedUrl, "_blank");
      }
    } catch (error) {
      console.error("Error viewing file:", error);
      toast({
        title: "Error",
        description: "Failed to view file",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (files.length === 0) {
    return (
      <Card className="bg-gradient-to-br from-card to-card/80 border-border/50 shadow-card">
        <CardContent className="p-12 text-center">
          <div className="flex justify-center mb-4">
            <div className="bg-muted p-4 rounded-full">
              <FileIcon className="w-8 h-8 text-muted-foreground" />
            </div>
          </div>
          <h3 className="text-xl font-semibold mb-2">No files yet</h3>
          <p className="text-muted-foreground">Upload your first file to get started</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {files.map((file) => (
          <Card
            key={file.id}
            className="group hover:shadow-elegant transition-all duration-300 border-border/50 bg-gradient-to-br from-card to-card/80 overflow-hidden"
          >
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1 min-w-0">
                  {file.mime_type.startsWith("image/") ? (
                    <div className="bg-gradient-to-br from-primary/10 to-accent/10 p-3 rounded-lg inline-block border border-primary/20">
                      <Image className="w-8 h-8 text-primary" />
                    </div>
                  ) : (
                    <div className="bg-gradient-to-br from-accent/10 to-primary/10 p-3 rounded-lg inline-block border border-accent/20">
                      <FileIcon className="w-8 h-8 text-accent" />
                    </div>
                  )}
                </div>
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={() => handleView(file)}
                    className="h-8 w-8"
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="destructive"
                    onClick={() => onDelete(file.id, file.storage_path)}
                    className="h-8 w-8"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <h3 className="font-semibold text-foreground truncate" title={file.name}>
                  {file.name}
                </h3>
                <p className="text-sm text-muted-foreground">{formatFileSize(file.size)}</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(file.created_at).toLocaleDateString()}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {viewingFile && (
        <div
          className="fixed inset-0 bg-background/90 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setViewingFile(null)}
        >
          <div className="max-w-4xl max-h-[90vh] overflow-auto">
            <img
              src={viewingFile}
              alt="File preview"
              className="rounded-lg shadow-elegant border border-border"
            />
          </div>
        </div>
      )}
    </>
  );
};

export default FileGrid;
