import { BaseRepository } from './BaseRepository';
import { supabase } from '../lib/supabase';

export interface GalleryImage {
    id: string;
    teacher_id: string;
    storage_path: string;
    public_url: string | null;
    caption: string | null;
    display_order: number;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export interface GalleryImageWithUrl extends GalleryImage {
    resolvedUrl: string;
}

/**
 * Gallery Repository
 * 
 * Manages gallery images: storing metadata in DB and files in Supabase Storage.
 * Following repository pattern for easy DB-implementation switching.
 */
export class GalleryRepository extends BaseRepository<GalleryImage> {
    private readonly STORAGE_BUCKET = 'acp';
    private readonly STORAGE_FOLDER = 'images/gallery';

    constructor() {
        super('gallery_images');
    }

    /**
     * Get all active gallery images ordered by display_order
     */
    async getActiveImages(): Promise<GalleryImageWithUrl[]> {
        const { data, error } = await supabase
            .from('gallery_images')
            .select('*')
            .eq('is_active', true)
            .order('display_order', { ascending: true });

        if (error) throw error;
        const images = data || [];

        return images.map((img) => ({
            ...img,
            resolvedUrl: img.public_url || '',
        }));
    }

    /**
     * Get all gallery images for a teacher (including inactive)
     */
    async getByTeacherId(teacherId: string): Promise<GalleryImageWithUrl[]> {
        const { data, error } = await supabase
            .from('gallery_images')
            .select('*')
            .eq('teacher_id', teacherId)
            .order('display_order', { ascending: true });

        if (error) throw error;
        const images = data || [];

        return images.map((img) => ({
            ...img,
            resolvedUrl: img.public_url || '',
        }));
    }

    /**
     * Upload an image file to Supabase Storage and create a DB record
     */
    async uploadImage(
        teacherId: string,
        file: File,
        caption?: string,
        displayOrder?: number
    ): Promise<GalleryImageWithUrl> {
        const ext = file.name.split('.').pop();
        const fileName = `${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
        const storagePath = `${this.STORAGE_FOLDER}/${fileName}`;

        // Upload to storage
        const { error: uploadError } = await supabase.storage
            .from(this.STORAGE_BUCKET)
            .upload(storagePath, file, { upsert: false });

        if (uploadError) throw uploadError;

        // Get public URL
        const { data: urlData } = supabase.storage
            .from(this.STORAGE_BUCKET)
            .getPublicUrl(storagePath);

        const publicUrl = urlData?.publicUrl || null;

        // Save to DB
        const { data, error } = await supabase
            .from('gallery_images')
            .insert({
                teacher_id: teacherId,
                storage_path: storagePath,
                public_url: publicUrl,
                caption: caption || null,
                display_order: displayOrder ?? 0,
                is_active: true,
            })
            .select()
            .single();

        if (error) throw error;
        if (!data) throw new Error('Failed to create gallery image record');

        return { ...data, resolvedUrl: publicUrl || '' };
    }

    /**
     * Update image caption or order
     */
    async updateImage(
        imageId: string,
        updates: Partial<Pick<GalleryImage, 'caption' | 'display_order' | 'is_active'>>
    ): Promise<GalleryImage> {
        const { data, error } = await supabase
            .from('gallery_images')
            .update({ ...updates, updated_at: new Date().toISOString() })
            .eq('id', imageId)
            .select()
            .single();

        if (error) throw error;
        if (!data) throw new Error('Failed to update gallery image');
        return data;
    }

    /**
     * Delete an image (removes from DB and Storage)
     */
    async deleteImage(imageId: string, storagePath: string): Promise<void> {
        // Delete from storage
        await supabase.storage.from(this.STORAGE_BUCKET).remove([storagePath]);

        // Delete from DB
        const { error } = await supabase
            .from('gallery_images')
            .delete()
            .eq('id', imageId);

        if (error) throw error;
    }

    /**
     * Toggle active status
     */
    async toggleActive(imageId: string, isActive: boolean): Promise<void> {
        const { error } = await supabase
            .from('gallery_images')
            .update({ is_active: isActive, updated_at: new Date().toISOString() })
            .eq('id', imageId);

        if (error) throw error;
    }
}

export const galleryRepository = new GalleryRepository();
