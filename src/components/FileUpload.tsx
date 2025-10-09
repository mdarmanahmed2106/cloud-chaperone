import { useCallback } from "react";
import { Upload } from "lucide-react";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

interface FileUploadProps {
  onUpload: (file: File) => void;
}

const FileUpload = ({ onUpload }: FileUploadProps) => {
  const { toast } = useToast();

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      const file = e.dataTransfer.files[0];
      if (file) {
        if (file.size > 10 * 1024 * 1024) {
          toast({
            title: "File too large",
            description: "Maximum file size is 10MB",
            variant: "destructive",
          });
          return;
        }
        onUpload(file);
      }
    },
    [onUpload, toast]
  );

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Maximum file size is 10MB",
          variant: "destructive",
        });
        return;
      }
      onUpload(file);
    }
  };

  const preventDefault = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  return (
    <Card
      className="border-2 border-dashed border-border hover:border-primary/50 transition-all duration-300 cursor-pointer bg-gradient-to-br from-card to-card/50 shadow-card hover:shadow-elegant"
      onDrop={handleDrop}
      onDragOver={preventDefault}
      onDragEnter={preventDefault}
    >
      <label htmlFor="file-upload" className="cursor-pointer">
        <div className="p-12 text-center space-y-4">
          <div className="flex justify-center">
            <div className="bg-gradient-to-br from-primary/10 to-primary-glow/10 p-6 rounded-2xl border border-primary/20">
              <Upload className="w-12 h-12 text-primary" />
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-xl font-semibold text-foreground">
              Drop files here or click to upload
            </p>
            <p className="text-sm text-muted-foreground">
              Maximum file size: 10MB
            </p>
          </div>
        </div>
        <input
          id="file-upload"
          type="file"
          className="hidden"
          onChange={handleFileInput}
          accept="image/*,application/pdf"
        />
      </label>
    </Card>
  );
};

export default FileUpload;
