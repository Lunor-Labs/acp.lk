import { apiClient } from '@/api/client';
import type { UserProfile } from '@/features/auth/api';

// ── Gallery ────────────────────────────────────────────────────────────────

export interface GalleryImage {
  id: string;
  teacher_id: string;
  storage_path: string;
  public_url?: string;
  caption?: string;
  display_order: number;
  is_active: boolean;
  created_at: string;
}

export const GalleryApi = {
  getImages: () => apiClient.get<GalleryImage[]>('/gallery'),
  addImage: (data: { storage_path: string; public_url?: string; caption?: string }) =>
    apiClient.post<GalleryImage>('/gallery', data),
  deleteImage: (id: string) => apiClient.delete(`/gallery/${id}`),
  toggleActive: (id: string, is_active: boolean) =>
    apiClient.patch(`/gallery/${id}/toggle`, { is_active }),
};

// ── Reviews ────────────────────────────────────────────────────────────────

export interface Review {
  id: string;
  teacher_id: string;
  student_name: string;
  review_text: string;
  rating: string;
  student_image_url?: string;
  gender?: 'male' | 'female';
  is_visible: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export const ReviewsApi = {
  getReviews: () => apiClient.get<Review[]>('/reviews'),
  createReview: (data: {
    student_name: string;
    review_text: string;
    rating: string;
    student_image_url?: string;
    gender?: 'male' | 'female';
  }) => apiClient.post<Review>('/reviews', data),
  updateReview: (id: string, data: Partial<Pick<Review, 'student_name' | 'review_text' | 'rating' | 'student_image_url' | 'is_visible'>>) =>
    apiClient.patch<Review>(`/reviews/${id}`, data),
  deleteReview: (id: string) => apiClient.delete(`/reviews/${id}`),
};

// ── Rank Lists ─────────────────────────────────────────────────────────────

export interface RankList {
  id: string;
  teacher_id: string;
  year: number;
  exam_name: string;
  image_path: string;
  public_url?: string;
  created_at: string;
}

export const RankListsApi = {
  getRankLists: () => apiClient.get<RankList[]>('/rank-lists'),
  createRankList: (data: { year: number; exam_name: string; image_path: string; public_url?: string }) =>
    apiClient.post<RankList>('/rank-lists', data),
  deleteRankList: (id: string) => apiClient.delete(`/rank-lists/${id}`),
};

// ── Success Stories ────────────────────────────────────────────────────────

export interface SuccessStory {
  id: string;
  full_name?: string;
  index_no?: string;
  results?: string;
  faculty?: string;
  university?: string;
  image_path?: string;
  created_at: string;
}

export const SuccessApi = {
  getStories: () => apiClient.get<SuccessStory[]>('/success'),
  createStory: (data: Omit<SuccessStory, 'id' | 'created_at'>) =>
    apiClient.post<SuccessStory>('/success', data),
  updateStory: (id: string, data: Partial<Omit<SuccessStory, 'id' | 'created_at'>>) =>
    apiClient.patch<SuccessStory>(`/success/${id}`, data),
  deleteStory: (id: string) => apiClient.delete(`/success/${id}`),
};

// ── Profile ────────────────────────────────────────────────────────────────

export const ProfileApi = {
  getMe: () => apiClient.get<{ profile: UserProfile }>('/auth/me'),
  updateMe: (data: { full_name?: string; avatar_url?: string; phone?: string }) =>
    apiClient.patch<{ profile: UserProfile }>('/users/me', data),
  changePassword: (data: { currentPassword: string; newPassword: string }) =>
    apiClient.post<{ success: boolean }>('/users/me/change-password', data),
};
