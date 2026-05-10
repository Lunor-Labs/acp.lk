import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Plus, Edit2, Trash2, Save, X, MessageSquare, User } from 'lucide-react';
import { ReviewsApi } from '@/features/teacher/api';
import type { Review } from '@/features/teacher/api';

function MaleAvatarSVG() {
  return (
    <svg viewBox="0 0 100 100" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="50" cy="50" r="50" fill="#dbeafe" />
      <circle cx="50" cy="38" r="16" fill="#93c5fd" />
      <ellipse cx="50" cy="82" rx="24" ry="18" fill="#93c5fd" />
    </svg>
  );
}

function FemaleAvatarSVG() {
  return (
    <svg viewBox="0 0 100 100" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="50" cy="50" r="50" fill="#fce7f3" />
      <circle cx="50" cy="38" r="16" fill="#f9a8d4" />
      <ellipse cx="50" cy="82" rx="24" ry="18" fill="#f9a8d4" />
      <path d="M38 30 Q50 20 62 30" stroke="#f472b6" strokeWidth="3" fill="none" strokeLinecap="round" />
    </svg>
  );
}

function StudentAvatar({ name, imageUrl, gender }: { name: string; imageUrl?: string; gender?: string }) {
  if (imageUrl) return <img src={imageUrl} alt={name} className="w-full h-full object-cover" />;
  if (gender === 'male') return <MaleAvatarSVG />;
  if (gender === 'female') return <FemaleAvatarSVG />;
  return (
    <div className="w-full h-full flex items-center justify-center bg-[#eb1b23]/10 text-[#eb1b23] text-lg font-bold">
      {name.charAt(0).toUpperCase()}
    </div>
  );
}

function StarRating({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map(star => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          className={`text-2xl transition-colors ${star <= value ? 'text-amber-400' : 'text-gray-300'} hover:text-amber-400`}
        >
          ★
        </button>
      ))}
    </div>
  );
}

function GenderPicker({ value, onChange }: { value: '' | 'male' | 'female'; onChange: (v: '' | 'male' | 'female') => void }) {
  return (
    <div className="flex gap-3">
      {(['male', 'female'] as const).map(g => (
        <button
          key={g}
          type="button"
          onClick={() => onChange(value === g ? '' : g)}
          className={`flex flex-col items-center gap-1 p-2 rounded-xl border-2 transition-all flex-1 ${
            value === g
              ? g === 'male' ? 'border-blue-400 bg-blue-50' : 'border-pink-400 bg-pink-50'
              : 'border-gray-200 hover:border-gray-300'
          }`}
        >
          <div className="w-12 h-12 rounded-full overflow-hidden">
            {g === 'male' ? <MaleAvatarSVG /> : <FemaleAvatarSVG />}
          </div>
          <span className={`text-xs font-semibold capitalize ${
            value === g ? (g === 'male' ? 'text-blue-600' : 'text-pink-600') : 'text-gray-500'
          }`}>{g}</span>
        </button>
      ))}
    </div>
  );
}

const EMPTY_FORM = {
  student_name: '',
  review_text: '',
  rating: 5,
  student_image_url: '',
  gender: '' as '' | 'male' | 'female',
};

export default function ReviewsManager() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState<Review | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [deleteTarget, setDeleteTarget] = useState<Review | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => { fetchReviews(); }, []);

  async function fetchReviews() {
    try {
      setLoading(true);
      setReviews(await ReviewsApi.getReviews());
    } catch { toast.error('Failed to load reviews'); }
    finally { setLoading(false); }
  }

  function openAdd() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setShowForm(true);
  }

  function openEdit(review: Review) {
    setEditing(review);
    setForm({
      student_name: review.student_name,
      review_text: review.review_text,
      rating: Number(review.rating),
      student_image_url: review.student_image_url ?? '',
      gender: review.gender ?? '',
    });
    setShowForm(true);
  }

  function handleCancel() {
    setShowForm(false);
    setEditing(null);
    setForm(EMPTY_FORM);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!form.student_name || !form.review_text) { toast.error('Name and review text are required'); return; }
    setSaving(true);
    try {
      const payload = {
        student_name: form.student_name,
        review_text: form.review_text,
        rating: String(form.rating),
        student_image_url: form.student_image_url || undefined,
        gender: (form.gender || undefined) as 'male' | 'female' | undefined,
      };
      if (editing) {
        const updated = await ReviewsApi.updateReview(editing.id, payload);
        setReviews(prev => prev.map(r => r.id === editing.id ? updated : r));
        toast.success('Review updated');
      } else {
        const created = await ReviewsApi.createReview(payload);
        setReviews(prev => [...prev, created]);
        toast.success('Review added');
      }
      handleCancel();
    } catch { toast.error('Failed to save review'); }
    finally { setSaving(false); }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await ReviewsApi.deleteReview(deleteTarget.id);
      setReviews(prev => prev.filter(r => r.id !== deleteTarget.id));
      toast.success('Review deleted');
    } catch { toast.error('Failed to delete review'); }
    finally { setDeleting(false); setDeleteTarget(null); }
  }

  return (
    <div className="h-full min-h-0 overflow-y-auto p-4 sm:p-6 lg:p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">Reviews</h2>
          <p className="text-sm text-gray-500 mt-1">Student testimonials shown on the public website</p>
        </div>
        {!showForm && (
          <button
            onClick={openAdd}
            className="flex items-center gap-2 px-5 py-2.5 bg-[#eb1b23] text-white rounded-xl font-medium text-sm hover:bg-red-700 transition-all shadow-sm hover:shadow-md"
          >
            <Plus className="w-4 h-4" />
            Add Review
          </button>
        )}
      </div>

      <div className={showForm ? 'grid grid-cols-1 xl:grid-cols-5 gap-6' : ''}>
        {showForm && (
          <div className="xl:col-span-2">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden sticky top-6">
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-slate-50 to-white">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center">
                    {editing ? <Edit2 className="w-4 h-4 text-[#eb1b23]" /> : <Plus className="w-4 h-4 text-[#eb1b23]" />}
                  </div>
                  <h3 className="font-semibold text-gray-800 text-sm">{editing ? 'Edit Review' : 'New Review'}</h3>
                </div>
                <button onClick={handleCancel} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSave} className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Student Name *</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      value={form.student_name}
                      onChange={e => setForm(f => ({ ...f, student_name: e.target.value }))}
                      className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#eb1b23]/20 focus:border-[#eb1b23] transition"
                      placeholder="e.g. Kavindu Perera"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Rating</label>
                  <StarRating value={form.rating} onChange={v => setForm(f => ({ ...f, rating: v }))} />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Gender</label>
                  <GenderPicker value={form.gender} onChange={v => setForm(f => ({ ...f, gender: v }))} />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Review *</label>
                  <textarea
                    rows={3}
                    value={form.review_text}
                    onChange={e => setForm(f => ({ ...f, review_text: e.target.value }))}
                    className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#eb1b23]/20 focus:border-[#eb1b23] transition resize-none"
                    placeholder="What did the student say?"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Photo URL (optional)</label>
                  <input
                    type="text"
                    value={form.student_image_url}
                    onChange={e => setForm(f => ({ ...f, student_image_url: e.target.value }))}
                    className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#eb1b23]/20 focus:border-[#eb1b23] transition"
                    placeholder="https://..."
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-[#eb1b23] text-white rounded-xl font-medium text-sm hover:bg-red-700 transition-all disabled:opacity-60 shadow-sm"
                  >
                    <Save className="w-4 h-4" />
                    {saving ? 'Saving…' : editing ? 'Update Review' : 'Add Review'}
                  </button>
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="px-4 py-2.5 border border-gray-200 rounded-xl font-medium text-sm text-gray-600 hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        <div className={showForm ? 'xl:col-span-3' : ''}>
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#eb1b23]" />
            </div>
          ) : reviews.length === 0 ? (
            <div className="flex flex-col items-center justify-center bg-white rounded-2xl border border-gray-100 shadow-sm py-20 px-8 text-center">
              <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
                <MessageSquare className="w-8 h-8 text-gray-400" />
              </div>
              <p className="font-medium text-gray-700">No reviews yet</p>
              <p className="text-sm text-gray-400 mt-1 mb-6">Add student testimonials to display on the public site</p>
              <button
                onClick={openAdd}
                className="flex items-center gap-2 px-5 py-2.5 bg-[#eb1b23] text-white rounded-xl font-medium text-sm hover:bg-red-700 transition-all"
              >
                <Plus className="w-4 h-4" />
                Add First Review
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {reviews.map(review => (
                <div
                  key={review.id}
                  className={`bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-start gap-4 transition-opacity ${review.is_visible === false ? 'opacity-60' : ''}`}
                >
                  <div className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0">
                    <StudentAvatar
                      name={review.student_name}
                      imageUrl={review.student_image_url ?? undefined}
                      gender={review.gender ?? undefined}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                      <span className="font-semibold text-gray-900 text-sm">{review.student_name}</span>
                      <span className="text-amber-400 text-xs font-medium">
                        {'★'.repeat(Math.min(5, Math.round(Number(review.rating))))}
                      </span>
                      {review.gender && (
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${review.gender === 'male' ? 'bg-blue-100 text-blue-600' : 'bg-pink-100 text-pink-600'}`}>
                          {review.gender}
                        </span>
                      )}
                      {review.is_visible === false && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] bg-gray-100 text-gray-500 font-medium">Hidden</span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 line-clamp-2">{review.review_text}</p>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button onClick={() => openEdit(review)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => setDeleteTarget(review)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-500 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center flex-shrink-0">
                <Trash2 className="w-6 h-6 text-red-500" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900">Delete Review</h3>
                <p className="text-sm text-gray-500">This cannot be undone.</p>
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-5">
              Are you sure you want to remove <span className="font-semibold text-gray-800">{deleteTarget.student_name}</span>'s review?
            </p>
            <div className="flex gap-3">
              <button
                onClick={confirmDelete}
                disabled={deleting}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-xl font-medium text-sm transition-colors disabled:opacity-60"
              >
                <Trash2 className="w-4 h-4" />
                {deleting ? 'Deleting…' : 'Yes, Delete'}
              </button>
              <button
                onClick={() => setDeleteTarget(null)}
                className="flex-1 py-2.5 border border-gray-200 rounded-xl font-medium text-sm text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
