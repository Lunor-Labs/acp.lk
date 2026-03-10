import { BaseRepository } from './BaseRepository';
import { supabase } from '../lib/supabase';

interface SuccessStudent {
  id: string;
  full_name: string;
  index_no: string;
  faculty: string;
  university: string;
  results: string;
  image_path: string;
  created_at?: string;
  updated_at?: string;
}

/**
 * Success Repository
 * 
 * Handles fetching successful student data and their images from storage
 */
export class SuccessRepository extends BaseRepository<SuccessStudent> {
  private readonly STORAGE_BUCKET = 'acp'; // The actual bucket name
  private readonly STORAGE_PATH = 'images/success'; // Folder path inside the bucket

  constructor() {
    super('success'); // Assuming your table name is 'success'
  }

  /**
   * Get all successful students with formatted image URLs
   */
  async getSuccessStudents(): Promise<FormattedSuccessStudent[]> {
    try {
      const students = await this.findAll();

      // Resolve image URLs (may require async probing)
      const formatted = await Promise.all(
        students.map(async (student) => ({
          id: student.id,
          name: student.full_name,
          subtitle: String(student.index_no ?? ''),
          faculty: student.faculty,
          university: student.university,
          grade: student.results,
          image: await this.getImageUrl(student.image_path)
        }))
      );

      return formatted;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get public URL for an image from Supabase storage
   * @param imagePath - Filename of the image (e.g., "student1.png")
   * @returns Public URL for the image
   */
  private async getImageUrl(imagePath: string): Promise<string> {
    if (!imagePath) return '';

    const candidates = [
      `${this.STORAGE_PATH}/${imagePath}`,
      imagePath,
      `images/${imagePath}`
    ];

    for (const candidate of candidates) {
      try {
        const { data } = supabase.storage.from(this.STORAGE_BUCKET).getPublicUrl(candidate);
        const url = data?.publicUrl;
        if (!url) continue;

        // Probe the URL to ensure it returns a successful response.
        try {
          const res = await fetch(url, { method: 'HEAD' });
          if (res.ok) {
            return url;
          }
        } catch (probeErr) {
          // Network/CORS may block HEAD; still return the URL as a best-effort fallback
          return url;
        }
      } catch (err) {
        // console.warn('⚠️ Error building public url for', candidate, err);
        continue;
      }
    }

    // console.warn('⚠️ No valid public URL found for imagePath:', imagePath);
    return '';
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
