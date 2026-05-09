import { useState, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { Plus, Trash2, Upload, Trophy } from 'lucide-react';
import { RankListsApi } from '@/features/teacher/api';
import type { RankList } from '@/features/teacher/api';
import { FilesApi } from '../../api';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

const CURRENT_YEAR = new Date().getFullYear();

export default function TestResultsManager() {
  const [entries, setEntries] = useState<RankList[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ year: CURRENT_YEAR, exam_name: '' });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { fetchEntries(); }, []);

  async function fetchEntries() {
    try {
      setLoading(true);
      setEntries(await RankListsApi.getRankLists());
    } catch { toast.error('Failed to load test results'); }
    finally { setLoading(false); }
  }

  async function handleSave() {
    if (!form.exam_name || !selectedFile) {
      toast.error('Exam name and image are required');
      return;
    }
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
      setDialogOpen(false);
      setForm({ year: CURRENT_YEAR, exam_name: '' });
      setSelectedFile(null);
    } catch { toast.error('Failed to save rank list'); }
    finally { setSaving(false); }
  }

  async function handleDelete(id: string) {
    try {
      await RankListsApi.deleteRankList(id);
      setEntries(prev => prev.filter(e => e.id !== id));
      toast.success('Entry deleted');
    } catch { toast.error('Failed to delete entry'); }
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Test Results</h1>
          <p className="text-sm text-gray-500 mt-1">Rank list images shown on the public website</p>
        </div>
        <Button onClick={() => setDialogOpen(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          Add Result
        </Button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)}
        </div>
      ) : entries.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
            <Trophy className="w-8 h-8 text-gray-400" />
          </div>
          <p className="font-medium text-gray-700">No results yet</p>
          <p className="text-sm text-gray-400 mt-1">Upload rank list images to show on the public site</p>
        </div>
      ) : (
        <div className="space-y-3">
          {entries.map(entry => (
            <div key={entry.id} className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 flex items-center gap-4">
              {entry.public_url ? (
                <img src={entry.public_url} alt={entry.exam_name} className="w-16 h-16 object-cover rounded-lg flex-shrink-0 border border-gray-100" />
              ) : (
                <div className="w-16 h-16 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                  <Trophy className="w-6 h-6 text-gray-400" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900">{entry.exam_name}</p>
                <p className="text-sm text-gray-500">{entry.year}</p>
              </div>
              <button onClick={() => handleDelete(entry.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-500 transition-colors flex-shrink-0">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Rank List</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Year"
                type="number"
                value={form.year}
                onChange={e => setForm(f => ({ ...f, year: Number(e.target.value) }))}
              />
              <Input
                label="Exam Name"
                value={form.exam_name}
                onChange={e => setForm(f => ({ ...f, exam_name: e.target.value }))}
                placeholder="e.g. A/L 2026"
              />
            </div>
            <div>
              <label className="text-[13px] font-medium text-gray-700 ml-1 block mb-1.5">Rank List Image</label>
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
                    onClick={() => { setSelectedFile(null); if (fileInputRef.current) fileInputRef.current.value = ''; }}
                    className="text-gray-400 hover:text-gray-600 text-xs"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full flex flex-col items-center justify-center gap-2 p-6 rounded-xl border-2 border-dashed border-gray-200 hover:border-primary/50 hover:bg-primary/5 transition-colors text-gray-400"
                >
                  <Upload className="w-6 h-6" />
                  <span className="text-sm">Click to select image or PDF</span>
                </button>
              )}
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleSave} isLoading={saving}>Add Entry</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
