import { useState, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { Plus, Trash2, Upload, Trophy, Save, X } from 'lucide-react';
import { RankListsApi } from '@/features/teacher/api';
import type { RankList } from '@/features/teacher/api';
import { FilesApi } from '../../api';

const CURRENT_YEAR = new Date().getFullYear();

export default function TestResultsManager() {
  const [entries, setEntries] = useState<RankList[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ year: CURRENT_YEAR, exam_name: '' });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<RankList | null>(null);
  const [deleting, setDeleting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { fetchEntries(); }, []);

  async function fetchEntries() {
    try {
      setLoading(true);
      setEntries(await RankListsApi.getRankLists());
    } catch { toast.error('Failed to load test results'); }
    finally { setLoading(false); }
  }

  function handleCancel() {
    setShowForm(false);
    setForm({ year: CURRENT_YEAR, exam_name: '' });
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!form.exam_name || !selectedFile) { toast.error('Exam name and image are required'); return; }
    setSaving(true);
    try {
      const ext = selectedFile.name.slice(selectedFile.name.lastIndexOf('.'));
      const path = `rank-lists/${form.year}_${form.exam_name.replace(/\s+/g, '_')}_${Date.now()}${ext}`;
      const storagePath = await FilesApi.uploadWithSignedUrl('acp', path, selectedFile);
      const publicUrl = await FilesApi.getPublicUrl('acp', storagePath);
      const entry = await RankListsApi.createRankList({
        year: form.year,
        exam_name: form.exam_name,
        image_path: storagePath,
        public_url: publicUrl,
      });
      setEntries(prev => [...prev, entry].sort((a, b) => b.year - a.year));
      toast.success('Rank list added');
      handleCancel();
    } catch { toast.error('Failed to save rank list'); }
    finally { setSaving(false); }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await RankListsApi.deleteRankList(deleteTarget.id);
      setEntries(prev => prev.filter(e => e.id !== deleteTarget.id));
      toast.success('Entry deleted');
    } catch { toast.error('Failed to delete entry'); }
    finally { setDeleting(false); setDeleteTarget(null); }
  }

  return (
    <div className="h-full min-h-0 overflow-y-auto p-4 sm:p-6 lg:p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">Test Results</h2>
          <p className="text-sm text-gray-500 mt-1">Rank list images shown on the public website</p>
        </div>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-[#eb1b23] text-white rounded-xl font-medium text-sm hover:bg-red-700 transition-all shadow-sm hover:shadow-md"
          >
            <Plus className="w-4 h-4" />
            Add Result
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
                    <Plus className="w-4 h-4 text-[#eb1b23]" />
                  </div>
                  <h3 className="font-semibold text-gray-800 text-sm">New Rank List</h3>
                </div>
                <button onClick={handleCancel} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSave} className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Year</label>
                    <input
                      type="number"
                      value={form.year}
                      onChange={e => setForm(f => ({ ...f, year: Number(e.target.value) }))}
                      className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#eb1b23]/20 focus:border-[#eb1b23] transition"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Exam Name *</label>
                    <input
                      type="text"
                      value={form.exam_name}
                      onChange={e => setForm(f => ({ ...f, exam_name: e.target.value }))}
                      className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#eb1b23]/20 focus:border-[#eb1b23] transition"
                      placeholder="e.g. A/L 2026"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Rank List Image *</label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,application/pdf"
                    className="hidden"
                    onChange={e => setSelectedFile(e.target.files?.[0] ?? null)}
                  />
                  {selectedFile ? (
                    <div className="flex items-center gap-3 p-3 rounded-xl border border-gray-200 bg-gray-50">
                      <span className="text-sm text-gray-700 truncate flex-1">{selectedFile.name}</span>
                      <button
                        type="button"
                        onClick={() => { setSelectedFile(null); if (fileInputRef.current) fileInputRef.current.value = ''; }}
                        className="text-gray-400 hover:text-gray-600 text-xs"
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="cursor-pointer rounded-xl border-2 border-dashed border-gray-200 hover:border-[#eb1b23]/40 hover:bg-red-50/30 transition-colors p-6 flex flex-col items-center gap-2 text-gray-400"
                    >
                      <Upload className="w-6 h-6" />
                      <span className="text-sm">Click to select image or PDF</span>
                    </div>
                  )}
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-[#eb1b23] text-white rounded-xl font-medium text-sm hover:bg-red-700 transition-all disabled:opacity-60 shadow-sm"
                  >
                    <Save className="w-4 h-4" />
                    {saving ? 'Saving…' : 'Add Entry'}
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
          ) : entries.length === 0 ? (
            <div className="flex flex-col items-center justify-center bg-white rounded-2xl border border-gray-100 shadow-sm py-20 px-8 text-center">
              <div className="w-20 h-20 rounded-full bg-amber-50 flex items-center justify-center mb-4">
                <Trophy className="w-10 h-10 text-amber-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-700 mb-1">No results yet</h3>
              <p className="text-sm text-gray-400 mb-6 max-w-xs">Upload rank list images to show on the public site</p>
              <button
                onClick={() => setShowForm(true)}
                className="flex items-center gap-2 px-5 py-2.5 bg-[#eb1b23] text-white rounded-xl font-medium text-sm hover:bg-red-700 transition-all"
              >
                <Plus className="w-4 h-4" />
                Add First Entry
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {entries.map(entry => (
                <div key={entry.id} className="group bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg transition-all duration-200 overflow-hidden">
                  <div className="relative h-40 bg-gradient-to-br from-slate-100 to-slate-200 overflow-hidden">
                    {entry.public_url ? (
                      <img src={entry.public_url} alt={entry.exam_name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Trophy className="w-12 h-12 text-slate-300" />
                      </div>
                    )}
                    <div className="absolute top-3 right-3">
                      <span className="inline-flex items-center px-2.5 py-1 bg-[#eb1b23] text-white text-xs font-bold rounded-full shadow">
                        {entry.year}
                      </span>
                    </div>
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
                      <button
                        onClick={() => setDeleteTarget(entry)}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-red-500 text-white rounded-lg text-xs font-semibold hover:bg-red-600 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Delete
                      </button>
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="font-bold text-gray-900 text-sm truncate">{entry.exam_name}</h3>
                    <p className="text-xs text-gray-400">{entry.year}</p>
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
                <h3 className="font-bold text-gray-900">Delete Entry</h3>
                <p className="text-sm text-gray-500">This cannot be undone.</p>
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-5">
              Are you sure you want to remove <span className="font-semibold text-gray-800">{deleteTarget.exam_name} ({deleteTarget.year})</span>?
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
