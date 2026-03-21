import { BaseRepository } from './BaseRepository';
import { supabase } from '../lib/supabase';

export interface ClassReview {
    id: string;
    teacher_id: string;
    student_name: string;
    review_text: string;
    rating: number;
    student_image_url: string | null;
    gender: 'male' | 'female' | null;
    is_visible: boolean;
    display_order: number;
    created_at: string;
    updated_at: string;
}

/**
 * Class Review Repository
 * 
 * Manages student review messages collected in-class by teacher.
 * These are teacher-added reviews (not student self-submitted).
 */
export class ClassReviewRepository extends BaseRepository<ClassReview> {
    constructor() {
        super('class_reviews');
    }

    /**
     * Get all visible reviews ordered by display_order
     */
    async getVisibleReviews(): Promise<ClassReview[]> {
        const { data, error } = await supabase
            .from('class_reviews')
            .select('*')
            .eq('is_visible', true)
            .order('display_order', { ascending: true });

        if (error) throw error;
        return data || [];
    }

    /**
     * Get all reviews for a specific teacher (including hidden)
     */
    async getByTeacherId(teacherId: string): Promise<ClassReview[]> {
        const { data, error } = await supabase
            .from('class_reviews')
            .select('*')
            .eq('teacher_id', teacherId)
            .order('display_order', { ascending: true });

        if (error) throw error;
        return data || [];
    }

    /**
     * Add a new review
     */
    async addReview(
        teacherId: string,
        studentName: string,
        reviewText: string,
        rating: number,
        studentImageUrl?: string,
        displayOrder?: number,
        gender?: 'male' | 'female' | null
    ): Promise<ClassReview> {
        const { data, error } = await supabase
            .from('class_reviews')
            .insert({
                teacher_id: teacherId,
                student_name: studentName,
                review_text: reviewText,
                rating,
                student_image_url: studentImageUrl || null,
                gender: gender ?? null,
                is_visible: true,
                display_order: displayOrder ?? 0,
            })
            .select()
            .single();

        if (error) throw error;
        if (!data) throw new Error('Failed to create review');
        return data;
    }

    /**
     * Update an existing review
     */
    async updateReview(
        reviewId: string,
        updates: Partial<Pick<ClassReview, 'student_name' | 'review_text' | 'rating' | 'student_image_url' | 'gender' | 'is_visible' | 'display_order'>>
    ): Promise<ClassReview> {
        const { data, error } = await supabase
            .from('class_reviews')
            .update({ ...updates, updated_at: new Date().toISOString() })
            .eq('id', reviewId)
            .select()
            .single();

        if (error) throw error;
        if (!data) throw new Error('Failed to update review');
        return data;
    }

    /**
     * Toggle visibility of a review
     */
    async toggleVisibility(reviewId: string, isVisible: boolean): Promise<void> {
        const { error } = await supabase
            .from('class_reviews')
            .update({ is_visible: isVisible, updated_at: new Date().toISOString() })
            .eq('id', reviewId);

        if (error) throw error;
    }

    /**
     * Delete a review
     */
    async deleteReview(reviewId: string): Promise<void> {
        const { error } = await supabase
            .from('class_reviews')
            .delete()
            .eq('id', reviewId);

        if (error) throw error;
    }
}

export const classReviewRepository = new ClassReviewRepository();
