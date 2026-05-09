import { useState, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { Upload, Trash2, Eye, EyeOff, Image as ImageIcon } from 'lucide-react';
import { GalleryApi } from '@/features/teacher/api';
import type { GalleryImage } from '@/features/teacher/api';
import { FilesApi } from '../../api';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/skeleton';

export default function GalleryManager() {
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { fetchImages(); }, []);

  async function fetchImages() {
    try {
      setLoading(true);
      setImages(await GalleryApi.getImages());
    } catch { toast.error('Failed to load gallery'); }
    finally { setLoading(false); }
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    setUploading(true);
    try {
      for (const file of files) {
        const path = `gallery/${Date.now()}_${file.name.replace(/\s+/g, '_')}`;
        const storagePath = await FilesApi.uploadWithSignedUrl('acp', path, file);
        const publicUrl = await FilesApi.getPublicUrl('acp', storagePath);
        const image = await GalleryApi.addImage({ storage_path: storagePath, public_url: publicUrl });
        setImages(prev => [...prev, image]);
      }
      toast.success(`${files.length} image${files.length > 1 ? 's' : ''} uploaded`);
    } catch { toast.error('Upload failed. Check storage bucket permissions.'); }
    finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  async function handleDelete(id: string) {
    try {
      await GalleryApi.deleteImage(id);
      setImages(prev => prev.filter(i => i.id !== id));
      toast.success('Image deleted');
    } catch { toast.error('Failed to delete image'); }
  }

  async function handleToggle(image: GalleryImage) {
    try {
      await GalleryApi.toggleActive(image.id, !image.is_active);
      setImages(prev => prev.map(i => i.id === image.id ? { ...i, is_active: !i.is_active } : i));
    } catch { toast.error('Failed to update visibility'); }
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gallery</h1>
          <p className="text-sm text-gray-500 mt-1">Images displayed on the public website gallery section</p>
        </div>
        <Button onClick={() => fileInputRef.current?.click()} isLoading={uploading} className="gap-2">
          <Upload className="w-4 h-4" />
          Upload Images
        </Button>
        <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleFileChange} />
      </div>

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="aspect-square rounded-xl" />)}
        </div>
      ) : images.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
            <ImageIcon className="w-8 h-8 text-gray-400" />
          </div>
          <p className="font-medium text-gray-700">No images yet</p>
          <p className="text-sm text-gray-400 mt-1">Upload photos to show on the public gallery</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {images.map(image => (
            <div key={image.id} className="group relative rounded-xl overflow-hidden bg-gray-100 aspect-square">
              <img
                src={image.public_url ?? ''}
                alt={image.caption ?? ''}
                className={`w-full h-full object-cover transition-opacity ${image.is_active ? 'opacity-100' : 'opacity-40'}`}
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                <button
                  onClick={() => handleToggle(image)}
                  className="p-2 rounded-full bg-white/90 hover:bg-white text-gray-700 transition-colors"
                  title={image.is_active ? 'Hide from website' : 'Show on website'}
                >
                  {image.is_active ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
                <button
                  onClick={() => handleDelete(image.id)}
                  className="p-2 rounded-full bg-white/90 hover:bg-white text-red-600 transition-colors"
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              {!image.is_active && (
                <span className="absolute top-2 left-2 px-2 py-0.5 rounded text-[10px] font-semibold bg-black/60 text-white">
                  Hidden
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
