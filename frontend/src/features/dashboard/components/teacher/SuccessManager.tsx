import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, Award } from 'lucide-react';
import { SuccessApi } from '@/features/teacher/api';
import type { SuccessStory } from '@/features/teacher/api';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

const EMPTY_FORM = {
  full_name: '',
  index_no: '',
  results: '',
  faculty: '',
  university: '',
  image_path: '',
};

export default function SuccessManager() {
  const [stories, setStories] = useState<SuccessStory[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState<SuccessStory | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);

  useEffect(() => { fetchStories(); }, []);

  async function fetchStories() {
    try {
      setLoading(true);
      setStories(await SuccessApi.getStories());
    } catch { toast.error('Failed to load success stories'); }
    finally { setLoading(false); }
  }

  function openAdd() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setDialogOpen(true);
  }

  function openEdit(story: SuccessStory) {
    setEditing(story);
    setForm({
      full_name: story.full_name ?? '',
      index_no: story.index_no ?? '',
      results: story.results ?? '',
      faculty: story.faculty ?? '',
      university: story.university ?? '',
      image_path: story.image_path ?? '',
    });
    setDialogOpen(true);
  }

  async function handleSave() {
    if (!form.full_name) { toast.error('Student name is required'); return; }
    setSaving(true);
    try {
      const payload = {
        full_name: form.full_name || undefined,
        index_no: form.index_no || undefined,
        results: form.results || undefined,
        faculty: form.faculty || undefined,
        university: form.university || undefined,
        image_path: form.image_path || undefined,
      };
      if (editing) {
        const updated = await SuccessApi.updateStory(editing.id, payload);
        setStories(prev => prev.map(s => s.id === editing.id ? updated : s));
        toast.success('Story updated');
      } else {
        const created = await SuccessApi.createStory(payload);
        setStories(prev => [...prev, created]);
        toast.success('Story added');
      }
      setDialogOpen(false);
    } catch { toast.error('Failed to save story'); }
    finally { setSaving(false); }
  }

  async function handleDelete(id: string) {
    try {
      await SuccessApi.deleteStory(id);
      setStories(prev => prev.filter(s => s.id !== id));
      toast.success('Story deleted');
    } catch { toast.error('Failed to delete story'); }
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Success Stories</h1>
          <p className="text-sm text-gray-500 mt-1">Student achievements shown on the public website</p>
        </div>
        <Button onClick={openAdd} className="gap-2">
          <Plus className="w-4 h-4" />
          Add Story
        </Button>
      </div>

      {loading ? (
        <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)}</div>
      ) : stories.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
            <Award className="w-8 h-8 text-gray-400" />
          </div>
          <p className="font-medium text-gray-700">No stories yet</p>
          <p className="text-sm text-gray-400 mt-1">Add student success stories to display on the public site</p>
        </div>
      ) : (
        <div className="space-y-3">
          {stories.map(story => (
            <div key={story.id} className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 flex items-center gap-4">
              {story.image_path ? (
                <img src={story.image_path} alt={story.full_name ?? ''} className="w-12 h-12 rounded-full object-cover flex-shrink-0 border border-gray-100" />
              ) : (
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 text-primary font-bold">
                  {(story.full_name ?? 'S').charAt(0)}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900">{story.full_name}</p>
                <p className="text-sm text-gray-500">{[story.results, story.university].filter(Boolean).join(' · ')}</p>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <button onClick={() => openEdit(story)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors">
                  <Pencil className="w-4 h-4" />
                </button>
                <button onClick={() => handleDelete(story.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-500 transition-colors">
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
            <DialogTitle>{editing ? 'Edit Story' : 'Add Success Story'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 pt-2">
            <Input label="Student Name" value={form.full_name} onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))} placeholder="e.g. Nimasha Perera" />
            <div className="grid grid-cols-2 gap-3">
              <Input label="Index No." value={form.index_no} onChange={e => setForm(f => ({ ...f, index_no: e.target.value }))} placeholder="e.g. 12345678" />
              <Input label="Results" value={form.results} onChange={e => setForm(f => ({ ...f, results: e.target.value }))} placeholder="e.g. 3A passes" />
            </div>
            <Input label="Faculty" value={form.faculty} onChange={e => setForm(f => ({ ...f, faculty: e.target.value }))} placeholder="e.g. Faculty of Science" />
            <Input label="University" value={form.university} onChange={e => setForm(f => ({ ...f, university: e.target.value }))} placeholder="e.g. University of Peradeniya" />
            <Input label="Photo URL (optional)" value={form.image_path} onChange={e => setForm(f => ({ ...f, image_path: e.target.value }))} placeholder="https://..." />
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleSave} isLoading={saving}>{editing ? 'Save Changes' : 'Add Story'}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
