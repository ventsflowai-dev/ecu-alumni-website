import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Upload, ImageIcon, Loader2, Check } from "lucide-react";

interface ImageSelectorProps {
  bucketName: string;
  folderPath: string;
  onImageSelected: (url: string) => void;
  currentImageUrl?: string;
  disabled?: boolean;
  buttonText?: string;
}

type StorageFile = {
  name: string;
  url: string;
  created_at: string;
};

export function ImageSelector({
  bucketName,
  folderPath,
  onImageSelected,
  currentImageUrl,
  disabled = false,
  buttonText = "Select Image"
}: ImageSelectorProps) {
  const [open, setOpen] = useState(false);
  const [files, setFiles] = useState<StorageFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (open) {
      loadFiles();
    }
  }, [open, bucketName, folderPath]);

  async function loadFiles() {
    setLoading(true);
    try {
      const { data, error } = await supabase.storage
        .from(bucketName)
        .list(folderPath, {
          limit: 100,
          sortBy: { column: 'created_at', order: 'desc' },
        });

      if (error) throw error;

      if (data) {
        const validFiles = data
          .filter(f => f.name !== '.emptyFolderPlaceholder')
          .map(f => {
            const path = folderPath ? `${folderPath}/${f.name}` : f.name;
            const { data: publicUrlData } = supabase.storage.from(bucketName).getPublicUrl(path);
            return {
              name: f.name,
              url: publicUrlData.publicUrl,
              created_at: f.created_at,
            };
          });
        setFiles(validFiles);
      }
    } catch (err: any) {
      console.error("Error loading images:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const fileExt = file.name.split(".").pop();
    const fileName = `${Date.now()}-${crypto.randomUUID()}.${fileExt}`;
    const filePath = folderPath ? `${folderPath}/${fileName}` : fileName;

    try {
      const { error } = await supabase.storage
        .from(bucketName)
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (error) throw error;

      const { data } = supabase.storage.from(bucketName).getPublicUrl(filePath);
      
      onImageSelected(data.publicUrl);
      setOpen(false);
    } catch (err: any) {
      console.error("Upload error:", err);
      alert(err.message || "Failed to upload image");
    } finally {
      setUploading(false);
    }
  }

  function handleSelect(url: string) {
    onImageSelected(url);
    setOpen(false);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button
              type="button"
              variant="outline"
              disabled={disabled || uploading}
            >
              <Upload className="h-4 w-4 mr-2" />
              {uploading ? "Uploading..." : buttonText}
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[700px] max-h-[80vh] flex flex-col">
            <DialogHeader>
              <DialogTitle>Select Image</DialogTitle>
            </DialogHeader>
            <Tabs defaultValue="upload" className="w-full mt-4 flex-1 flex flex-col overflow-hidden">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="upload">Upload New</TabsTrigger>
                <TabsTrigger value="library">Media Library</TabsTrigger>
              </TabsList>
              
              <TabsContent value="upload" className="flex-1 p-6 flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-lg mt-4 bg-slate-50">
                <div className="text-center space-y-4">
                  <div className="p-4 bg-white rounded-full inline-block shadow-sm">
                    <Upload className="h-8 w-8 text-slate-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-700">Click to browse or drag image here</p>
                    <p className="text-xs text-slate-500 mt-1">PNG, JPG, GIF up to 5MB</p>
                  </div>
                  <Button type="button" onClick={() => document.getElementById('image-upload-input')?.click()} disabled={uploading}>
                    {uploading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : "Browse Files"}
                  </Button>
                  <input
                    id="image-upload-input"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleUpload}
                  />
                </div>
              </TabsContent>
              
              <TabsContent value="library" className="flex-1 overflow-y-auto mt-4">
                {loading ? (
                  <div className="flex items-center justify-center p-12">
                    <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
                  </div>
                ) : files.length === 0 ? (
                  <div className="text-center p-12 bg-slate-50 rounded-lg border border-slate-200">
                    <ImageIcon className="h-8 w-8 mx-auto text-slate-300 mb-3" />
                    <p className="text-sm text-slate-500">No images found in this folder.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-4 pb-4">
                    {files.map((file) => (
                      <div 
                        key={file.name} 
                        className={`relative aspect-square rounded-lg overflow-hidden border-2 cursor-pointer group hover:opacity-90 transition-all ${currentImageUrl === file.url ? 'border-primary' : 'border-transparent'}`}
                        onClick={() => handleSelect(file.url)}
                      >
                        <img 
                          src={file.url} 
                          alt={file.name} 
                          className="w-full h-full object-cover" 
                        />
                        {currentImageUrl === file.url && (
                          <div className="absolute top-2 right-2 bg-primary text-primary-foreground p-1 rounded-full">
                            <Check className="h-3 w-3" />
                          </div>
                        )}
                        <div className="absolute inset-x-0 bottom-0 bg-black/50 p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <p className="text-[10px] text-white truncate">{file.name}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </DialogContent>
        </Dialog>
      </div>
      {currentImageUrl && (
        <div className="rounded-xl overflow-hidden border border-slate-200 bg-slate-50 relative aspect-video mt-4">
          <img
            src={currentImageUrl}
            alt="Preview"
            className="absolute inset-0 w-full h-full object-cover"
          />
        </div>
      )}
    </div>
  );
}
