import { BaseRepository } from './BaseRepository';
import { supabase } from '../lib/supabase';

export interface SuccessStudent {
  id: bigint | string;
  full_name: string | null;
  index_no: bigint | null;
  results: string | null;
  faculty: string | null;
  university: string | null;
  image_path: string | null;
  created_at?: string;
}

export interface SuccessStudentWithUrl extends SuccessStudent {
  resolvedUrl: string;
}

/**
 * Success Repository
 * 
 * Handles CRUD operations for successful student data with image management
 */
export class SuccessRepository extends BaseRepository<SuccessStudent> {
  private readonly STORAGE_BUCKET = 'acp';
  private readonly STORAGE_FOLDER = 'images/success';

  constructor() {
    super('success');
  }

  /**
   * Get all success students with resolved image URLs
   */
  async getAllWithUrls(): Promise<SuccessStudentWithUrl[]> {
    const { data, error } = await supabase
      .from('success')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    const students = data || [];

    return students.map((student) => ({
      ...student,
      resolvedUrl: student.image_path ? this.getPublicUrl(student.image_path) : '',
    }));
  }

  /**
   * Get all successful students with formatted image URLs (for landing page)
   */
  async getSuccessStudents(): Promise<FormattedSuccessStudent[]> {
    try {
      const students = await this.getAllWithUrls();

      return students.map((student) => ({
        id: String(student.id),
        name: student.full_name || 'Unknown',
        subtitle: String(student.index_no ?? ''),
        faculty: student.faculty || '',
        university: student.university || '',
        grade: student.results || 'AAA',
        image: student.resolvedUrl,
      }));
    } catch (error) {
      throw error;
    }
  }

  /**
   * Upload an image file to Supabase Storage and create a DB record
   */
  async uploadSuccess(
    file: File,
    fullName: string,
    indexNo: string,
    results: string,
    faculty: string,
    university: string
  ): Promise<SuccessStudentWithUrl> {
    const ext = file.name.split('.').pop();
    const fileName = `${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
    const storagePath = `${this.STORAGE_FOLDER}/${fileName}`;

    // Upload to storage
    const { error: uploadError } = await supabase.storage
      .from(this.STORAGE_BUCKET)
      .upload(storagePath, file, { upsert: false });

    if (uploadError) throw uploadError;

    // Save to DB
    const { data, error } = await supabase
      .from('success')
      .insert({
        full_name: fullName,
        index_no: parseInt(indexNo) || null,
        results: results || 'AAA',
        faculty: faculty,
        university: university,
        image_path: fileName,
      })
      .select()
      .single();

    if (error) throw error;
    if (!data) throw new Error('Failed to create success record');

    return {
      ...data,
      resolvedUrl: this.getPublicUrl(fileName),
    };
  }

  /**
   * Update a success student record
   */
  async updateSuccess(
    id: string | bigint,
    updates: Partial<Omit<SuccessStudent, 'id' | 'created_at'>>
  ): Promise<SuccessStudent> {
    const { data, error } = await supabase
      .from('success')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    if (!data) throw new Error('Failed to update success record');
    return data;
  }

  /**
   * Delete a success student record and its image
   */
  async deleteSuccess(id: string | bigint, imagePath: string): Promise<void> {
    // Delete from storage if image exists
    if (imagePath) {
      const storagePath = `${this.STORAGE_FOLDER}/${imagePath}`;
      await supabase.storage.from(this.STORAGE_BUCKET).remove([storagePath]);
    }

    // Delete from DB
    const { error } = await supabase
      .from('success')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  /**
   * Get public URL for an image from Supabase storage
   */
  private getPublicUrl(imagePath: string): string {
    if (!imagePath) return '';

    const { data } = supabase.storage
      .from(this.STORAGE_BUCKET)
      .getPublicUrl(`${this.STORAGE_FOLDER}/${imagePath}`);

    return data?.publicUrl || '';
  }
}

// Export a singleton instance
export const successRepository = new SuccessRepository();

export interface FormattedSuccessStudent {
  id: string;
  name: string;
  subtitle: string;
  faculty: string;
  university: string;
  grade: string;
  image: string;
}
