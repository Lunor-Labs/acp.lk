import { useState, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { Plus, Trash2, Upload, Trophy, Edit2, X, Save, User, BookOpen, Award, GraduationCap, ImageIcon, CheckCircle, Camera } from 'lucide-react';
import { SuccessApi } from '@/features/teacher/api';
import type { SuccessStory } from '@/features/teacher/api';
import { FilesApi } from '../../api';

const EMPTY_FORM = {
  full_name: '',
  index_no: '',
  results: 'AAA',
  faculty: '',
  university: '',
};

function FieldInput({
  icon, label, value, onChange, placeholder, required,
}: {
  icon: React.ReactNode; label: string; value: string; onChange: (v: string) => void; placeholder?: string; required?: boolean;
}) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
        {label}{required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">{icon}</span>
        <input
          type="text"
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#eb1b23]/20 focus:border-[#eb1b23] transition bg-white"
        />
      </div>
    </div>
  );
}

export default function SuccessManager() {
  const [stories, setStories] = useState<SuccessStory[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState<SuccessStory | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<SuccessStory | null>(null);
  const [deleting, setDeleting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { fetchStories(); }, []);

  async function fetchStories() {
    try {
      setLoading(true);
      const data = await SuccessApi.getStories();
      console.debug('[SuccessManager] raw stories from API:', JSON.stringify(data.map(s => ({ id: s.id, image_path: s.image_path }))));

      // Resolve bare storage paths client-side (handles records saved before the backend fix)
      const resolved = await Promise.all(data.map(async (s) => {
        if (!s.image_path || s.image_path.startsWith('http')) return s;
        const storagePath = s.image_path.includes('/')
          ? s.image_path
          : `images/success/${s.image_path}`;
        try {
          const url = await FilesApi.getPublicUrl('acp', storagePath);
          console.debug('[SuccessManager] resolved', s.image_path, '->', url);
          return { ...s, image_path: url };
        } catch (e) {
          console.warn('[SuccessManager] could not resolve path:', s.image_path, e);
          return s;
        }
      }));
      setStories(resolved);
    } catch (err) {
      console.error('[SuccessManager] fetchStories error:', err);
      toast.error('Failed to load success stories');
    }
    finally { setLoading(false); }
  }

  function openAdd() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setSelectedFile(null);
    setPreviewUrl(null);
    setShowForm(true);
  }

  function openEdit(story: SuccessStory) {
    setEditing(story);
    setForm({
      full_name: story.full_name ?? '',
      index_no: story.index_no ?? '',
      results: story.results ?? 'AAA',
      faculty: story.faculty ?? '',
      university: story.university ?? '',
    });
    setSelectedFile(null);
    setPreviewUrl(story.image_path ?? null);
    setShowForm(true);
  }

  function handleCancel() {
    setShowForm(false);
    setEditing(null);
    setForm(EMPTY_FORM);
    setSelectedFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { toast.error('Please select an image file'); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error('Image must be under 5MB'); return; }
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!form.full_name.trim() || !form.faculty.trim() || !form.university.trim()) {
      toast.error('Name, faculty, and university are required');
      return;
    }
    if (!editing && !selectedFile) { toast.error('Please select a photo for the new student'); return; }
    setSaving(true);
    try {
      let imagePath = editing?.image_path;
      if (selectedFile) {
        const path = `success/${Date.now()}_${selectedFile.name.replace(/\s+/g, '_')}`;
        console.debug('[SuccessManager] uploading to path:', path);
        const storagePath = await FilesApi.uploadWithSignedUrl('acp', path, selectedFile);
        imagePath = await FilesApi.getPublicUrl('acp', storagePath);
        console.debug('[SuccessManager] imagePath resolved to:', imagePath);
      }
      const payload = {
        full_name: form.full_name || undefined,
        index_no: form.index_no || undefined,
        results: form.results || undefined,
        faculty: form.faculty || undefined,
        university: form.university || undefined,
        image_path: imagePath || undefined,
      };
      if (editing) {
        const updated = await SuccessApi.updateStory(editing.id, payload);
        setStories(prev => prev.map(s => s.id === editing.id ? updated : s));
        toast.success('Story updated');
      } else {
        const created = await SuccessApi.createStory(payload);
        setStories(prev => [...prev, created]);
        toast.success('Success story added');
      }
      handleCancel();
    } catch { toast.error('Failed to save story'); }
    finally { setSaving(false); }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await SuccessApi.deleteStory(deleteTarget.id);
      setStories(prev => prev.filter(s => s.id !== deleteTarget.id));
      toast.success('Record deleted');
    } catch { toast.error('Failed to delete story'); }
    finally { setDeleting(false); setDeleteTarget(null); }
  }

  return (
    <div className="h-full min-h-0 overflow-y-auto p-4 sm:p-6 lg:p-8">

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">Success Stories</h2>
          <p className="text-sm text-gray-500 mt-1">
            Showcase your students' achievements on the landing page
            {stories.length > 0 && (
              <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-[#eb1b23]/10 text-[#eb1b23]">
                {stories.length} {stories.length === 1 ? 'story' : 'stories'}
              </span>
            )}
          </p>
        </div>
        {!showForm && (
          <button
            onClick={openAdd}
            className="flex items-center gap-2 px-5 py-2.5 bg-[#eb1b23] text-white rounded-xl font-medium text-sm hover:bg-red-700 transition-all shadow-sm hover:shadow-md"
          >
            <Plus className="w-4 h-4" />
            Add Story
          </button>
        )}
      </div>

      <div className={showForm ? 'grid grid-cols-1 xl:grid-cols-5 gap-6' : ''}>

        {/* ── Form panel ── */}
        {showForm && (
          <div className="xl:col-span-2">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden sticky top-6">
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-slate-50 to-white">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center">
                    {editing ? <Edit2 className="w-3.5 h-3.5 text-[#eb1b23]" /> : <Plus className="w-3.5 h-3.5 text-[#eb1b23]" />}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800 text-sm leading-tight">{editing ? 'Edit Record' : 'New Success Story'}</p>
                    <p className="text-[11px] text-gray-400 leading-tight mt-0.5">Fill in the student details below</p>
                  </div>
                </div>
                <button onClick={handleCancel} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSave} className="p-5 space-y-4">
                {/* Photo picker */}
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                    Student Photo{!editing && <span className="text-red-400 ml-0.5">*</span>}
                  </label>

                  {editing && previewUrl ? (
                    /* Edit mode — circle avatar with camera button */
                    <div className="flex flex-col items-center py-3">
                      <div className="relative inline-block">
                        <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-gray-100 shadow-md">
                          <img src={previewUrl} alt="preview" className="w-full h-full object-cover" />
                        </div>
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-[#eb1b23] border-2 border-white flex items-center justify-center shadow-md hover:bg-red-700 transition-colors cursor-pointer"
                        >
                          <Camera className="w-3.5 h-3.5 text-white" />
                        </button>
                      </div>
                      <p className="text-[11px] text-gray-400 mt-2">Click the camera icon to change photo</p>
                      {selectedFile && (
                        <p className="text-xs text-emerald-600 mt-1 flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" /> {selectedFile.name}
                        </p>
                      )}
                    </div>
                  ) : (
                    /* Add mode — dashed upload zone */
                    <>
                      <div
                        onClick={() => fileInputRef.current?.click()}
                        className="relative cursor-pointer group rounded-xl border-2 border-dashed border-gray-200 hover:border-[#eb1b23]/50 transition-colors overflow-hidden bg-gray-50 hover:bg-red-50/20"
                        style={{ height: 160 }}
                      >
                        {previewUrl ? (
                          <>
                            <img src={previewUrl} alt="preview" className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1.5">
                              <Upload className="w-6 h-6 text-white" />
                              <span className="text-xs font-semibold text-white">Change Photo</span>
                            </div>
                          </>
                        ) : (
                          <div className="h-full flex flex-col items-center justify-center gap-2 text-gray-400 group-hover:text-[#eb1b23] transition-colors">
                            <div className="w-12 h-12 rounded-full bg-gray-100 group-hover:bg-red-50 flex items-center justify-center transition-colors">
                              <ImageIcon className="w-6 h-6" />
                            </div>
                            <div className="text-center">
                              <p className="text-sm font-semibold">Click to upload photo</p>
                              <p className="text-xs mt-0.5 text-gray-400">JPG, PNG · Max 5 MB</p>
                            </div>
                          </div>
                        )}
                      </div>
                      {selectedFile && (
                        <p className="text-xs text-emerald-600 mt-1.5 flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" /> {selectedFile.name}
                        </p>
                      )}
                    </>
                  )}

                  <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />
                </div>

                <FieldInput icon={<User className="w-4 h-4" />} label="Full Name" value={form.full_name} onChange={v => setForm(f => ({ ...f, full_name: v }))} placeholder="e.g. Kavindu Perera" required />
                <FieldInput icon={<BookOpen className="w-4 h-4" />} label="Index Number" value={form.index_no} onChange={v => setForm(f => ({ ...f, index_no: v }))} placeholder="e.g. 2023456" />
                <FieldInput icon={<Award className="w-4 h-4" />} label="A/L Results" value={form.results} onChange={v => setForm(f => ({ ...f, results: v }))} placeholder="e.g. AAA, 3A 1B" />
                <FieldInput icon={<GraduationCap className="w-4 h-4" />} label="Faculty" value={form.faculty} onChange={v => setForm(f => ({ ...f, faculty: v }))} placeholder="e.g. Faculty of Medicine" required />
                <FieldInput icon={<GraduationCap className="w-4 h-4" />} label="University" value={form.university} onChange={v => setForm(f => ({ ...f, university: v }))} placeholder="e.g. University of Colombo" required />

                <div className="flex gap-3 pt-1">
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-[#eb1b23] text-white rounded-xl font-semibold text-sm hover:bg-red-700 transition-all disabled:opacity-60 shadow-sm"
                  >
                    <Save className="w-4 h-4" />
                    {saving ? 'Saving…' : editing ? 'Update Record' : 'Add Story'}
                  </button>
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="px-5 py-2.5 border border-gray-200 rounded-xl font-semibold text-sm text-gray-600 hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ── Cards panel ── */}
        <div className={showForm ? 'xl:col-span-3' : ''}>
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#eb1b23]" />
            </div>
          ) : stories.length === 0 ? (
            <div className="flex flex-col items-center justify-center bg-white rounded-2xl border border-gray-100 shadow-sm py-24 px-8 text-center">
              <div className="w-20 h-20 rounded-full bg-amber-50 flex items-center justify-center mb-4">
                <Trophy className="w-10 h-10 text-amber-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-700 mb-1">No success stories yet</h3>
              <p className="text-sm text-gray-400 mb-6 max-w-xs">
                Add your top students' achievements — they'll appear on the landing page to inspire others.
              </p>
              <button
                onClick={openAdd}
                className="flex items-center gap-2 px-5 py-2.5 bg-[#eb1b23] text-white rounded-xl font-medium text-sm hover:bg-red-700 transition-all"
              >
                <Plus className="w-4 h-4" />
                Add First Story
              </button>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              {stories.map((story, i) => (
                <div
                  key={story.id}
                  className={`group flex items-center gap-4 px-4 py-3 hover:bg-gray-50 transition-colors ${i !== 0 ? 'border-t border-gray-100' : ''}`}
                >
                  {/* Portrait thumbnail */}
                  <div className="flex-shrink-0 w-11 h-14 rounded-lg overflow-hidden bg-gradient-to-br from-slate-200 to-slate-300">
                    {story.image_path ? (
                      <img src={story.image_path} alt={story.full_name ?? ''} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <User className="w-5 h-5 text-slate-400" />
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-gray-900 text-sm truncate">{story.full_name}</span>
                      {story.results && (
                        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-[#eb1b23]/10 text-[#eb1b23] text-[10px] font-bold rounded-md flex-shrink-0">
                          <Award className="w-2.5 h-2.5" />
                          {story.results}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 truncate mt-0.5">{story.faculty}</p>
                    <p className="text-[11px] text-gray-400 truncate">{story.university}</p>
                  </div>

                  {/* Index no */}
                  {story.index_no && (
                    <span className="hidden sm:block text-xs text-gray-400 flex-shrink-0 font-mono">{story.index_no}</span>
                  )}

                  {/* Actions */}
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      onClick={() => openEdit(story)}
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                      title="Edit"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setDeleteTarget(story)}
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Delete confirmation modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center flex-shrink-0">
                <Trash2 className="w-6 h-6 text-red-500" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900">Delete Record</h3>
                <p className="text-sm text-gray-500">This cannot be undone.</p>
              </div>
            </div>

            {deleteTarget.image_path && (
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl mb-4">
                <img src={deleteTarget.image_path} alt="" className="w-12 h-12 rounded-lg object-cover flex-shrink-0" />
                <div className="min-w-0">
                  <p className="font-semibold text-sm text-gray-800 truncate">{deleteTarget.full_name}</p>
                  <p className="text-xs text-gray-400 truncate">{deleteTarget.university}</p>
                </div>
              </div>
            )}

            <p className="text-sm text-gray-600 mb-5">
              Are you sure you want to remove <span className="font-semibold text-gray-800">{deleteTarget.full_name}</span>'s success story?
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
