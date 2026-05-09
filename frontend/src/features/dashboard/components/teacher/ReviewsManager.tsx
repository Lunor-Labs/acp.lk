import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, Star, MessageSquare } from 'lucide-react';
import { ReviewsApi } from '@/features/teacher/api';
import type { Review } from '@/features/teacher/api';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

const EMPTY_FORM = {
  student_name: '',
  review_text: '',
  rating: '5',
  student_image_url: '',
  gender: '' as '' | 'male' | 'female',
};

export default function ReviewsManager() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState<Review | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);

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
    setDialogOpen(true);
  }

  function openEdit(review: Review) {
    setEditing(review);
    setForm({
      student_name: review.student_name,
      review_text: review.review_text,
      rating: review.rating,
      student_image_url: review.student_image_url ?? '',
      gender: review.gender ?? '',
    });
    setDialogOpen(true);
  }

  async function handleSave() {
    if (!form.student_name || !form.review_text || !form.rating) {
      toast.error('Name, review text, and rating are required');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        student_name: form.student_name,
        review_text: form.review_text,
        rating: form.rating,
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
      setDialogOpen(false);
    } catch { toast.error('Failed to save review'); }
    finally { setSaving(false); }
  }

  async function handleDelete(id: string) {
    try {
      await ReviewsApi.deleteReview(id);
      setReviews(prev => prev.filter(r => r.id !== id));
      toast.success('Review deleted');
    } catch { toast.error('Failed to delete review'); }
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reviews</h1>
          <p className="text-sm text-gray-500 mt-1">Student testimonials shown on the public website</p>
        </div>
        <Button onClick={openAdd} className="gap-2">
          <Plus className="w-4 h-4" />
          Add Review
        </Button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
        </div>
      ) : reviews.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
            <MessageSquare className="w-8 h-8 text-gray-400" />
          </div>
          <p className="font-medium text-gray-700">No reviews yet</p>
          <p className="text-sm text-gray-400 mt-1">Add student testimonials to display on the public site</p>
        </div>
      ) : (
        <div className="space-y-3">
          {reviews.map(review => (
            <div key={review.id} className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 text-sm font-bold text-primary">
                {review.student_name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="font-semibold text-gray-900 text-sm">{review.student_name}</span>
                  <span className="flex items-center gap-0.5 text-amber-500 text-xs">
                    <Star className="w-3 h-3 fill-current" />
                    {review.rating}
                  </span>
                  {!review.is_visible && (
                    <span className="px-1.5 py-0.5 rounded text-[10px] bg-gray-100 text-gray-500 font-medium">Hidden</span>
                  )}
                </div>
                <p className="text-sm text-gray-600 line-clamp-2">{review.review_text}</p>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <button onClick={() => openEdit(review)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors">
                  <Pencil className="w-4 h-4" />
                </button>
                <button onClick={() => handleDelete(review.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-500 transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Review' : 'Add Review'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <Input
              label="Student Name"
              value={form.student_name}
              onChange={e => setForm(f => ({ ...f, student_name: e.target.value }))}
              placeholder="e.g. Kavindu Perera"
            />
            <div className="flex flex-col gap-1.5">
              <label className="text-[13px] font-medium text-gray-700 ml-1">Review Text</label>
              <textarea
                className="flex w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:border-ring shadow-sm resize-none"
                rows={3}
                value={form.review_text}
                onChange={e => setForm(f => ({ ...f, review_text: e.target.value }))}
                placeholder="What did the student say?"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Rating (1–5)"
                type="number"
                min="1"
                max="5"
                step="0.1"
                value={form.rating}
                onChange={e => setForm(f => ({ ...f, rating: e.target.value }))}
              />
              <div className="flex flex-col gap-1.5">
                <label className="text-[13px] font-medium text-gray-700 ml-1">Gender</label>
                <select
                  className="flex w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:border-ring shadow-sm"
                  value={form.gender}
                  onChange={e => setForm(f => ({ ...f, gender: e.target.value as '' | 'male' | 'female' }))}
                >
                  <option value="">Unspecified</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                </select>
              </div>
            </div>
            <Input
              label="Student Photo URL (optional)"
              value={form.student_image_url}
              onChange={e => setForm(f => ({ ...f, student_image_url: e.target.value }))}
              placeholder="https://..."
            />
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleSave} isLoading={saving}>
                {editing ? 'Save Changes' : 'Add Review'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
