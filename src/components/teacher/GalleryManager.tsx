import React, { useState, useEffect, useRef } from 'react';
import { Upload, Trash2, Eye, EyeOff, Image, Plus, AlertCircle, CheckCircle } from 'lucide-react';
import { galleryRepository } from '../../repositories/GalleryRepository';
import type { GalleryImageWithUrl } from '../../repositories/GalleryRepository';

interface GalleryManagerProps {
    teacherId: string;
}

export default function GalleryManager({ teacherId }: GalleryManagerProps) {
    const [images, setImages] = useState<GalleryImageWithUrl[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [caption, setCaption] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        loadImages();
    }, [teacherId]);

    async function loadImages() {
        try {
            setLoading(true);
            const data = await galleryRepository.getByTeacherId(teacherId);
            setImages(data);
        } catch (err: any) {
            setError(err.message || 'Failed to load gallery images');
        } finally {
            setLoading(false);
        }
    }

    function showSuccess(msg: string) {
        setSuccess(msg);
        setTimeout(() => setSuccess(null), 3000);
    }

    function showError(msg: string) {
        setError(msg);
        setTimeout(() => setError(null), 4000);
    }

    async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        setUploading(true);
        setError(null);

        try {
            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                if (!file.type.startsWith('image/')) {
                    showError(`${file.name} is not an image file`);
                    continue;
                }
                if (file.size > 5 * 1024 * 1024) {
                    showError(`${file.name} exceeds 5MB limit`);
                    continue;
                }
                await galleryRepository.uploadImage(teacherId, file, caption || undefined, images.length + i);
            }
            await loadImages();
            setCaption('');
            if (fileInputRef.current) fileInputRef.current.value = '';
            showSuccess('Images uploaded successfully!');
        } catch (err: any) {
            showError(err.message || 'Upload failed');
        } finally {
            setUploading(false);
        }
    }

    async function handleToggle(image: GalleryImageWithUrl) {
        try {
            await galleryRepository.toggleActive(image.id, !image.is_active);
            setImages((prev) =>
                prev.map((img) => img.id === image.id ? { ...img, is_active: !img.is_active } : img)
            );
        } catch (err: any) {
            showError(err.message || 'Failed to toggle visibility');
        }
    }

    async function handleDelete(image: GalleryImageWithUrl) {
        if (!confirm('Delete this image? This cannot be undone.')) return;
        try {
            await galleryRepository.deleteImage(image.id, image.storage_path);
            setImages((prev) => prev.filter((img) => img.id !== image.id));
            showSuccess('Image deleted.');
        } catch (err: any) {
            showError(err.message || 'Failed to delete image');
        }
    }

    async function handleCaptionUpdate(image: GalleryImageWithUrl, newCaption: string) {
        try {
            await galleryRepository.updateImage(image.id, { caption: newCaption });
            setImages((prev) =>
                prev.map((img) => img.id === image.id ? { ...img, caption: newCaption } : img)
            );
        } catch (err: any) {
            showError(err.message || 'Failed to update caption');
        }
    }

    return (
        <div className="p-4 sm:p-6 lg:p-8">
            <div className="mb-8">
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Gallery Manager</h2>
                <p className="text-gray-500">Upload and manage photos that appear in the landing page gallery.</p>
            </div>

            {/* Alerts */}
            {error && (
                <div className="mb-4 flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span className="text-sm">{error}</span>
                </div>
            )}
            {success && (
                <div className="mb-4 flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl">
                    <CheckCircle className="w-4 h-4 flex-shrink-0" />
                    <span className="text-sm">{success}</span>
                </div>
            )}

            {/* Upload Section */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-8">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <Plus className="w-5 h-5 text-[#eb1b23]" />
                    Upload New Images
                </h3>

                <div className="flex flex-col sm:flex-row gap-3 mb-4">
                    <input
                        type="text"
                        placeholder="Caption (optional)"
                        value={caption}
                        onChange={(e) => setCaption(e.target.value)}
                        className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#eb1b23]/20 focus:border-[#eb1b23]"
                    />
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading}
                        className="flex items-center gap-2 px-6 py-2.5 bg-[#eb1b23] text-white rounded-xl font-medium text-sm hover:bg-red-700 transition-colors disabled:opacity-60"
                    >
                        <Upload className="w-4 h-4" />
                        {uploading ? 'Uploading...' : 'Choose Images'}
                    </button>
                </div>

                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={handleUpload}
                />

                {/* Drop zone hint */}
                <div
                    className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center cursor-pointer hover:border-[#eb1b23]/40 hover:bg-red-50/30 transition-colors"
                    onClick={() => fileInputRef.current?.click()}
                >
                    <Image className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">Click or drag images here to upload</p>
                    <p className="text-xs text-gray-400 mt-1">PNG, JPG, WebP up to 5MB each</p>
                </div>
            </div>

            {/* Image Grid */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <Image className="w-5 h-5 text-[#eb1b23]" />
                    Gallery Images ({images.length})
                </h3>

                {loading ? (
                    <div className="flex justify-center py-16">
                        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#eb1b23]" />
                    </div>
                ) : images.length === 0 ? (
                    <div className="text-center py-16 text-gray-400">
                        <Image className="w-12 h-12 mx-auto mb-3 opacity-30" />
                        <p>No images yet. Upload your first gallery image!</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {images.map((image) => (
                            <div
                                key={image.id}
                                className={`relative group rounded-xl overflow-hidden border-2 transition-all ${image.is_active ? 'border-transparent' : 'border-gray-300 opacity-60'
                                    }`}
                            >
                                {/* Image */}
                                <div className="aspect-[4/3] bg-gray-100">
                                    <img
                                        src={image.resolvedUrl}
                                        alt={image.caption || 'Gallery image'}
                                        className="w-full h-full object-cover"
                                        onError={(e) => {
                                            (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><rect width="24" height="24" fill="%23f3f4f6"/><text x="12" y="14" text-anchor="middle" font-size="8" fill="%239ca3af">No image</text></svg>';
                                        }}
                                    />
                                </div>

                                {/* Overlay controls */}
                                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                    <button
                                        onClick={() => handleToggle(image)}
                                        title={image.is_active ? 'Hide from gallery' : 'Show in gallery'}
                                        className="p-2 bg-white/20 hover:bg-white/40 rounded-lg text-white transition-colors"
                                    >
                                        {image.is_active ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                                    </button>
                                    <button
                                        onClick={() => handleDelete(image)}
                                        title="Delete image"
                                        className="p-2 bg-red-500/80 hover:bg-red-600 rounded-lg text-white transition-colors"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>

                                {/* Status badge */}
                                {!image.is_active && (
                                    <div className="absolute top-2 left-2 bg-gray-800/80 text-white text-xs px-2 py-0.5 rounded-full">
                                        Hidden
                                    </div>
                                )}

                                {/* Caption edit */}
                                <div className="p-2 bg-white">
                                    <input
                                        type="text"
                                        placeholder="Add a caption..."
                                        defaultValue={image.caption || ''}
                                        onBlur={(e) => {
                                            if (e.target.value !== (image.caption || '')) {
                                                handleCaptionUpdate(image, e.target.value);
                                            }
                                        }}
                                        className="w-full text-xs text-gray-600 border-0 focus:outline-none focus:ring-0 bg-transparent placeholder-gray-300"
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
