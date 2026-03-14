import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Eye, EyeOff, MessageSquare, Edit2, Check, X, AlertCircle, CheckCircle } from 'lucide-react';
import { classReviewRepository } from '../../repositories/ClassReviewRepository';
import type { ClassReview } from '../../repositories/ClassReviewRepository';

interface ReviewsManagerProps {
    teacherId: string;
}

interface ReviewFormState {
    student_name: string;
    review_text: string;
    rating: number;
    student_image_url: string;
}

const EMPTY_FORM: ReviewFormState = {
    student_name: '',
    review_text: '',
    rating: 5,
    student_image_url: '',
};

export default function ReviewsManager({ teacherId }: ReviewsManagerProps) {
    const [reviews, setReviews] = useState<ClassReview[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [form, setForm] = useState<ReviewFormState>(EMPTY_FORM);

    useEffect(() => {
        loadReviews();
    }, [teacherId]);

    async function loadReviews() {
        try {
            setLoading(true);
            const data = await classReviewRepository.getByTeacherId(teacherId);
            setReviews(data);
        } catch (err: any) {
            setError(err.message || 'Failed to load reviews');
        } finally {
            setLoading(false);
        }
    }

    function showSuccessMsg(msg: string) {
        setSuccess(msg);
        setTimeout(() => setSuccess(null), 3000);
    }

    function showErrorMsg(msg: string) {
        setError(msg);
        setTimeout(() => setError(null), 4000);
    }

    function handleEdit(review: ClassReview) {
        setEditingId(review.id);
        setForm({
            student_name: review.student_name,
            review_text: review.review_text,
            rating: review.rating,
            student_image_url: review.student_image_url || '',
        });
        setShowForm(true);
    }

    function handleNew() {
        setEditingId(null);
        setForm(EMPTY_FORM);
        setShowForm(true);
    }

    function handleCancel() {
        setShowForm(false);
        setEditingId(null);
        setForm(EMPTY_FORM);
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!form.student_name.trim() || !form.review_text.trim()) {
            showErrorMsg('Student name and review text are required.');
            return;
        }

        setSaving(true);
        try {
            if (editingId) {
                await classReviewRepository.updateReview(editingId, {
                    student_name: form.student_name,
                    review_text: form.review_text,
                    rating: form.rating,
                    student_image_url: form.student_image_url || null,
                });
                showSuccessMsg('Review updated!');
            } else {
                await classReviewRepository.addReview(
                    teacherId,
                    form.student_name,
                    form.review_text,
                    form.rating,
                    form.student_image_url || undefined,
                    reviews.length
                );
                showSuccessMsg('Review added!');
            }
            await loadReviews();
            handleCancel();
        } catch (err: any) {
            showErrorMsg(err.message || 'Failed to save review');
        } finally {
            setSaving(false);
        }
    }

    async function handleToggle(review: ClassReview) {
        try {
            await classReviewRepository.toggleVisibility(review.id, !review.is_visible);
            setReviews((prev) =>
                prev.map((r) => r.id === review.id ? { ...r, is_visible: !r.is_visible } : r)
            );
        } catch (err: any) {
            showErrorMsg(err.message || 'Failed to toggle visibility');
        }
    }

    async function handleDelete(review: ClassReview) {
        if (!confirm('Delete this review? This cannot be undone.')) return;
        try {
            await classReviewRepository.deleteReview(review.id);
            setReviews((prev) => prev.filter((r) => r.id !== review.id));
            showSuccessMsg('Review deleted.');
        } catch (err: any) {
            showErrorMsg(err.message || 'Failed to delete review');
        }
    }

    return (
        <div className="p-4 sm:p-6 lg:p-8">
            <div className="mb-8">
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Reviews Manager</h2>
                <p className="text-gray-500">Add and manage student review messages collected in class.</p>
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

            {/* Add/Edit Form */}
            {showForm && (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-8">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">
                        {editingId ? 'Edit Review' : 'Add New Review'}
                    </h3>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">Student Name *</label>
                                <input
                                    type="text"
                                    value={form.student_name}
                                    onChange={(e) => setForm({ ...form, student_name: e.target.value })}
                                    placeholder="e.g. Amara Fernando"
                                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#eb1b23]/20 focus:border-[#eb1b23]"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">Student Photo URL (optional)</label>
                                <input
                                    type="url"
                                    value={form.student_image_url}
                                    onChange={(e) => setForm({ ...form, student_image_url: e.target.value })}
                                    placeholder="https://..."
                                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#eb1b23]/20 focus:border-[#eb1b23]"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">Rating *</label>
                            <div className="flex gap-1">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <button
                                        key={star}
                                        type="button"
                                        onClick={() => setForm({ ...form, rating: star })}
                                        className={`text-2xl transition-colors ${star <= form.rating ? 'text-yellow-400' : 'text-gray-200'}`}
                                    >
                                        ★
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">Review Text *</label>
                            <textarea
                                value={form.review_text}
                                onChange={(e) => setForm({ ...form, review_text: e.target.value })}
                                placeholder="Write the student's review message..."
                                rows={4}
                                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#eb1b23]/20 focus:border-[#eb1b23] resize-none"
                                required
                            />
                        </div>

                        <div className="flex gap-3 pt-2">
                            <button
                                type="submit"
                                disabled={saving}
                                className="flex items-center gap-2 px-6 py-2.5 bg-[#eb1b23] text-white rounded-xl font-medium text-sm hover:bg-red-700 transition-colors disabled:opacity-60"
                            >
                                <Check className="w-4 h-4" />
                                {saving ? 'Saving...' : editingId ? 'Update Review' : 'Add Review'}
                            </button>
                            <button
                                type="button"
                                onClick={handleCancel}
                                className="flex items-center gap-2 px-6 py-2.5 bg-gray-100 text-gray-700 rounded-xl font-medium text-sm hover:bg-gray-200 transition-colors"
                            >
                                <X className="w-4 h-4" />
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Reviews List */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                        <MessageSquare className="w-5 h-5 text-[#eb1b23]" />
                        Reviews ({reviews.length})
                    </h3>
                    {!showForm && (
                        <button
                            onClick={handleNew}
                            className="flex items-center gap-2 px-4 py-2 bg-[#eb1b23] text-white rounded-xl font-medium text-sm hover:bg-red-700 transition-colors"
                        >
                            <Plus className="w-4 h-4" />
                            Add Review
                        </button>
                    )}
                </div>

                {loading ? (
                    <div className="flex justify-center py-16">
                        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#eb1b23]" />
                    </div>
                ) : reviews.length === 0 ? (
                    <div className="text-center py-16 text-gray-400">
                        <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-30" />
                        <p>No reviews yet. Add your first student review!</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {reviews.map((review) => (
                            <div
                                key={review.id}
                                className={`flex gap-4 p-4 rounded-xl border transition-all ${review.is_visible
                                    ? 'border-gray-100 bg-gray-50/50'
                                    : 'border-gray-200 bg-gray-100 opacity-60'
                                    }`}
                            >
                                {/* Avatar */}
                                <div className="w-12 h-12 rounded-full bg-gray-200 flex-shrink-0 overflow-hidden">
                                    {review.student_image_url ? (
                                        <img src={review.student_image_url} alt={review.student_name} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-[#eb1b23]/10 text-[#eb1b23] font-bold text-lg">
                                            {review.student_name[0]?.toUpperCase()}
                                        </div>
                                    )}
                                </div>

                                {/* Content */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-start justify-between gap-2 mb-1">
                                        <div>
                                            <span className="font-semibold text-gray-900 text-sm">{review.student_name}</span>
                                            <div className="flex gap-0.5 mt-0.5">
                                                {[1, 2, 3, 4, 5].map((s) => (
                                                    <span key={s} className={`text-sm ${s <= review.rating ? 'text-yellow-400' : 'text-gray-300'}`}>★</span>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1.5 flex-shrink-0">
                                            <button
                                                onClick={() => handleEdit(review)}
                                                className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                                                title="Edit"
                                            >
                                                <Edit2 className="w-3.5 h-3.5" />
                                            </button>
                                            <button
                                                onClick={() => handleToggle(review)}
                                                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                                                title={review.is_visible ? 'Hide from landing page' : 'Show on landing page'}
                                            >
                                                {review.is_visible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                                            </button>
                                            <button
                                                onClick={() => handleDelete(review)}
                                                className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                                                title="Delete"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    </div>
                                    <p className="text-sm text-gray-600 line-clamp-3">{review.review_text}</p>
                                    {!review.is_visible && (
                                        <span className="inline-block mt-1 text-xs text-gray-400 bg-gray-200 px-2 py-0.5 rounded-full">Hidden from landing page</span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
