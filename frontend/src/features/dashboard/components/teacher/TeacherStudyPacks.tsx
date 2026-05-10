import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import {
  Video, ShoppingBag, Trash2, Plus, Pencil, Package,
  ChevronRight, Search, ListChecks, PlusCircle, X,
  Clock, LayoutGrid,
} from 'lucide-react';
import { StudyPacksApi } from '../../api';
import type { StudyPack, VideoLesson } from '../../api';

/* ── helpers ── */

function subjectMeta(subject: string) {
  const s = subject.toLowerCase();
  if (s.includes('physics'))   return { bg: 'bg-purple-100', text: 'text-purple-700', border: 'border-purple-200', dot: 'bg-purple-500' };
  if (s.includes('chemistry')) return { bg: 'bg-emerald-100', text: 'text-emerald-700', border: 'border-emerald-200', dot: 'bg-emerald-500' };
  if (s.includes('math'))      return { bg: 'bg-amber-100',   text: 'text-amber-700',   border: 'border-amber-200',   dot: 'bg-amber-500' };
  if (s.includes('biology'))   return { bg: 'bg-green-100',   text: 'text-green-700',   border: 'border-green-200',   dot: 'bg-green-500' };
  return                              { bg: 'bg-red-100',     text: 'text-red-700',     border: 'border-red-200',     dot: 'bg-red-500' };
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3">{children}</p>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-600 mb-1.5">{label}</label>
      {children}
    </div>
  );
}

const inputCls = "w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#eb1b23]/20 focus:border-[#eb1b23] bg-gray-50 placeholder:text-gray-400";

const TABS = [
  { key: 'all',     label: 'All' },
  { key: 'premium', label: 'Premium' },
  { key: 'free',    label: 'Free' },
];

/* ── main component ── */

export default function TeacherStudyPacks() {
  const [studyPacks, setStudyPacks] = useState<StudyPack[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileTab, setMobileTab] = useState<'list' | 'create'>('list');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const [editingPackId, setEditingPackId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ title: '', subject: 'Physics', price: '', description: '', is_free: false });
  const [videos, setVideos] = useState<VideoLesson[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchStudyPacks(); }, []);

  async function fetchStudyPacks() {
    try {
      setLoading(true);
      const data = await StudyPacksApi.getTeacherPacks();
      setStudyPacks((data || []).map((p: StudyPack) => ({
        ...p,
        status: p.is_free ? 'Free' : 'Published',
      })));
    } catch {
      toast.error('Failed to load study packs');
    } finally {
      setLoading(false);
    }
  }

  async function handleSavePack(isDraft: boolean) {
    if (!formData.title) return toast.warning('Pack title is required');
    try {
      setSaving(true);
      const payload = {
        title: formData.title,
        subject: formData.subject,
        description: formData.description,
        price: formData.is_free ? 0 : parseFloat(formData.price) || 0,
        is_free: formData.is_free,
        materials: videos,
      };
      if (editingPackId) {
        await StudyPacksApi.updatePack(editingPackId, payload);
        toast.success(isDraft ? 'Draft updated' : 'Study pack updated');
      } else {
        await StudyPacksApi.createPack(payload);
        toast.success(isDraft ? 'Saved as draft' : 'Study pack published');
      }
      resetForm();
      fetchStudyPacks();
      setMobileTab('list');
    } catch {
      toast.error('Failed to save study pack');
    } finally {
      setSaving(false);
    }
  }

  function resetForm() {
    setEditingPackId(null);
    setFormData({ title: '', subject: 'Physics', price: '', description: '', is_free: false });
    setVideos([]);
  }

  function handleEditPack(pack: StudyPack) {
    setEditingPackId(pack.id);
    setFormData({ title: pack.title, subject: pack.subject, price: pack.price.toString(), description: pack.description || '', is_free: pack.is_free });
    setVideos(pack.materials || []);
    setMobileTab('create');
  }

  async function handleDeletePack(id: string) {
    try {
      await StudyPacksApi.deletePack(id);
      setStudyPacks(prev => prev.filter(p => p.id !== id));
      toast.success('Study pack deleted');
    } catch {
      toast.error('Failed to delete study pack');
    } finally {
      setDeleteConfirmId(null);
    }
  }

  function addVideo() {
    setVideos(v => [...v, { id: Date.now().toString(), title: `Lesson ${v.length + 1}`, duration: '', size: '', youtube_url: '' }]);
  }

  const counts = {
    all:     studyPacks.length,
    premium: studyPacks.filter(p => !p.is_free).length,
    free:    studyPacks.filter(p => p.is_free).length,
  };

  const filtered = studyPacks.filter(p => {
    const matchFilter = filterStatus === 'all' || (filterStatus === 'free' ? p.is_free : !p.is_free);
    const matchSearch = !searchQuery ||
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.subject.toLowerCase().includes(searchQuery.toLowerCase());
    return matchFilter && matchSearch;
  });

  /* ── sub-panels ── */

  const ListPanel = (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col h-full min-h-0">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 flex-shrink-0">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Study Packs</h2>
          <p className="text-xs text-gray-500 mt-0.5">{studyPacks.length} total · {counts.premium} premium</p>
        </div>
      </div>

      {/* Tabs + search */}
      <div className="flex items-center gap-3 px-6 py-3 border-b border-gray-100 flex-shrink-0 flex-wrap">
        <div className="flex items-center bg-gray-100 rounded-xl p-1 gap-0.5">
          {TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => setFilterStatus(tab.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                filterStatus === tab.key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                filterStatus === tab.key ? 'bg-[#eb1b23] text-white' : 'bg-gray-200 text-gray-600'
              }`}>
                {counts[tab.key as keyof typeof counts]}
              </span>
            </button>
          ))}
        </div>
        <div className="flex-1 min-w-[160px] relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
          <input
            type="text"
            placeholder="Search packs…"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#eb1b23]/20 focus:border-[#eb1b23]"
          />
        </div>
      </div>

      {/* List */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-2 border-[#eb1b23] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3">
              <Package className="w-6 h-6 text-gray-400" />
            </div>
            <p className="text-sm font-medium text-gray-700">No study packs found</p>
            <p className="text-xs text-gray-400 mt-1">Create your first pack using the form</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {filtered.map(pack => {
              const meta = subjectMeta(pack.subject);
              return (
                <div key={pack.id} className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50 transition-colors group">
                  {/* Subject icon */}
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${meta.bg}`}>
                    <LayoutGrid className={`w-5 h-5 ${meta.text}`} />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-sm text-gray-900 truncate">{pack.title}</span>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${meta.bg} ${meta.text} ${meta.border} flex-shrink-0`}>
                        {pack.subject}
                      </span>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${
                        pack.is_free ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-blue-100 text-blue-700 border border-blue-200'
                      }`}>
                        {pack.is_free ? 'Free' : 'Premium'}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-1 flex-wrap text-xs text-gray-400">
                      <span className="flex items-center gap-1"><Video className="w-3 h-3" />{pack.materials?.length || 0} lessons</span>
                      <span className="flex items-center gap-1"><ShoppingBag className="w-3 h-3" />{pack.sales_count ?? 0} sales</span>
                      {!pack.is_free && <span className="font-semibold text-gray-600">LKR {pack.price.toLocaleString()}</span>}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleEditPack(pack)}
                      className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-blue-100 hover:text-blue-700 flex items-center justify-center transition"
                    >
                      <Pencil style={{ width: 14, height: 14 }} />
                    </button>
                    <button
                      onClick={() => setDeleteConfirmId(pack.id)}
                      className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-red-100 hover:text-red-600 flex items-center justify-center transition"
                    >
                      <Trash2 style={{ width: 14, height: 14 }} />
                    </button>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-200 flex-shrink-0" />
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );

  const CreatePanel = (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 h-full flex flex-col min-h-0">

      {/* Header */}
      <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-[#eb1b23] rounded-xl flex items-center justify-center shadow-sm shadow-red-200">
            <Package style={{ width: 18, height: 18 }} className="text-white" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-gray-900">{editingPackId ? 'Edit Study Pack' : 'Create Study Pack'}</h3>
            <p className="text-[11px] text-gray-400">
              {videos.length > 0
                ? `${videos.length} lesson${videos.length !== 1 ? 's' : ''} · ${formData.is_free ? 'Free' : formData.price ? `LKR ${Number(formData.price).toLocaleString()}` : 'Price not set'}`
                : editingPackId ? 'Update pack details' : 'Bundle lessons for students'}
            </p>
          </div>
        </div>
        {editingPackId && (
          <button onClick={resetForm} className="text-xs font-semibold text-gray-400 hover:text-gray-700 bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-lg transition flex items-center gap-1">
            <X style={{ width: 11, height: 11 }} /> Cancel
          </button>
        )}
      </div>

      {/* Scrollable body */}
      <div className="flex-1 min-h-0 overflow-y-auto px-5 py-5 space-y-6">

        {/* ── Details ── */}
        <div>
          <SectionLabel>Details</SectionLabel>
          <div className="space-y-3">
            <Field label="Pack Title">
              <input type="text" value={formData.title}
                onChange={e => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g. Mechanics Full Revision"
                className={inputCls} />
            </Field>

            <Field label="Subject">
              <div className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-xl bg-gray-50">
                <span className="w-3 h-3 rounded-full bg-purple-500 flex-shrink-0" />
                <span className="text-sm font-semibold text-gray-800">Physics</span>
                <span className="ml-auto text-[10px] font-bold text-purple-600 bg-purple-100 border border-purple-200 px-2 py-0.5 rounded-full">Fixed</span>
              </div>
            </Field>

            <Field label="Description">
              <textarea value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe what students will learn, topics covered, prerequisites…"
                rows={3}
                className={`${inputCls} resize-none leading-relaxed`} />
            </Field>
          </div>
        </div>

        <div className="border-t border-dashed border-gray-200" />

        {/* ── Pricing ── */}
        <div>
          <SectionLabel>Pricing</SectionLabel>

          {/* Free / Paid toggle */}
          <div className="flex gap-2 mb-3">
            {[
              { value: true,  label: 'Free',  desc: 'Available to all students' },
              { value: false, label: 'Paid',  desc: 'Requires purchase' },
            ].map(opt => (
              <button
                key={String(opt.value)}
                type="button"
                onClick={() => setFormData({ ...formData, is_free: opt.value, price: opt.value ? '' : formData.price })}
                className={`flex-1 flex flex-col items-center py-3 rounded-xl border-2 text-sm font-semibold transition-all ${
                  formData.is_free === opt.value
                    ? opt.value
                      ? 'border-green-500 bg-green-50 text-green-700'
                      : 'border-[#eb1b23] bg-red-50 text-[#eb1b23]'
                    : 'border-gray-200 bg-gray-50 text-gray-500 hover:border-gray-300'
                }`}
              >
                {opt.label}
                <span className="text-[10px] font-normal mt-0.5 opacity-70">{opt.desc}</span>
              </button>
            ))}
          </div>

          {!formData.is_free && (
            <Field label="Price (LKR)">
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-500 bg-gray-200 px-1.5 py-0.5 rounded">
                  LKR
                </div>
                <input type="number" min="0" step="100" value={formData.price}
                  onChange={e => setFormData({ ...formData, price: e.target.value })}
                  placeholder="0"
                  className={`${inputCls} pl-14 text-base font-bold`} />
              </div>
            </Field>
          )}
        </div>

        <div className="border-t border-dashed border-gray-200" />

        {/* ── Video Lessons ── */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <SectionLabel>Video Lessons</SectionLabel>
            {videos.length > 0 && (
              <span className="text-[10px] font-bold text-gray-400 -mt-3">
                {videos.length} lesson{videos.length !== 1 ? 's' : ''}
              </span>
            )}
          </div>

          {videos.length === 0 && (
            <div className="flex flex-col items-center justify-center py-8 border-2 border-dashed border-gray-200 rounded-xl mb-3 text-center">
              <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center mb-2">
                <Video className="w-5 h-5 text-gray-400" />
              </div>
              <p className="text-xs font-semibold text-gray-500">No lessons yet</p>
              <p className="text-[10px] text-gray-400 mt-0.5">Add video lessons below</p>
            </div>
          )}

          <div className="space-y-3">
            {videos.map((video, idx) => (
              <div key={video.id} className="border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                {/* Card header */}
                <div className="flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-gray-50 to-white border-b border-gray-100">
                  <div className="w-6 h-6 rounded-full bg-[#eb1b23] text-white text-[10px] font-black flex items-center justify-center flex-shrink-0">
                    {idx + 1}
                  </div>
                  <input
                    type="text"
                    value={video.title}
                    onChange={e => setVideos(v => v.map(x => x.id === video.id ? { ...x, title: e.target.value } : x))}
                    className="flex-1 text-sm font-semibold text-gray-800 bg-transparent focus:outline-none placeholder:text-gray-400 placeholder:font-normal"
                    placeholder="Lesson title…"
                  />
                  <button
                    onClick={() => setVideos(v => v.filter(x => x.id !== video.id))}
                    className="w-6 h-6 rounded-lg bg-gray-100 hover:bg-red-100 hover:text-red-500 flex items-center justify-center text-gray-400 transition flex-shrink-0"
                  >
                    <X style={{ width: 12, height: 12 }} />
                  </button>
                </div>

                <div className="p-4 space-y-3 bg-white">
                  {/* YouTube URL */}
                  <div className="flex items-center gap-2 border border-gray-200 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-[#eb1b23]/20 focus-within:border-[#eb1b23] transition">
                    <div className="flex items-center gap-1.5 px-3 py-2 bg-red-50 border-r border-gray-200 flex-shrink-0">
                      <svg viewBox="0 0 24 24" className="w-4 h-4 text-red-600" fill="currentColor">
                        <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z"/>
                      </svg>
                      <span className="text-[10px] font-bold text-red-600 hidden sm:block">YT</span>
                    </div>
                    <input
                      type="text"
                      value={video.youtube_url || ''}
                      onChange={e => setVideos(v => v.map(x => x.id === video.id ? { ...x, youtube_url: e.target.value } : x))}
                      placeholder="Paste YouTube link…"
                      className="flex-1 text-xs py-2 pr-3 bg-transparent focus:outline-none placeholder:text-gray-400"
                    />
                  </div>

                  {/* Duration + Quality */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex items-center gap-2 border border-gray-200 rounded-xl px-3 py-2 focus-within:ring-2 focus-within:ring-[#eb1b23]/20 focus-within:border-[#eb1b23] transition">
                      <Clock style={{ width: 12, height: 12 }} className="text-gray-400 flex-shrink-0" />
                      <input
                        type="text"
                        value={video.duration}
                        onChange={e => setVideos(v => v.map(x => x.id === video.id ? { ...x, duration: e.target.value } : x))}
                        placeholder="45 mins"
                        className="flex-1 min-w-0 text-xs bg-transparent focus:outline-none placeholder:text-gray-400"
                      />
                    </div>
                    <div className="flex items-center gap-2 border border-gray-200 rounded-xl px-3 py-2 focus-within:ring-2 focus-within:ring-[#eb1b23]/20 focus-within:border-[#eb1b23] transition">
                      <Video style={{ width: 12, height: 12 }} className="text-gray-400 flex-shrink-0" />
                      <input
                        type="text"
                        value={video.size}
                        onChange={e => setVideos(v => v.map(x => x.id === video.id ? { ...x, size: e.target.value } : x))}
                        placeholder="1080p"
                        className="flex-1 min-w-0 text-xs bg-transparent focus:outline-none placeholder:text-gray-400"
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}

            <button onClick={addVideo}
              className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-gray-200 rounded-xl text-xs font-semibold text-gray-500 hover:border-[#eb1b23] hover:text-[#eb1b23] hover:bg-red-50/30 transition-all">
              <Plus style={{ width: 14, height: 14 }} />
              Add Video Lesson
            </button>
          </div>
        </div>
      </div>

      {/* Pinned footer */}
      <div className="px-5 py-4 border-t border-gray-100 flex gap-2 flex-shrink-0">
        <button onClick={() => handleSavePack(true)} disabled={saving}
          className="flex-1 border border-gray-200 text-gray-600 py-2.5 rounded-xl text-sm font-semibold hover:bg-gray-50 transition disabled:opacity-50">
          {editingPackId ? 'Update Draft' : 'Save Draft'}
        </button>
        <button onClick={() => handleSavePack(false)} disabled={saving}
          className="flex-1 bg-[#eb1b23] text-white py-2.5 rounded-xl text-sm font-bold hover:bg-red-700 transition shadow-sm shadow-red-200 disabled:opacity-50 flex items-center justify-center gap-2">
          {saving
            ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Saving…</>
            : editingPackId ? 'Update & Publish' : 'Publish Pack'}
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex-1 min-h-0 flex flex-col text-left bg-gray-50/50">

      {/* ── Mobile tab bar ── */}
      <div className="lg:hidden flex-shrink-0 flex bg-white border-b border-gray-200">
        {[
          { key: 'list',   label: 'Study Packs', Icon: ListChecks },
          { key: 'create', label: editingPackId ? 'Edit Pack' : 'Create', Icon: PlusCircle },
        ].map(({ key, label, Icon }) => (
          <button key={key} onClick={() => setMobileTab(key as 'list' | 'create')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-semibold border-b-2 transition-colors ${
              mobileTab === key ? 'border-[#eb1b23] text-[#eb1b23]' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}>
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {/* ── Mobile panel ── */}
      <div className="lg:hidden flex-1 min-h-0 overflow-hidden p-4">
        {mobileTab === 'list' ? ListPanel : CreatePanel}
      </div>

      {/* ── Desktop split panel ── */}
      <div className="hidden lg:grid lg:grid-cols-3 gap-6 p-6 flex-1 min-h-0">
        <div className="lg:col-span-2 min-h-0 flex flex-col">{ListPanel}</div>
        <div className="lg:col-span-1 min-h-0 flex flex-col">{CreatePanel}</div>
      </div>

      {/* ── Delete confirmation modal ── */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setDeleteConfirmId(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center">
                <Trash2 className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900">Delete Study Pack?</h3>
                <p className="text-xs text-gray-500">This action cannot be undone.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirmId(null)}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition">
                Cancel
              </button>
              <button onClick={() => handleDeletePack(deleteConfirmId)}
                className="flex-1 py-2.5 rounded-xl bg-red-600 text-white text-sm font-bold hover:bg-red-700 transition">
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
