import { ReviewsRepository, TeacherRepository } from '../repositories/index.js';
import { AppError } from '../utils/errors.js';
import { getDb } from '../providers/db/drizzle.js';
import type { NewClassReview } from '../repositories/schema/index.js';

class ReviewsService {
  private repo: ReviewsRepository;
  private teacherRepo: TeacherRepository;

  constructor() {
    const db = getDb();
    this.repo = new ReviewsRepository(db);
    this.teacherRepo = new TeacherRepository(db);
  }

  private async resolveTeacherId(userId: string) {
    const t = await this.teacherRepo.findByProfileId(userId);
    if (!t) throw AppError.notFound('Teacher profile not found');
    return t.id;
  }

  async getReviews(userId: string) {
    return this.repo.getByTeacherId(await this.resolveTeacherId(userId));
  }

  async createReview(userId: string, data: Pick<NewClassReview, 'student_name' | 'review_text' | 'rating' | 'student_image_url' | 'gender'>) {
    const teacherId = await this.resolveTeacherId(userId);
    const existing = await this.repo.getByTeacherId(teacherId);
    return this.repo.create({
      id: crypto.randomUUID(),
      teacher_id: teacherId,
      student_name: data.student_name,
      review_text: data.review_text,
      rating: data.rating,
      student_image_url: data.student_image_url,
      gender: data.gender,
      display_order: existing.length,
    });
  }

  async updateReview(userId: string, reviewId: string, data: Partial<Pick<NewClassReview, 'student_name' | 'review_text' | 'rating' | 'student_image_url' | 'is_visible'>>) {
    const teacherId = await this.resolveTeacherId(userId);
    const review = await this.repo.findById(reviewId);
    if (!review) throw AppError.notFound('Review not found');
    if (review.teacher_id !== teacherId) throw AppError.forbidden('Cannot modify review you do not own');
    return this.repo.update(reviewId, data);
  }

  async deleteReview(userId: string, reviewId: string) {
    const teacherId = await this.resolveTeacherId(userId);
    const review = await this.repo.findById(reviewId);
    if (!review) throw AppError.notFound('Review not found');
    if (review.teacher_id !== teacherId) throw AppError.forbidden('Cannot delete review you do not own');
    await this.repo.delete(reviewId);
  }
}

let _instance: ReviewsService;
export function getReviewsService() {
  if (!_instance) _instance = new ReviewsService();
  return _instance;
}
