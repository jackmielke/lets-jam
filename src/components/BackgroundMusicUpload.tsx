import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Upload, Music, X } from "lucide-react";
import { toast } from "sonner";

interface BackgroundMusicUploadProps {
  onUploadComplete: () => void;
}

export const BackgroundMusicUpload = ({ onUploadComplete }: BackgroundMusicUploadProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const uploadFile = async (file: File) => {
    if (!file.type.startsWith("audio/")) {
      toast.error("Please upload an audio file");
      return;
    }

    setIsUploading(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = fileName;

      const { error: uploadError } = await supabase.storage
        .from("background-music")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      toast.success("Music uploaded successfully!");
      onUploadComplete();
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Failed to upload music file");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      await uploadFile(files[0]);
    }
  };

  const handleFileInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      await uploadFile(files[0]);
    }
  };

  return (
    <Card
      className={`p-6 border-2 border-dashed transition-colors ${
        isDragging ? "border-primary bg-primary/5" : "border-border"
      }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="flex flex-col items-center gap-4">
        <Music className="w-12 h-12 text-muted-foreground" />
        <div className="text-center">
          <p className="text-sm font-medium">
            {isDragging ? "Drop your music file here" : "Drag and drop music files here"}
          </p>
          <p className="text-xs text-muted-foreground mt-1">or</p>
        </div>
        <label htmlFor="music-upload">
          <Button
            variant="outline"
            disabled={isUploading}
            onClick={() => document.getElementById("music-upload")?.click()}
          >
            <Upload className="w-4 h-4 mr-2" />
            {isUploading ? "Uploading..." : "Browse Files"}
          </Button>
          <input
            id="music-upload"
            type="file"
            accept="audio/*"
            className="hidden"
            onChange={handleFileInput}
            disabled={isUploading}
          />
        </label>
        <p className="text-xs text-muted-foreground">Supports MP3, WAV, and other audio formats</p>
      </div>
    </Card>
  );
};
