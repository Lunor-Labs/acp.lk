import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { CoursesApi } from '../../../courses/api';
import type { Course, Week, Material } from '../../../courses/api';
import {
  Plus, Edit2, Users, Clock, Search, AlertTriangle,
  Beaker, Microscope, Calculator, BookOpen, Atom, Video,
  FileText as FileIcon, Trash2, Calendar, PlayCircle, X,
  Save, ChevronDown, ChevronUp, BookMarked,
} from 'lucide-react';

const getClassIcon = (subject: string) => {
  const s = subject.toLowerCase();
  if (s.includes('physics')) return Atom;
  if (s.includes('chemistry')) return Beaker;
  if (s.includes('biology')) return Microscope;
  if (s.includes('math')) return Calculator;
  return BookOpen;
};

const COLOR_VARIANTS = [
  { bg: 'bg-red-50', icon: 'text-[#eb1b23]', badge: 'bg-[#eb1b23]/10 text-[#eb1b23]', dot: 'bg-[#eb1b23]' },
  { bg: 'bg-blue-50', icon: 'text-blue-600', badge: 'bg-blue-100 text-blue-700', dot: 'bg-blue-500' },
  { bg: 'bg-emerald-50', icon: 'text-emerald-600', badge: 'bg-emerald-100 text-emerald-700', dot: 'bg-emerald-500' },
  { bg: 'bg-amber-50', icon: 'text-amber-600', badge: 'bg-amber-100 text-amber-700', dot: 'bg-amber-500' },
  { bg: 'bg-purple-50', icon: 'text-purple-600', badge: 'bg-purple-100 text-purple-700', dot: 'bg-purple-500' },
];

const EMPTY_FORM = {
  title: '', description: '', subject: 'Physics',
  price: 0, is_free: true, weeks: [] as Week[], materials: [] as Material[],
};

export default function MyClasses() {
  const [classes, setClasses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [expandedClass, setExpandedClass] = useState<string | null>(null);
  const [activeRecordingInput, setActiveRecordingInput] = useState<string | null>(null);
  const [recordingUrl, setRecordingUrl] = useState('');

  useEffect(() => { loadClasses(); }, []);

  async function loadClasses() {
    try {
      setLoading(true);
      const data = await CoursesApi.getTeacherCourses();
      setClasses(data.map(c => ({ ...c, weeks: c.weeks || [] })));
    } catch { toast.error('Failed to load classes'); }
    finally { setLoading(false); }
  }

  function openAdd() {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setShowForm(true);
  }

  function openEdit(cls: Course) {
    setForm({
      title: cls.title,
      description: cls.description,
      subject: cls.subject,
      price: cls.price,
      is_free: cls.is_free,
      weeks: cls.weeks || [],
      materials: cls.materials || [],
    });
    setEditingId(cls.id);
    setShowForm(true);
  }

  function handleCancel() {
    setShowForm(false);
    setEditingId(null);
    setForm(EMPTY_FORM);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim()) { toast.error('Class title is required'); return; }
    setSaving(true);
    try {
      const payload = {
        title: form.title,
        description: form.description,
        subject: form.subject,
        price: form.is_free ? 0 : form.price,
        is_free: form.is_free,
        weeks: form.weeks,
        materials: form.materials,
        is_active: true,
      };
      if (editingId) {
        await CoursesApi.updateCourse(editingId, payload);
        toast.success('Class updated');
      } else {
        await CoursesApi.createCourse(payload);
        toast.success('Class published');
      }
      await loadClasses();
      handleCancel();
    } catch { toast.error('Failed to save class'); }
    finally { setSaving(false); }
  }

  async function handleToggleActive(cls: Course) {
    try {
      await CoursesApi.updateCourse(cls.id, { is_active: !cls.is_active });
      setClasses(prev => prev.map(c => c.id === cls.id ? { ...c, is_active: !c.is_active } : c));
    } catch { toast.error('Failed to update status'); }
  }

  // ── Week helpers ────────────────────────────────────────────
  function addWeek() {
    const w: Week = {
      id: crypto.randomUUID(),
      title: `Week ${form.weeks.length + 1}`,
      description: '', schedule_time: '', zoom_link: '',
      recordings: [], materials: [],
    };
    setForm(f => ({ ...f, weeks: [...f.weeks, w] }));
  }

  function updateWeek(id: string, patch: Partial<Week>) {
    setForm(f => ({ ...f, weeks: f.weeks.map(w => w.id === id ? { ...w, ...patch } : w) }));
  }

  function removeWeek(id: string) {
    setForm(f => ({ ...f, weeks: f.weeks.filter(w => w.id !== id) }));
  }

  function addRecording(weekId: string) {
    if (!recordingUrl.trim()) return;
    updateWeek(weekId, {
      recordings: [...(form.weeks.find(w => w.id === weekId)?.recordings ?? []), recordingUrl.trim()],
    });
    setActiveRecordingInput(null);
    setRecordingUrl('');
  }

  function removeRecording(weekId: string, idx: number) {
    const w = form.weeks.find(w => w.id === weekId);
    if (!w) return;
    updateWeek(weekId, { recordings: w.recordings.filter((_, i) => i !== idx) });
  }

  const filtered = classes.filter(c =>
    c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.subject.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="h-full min-h-0 overflow-y-auto p-4 sm:p-6 lg:p-8">

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">My Classes</h2>
          <p className="text-sm text-gray-500 mt-1">Manage your courses and weekly modules</p>
        </div>
        {!showForm && (
          <button
            onClick={openAdd}
            className="flex items-center gap-2 px-5 py-2.5 bg-[#eb1b23] text-white rounded-xl font-medium text-sm hover:bg-red-700 transition-all shadow-sm hover:shadow-md"
          >
            <Plus className="w-4 h-4" />
            New Class
          </button>
        )}
      </div>

      <div className={showForm ? 'grid grid-cols-1 xl:grid-cols-5 gap-6' : ''}>

        {/* ── Class list ── */}
        <div className={showForm ? 'xl:col-span-3' : ''}>

          {/* Search */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search classes…"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#eb1b23]/20 focus:border-[#eb1b23] transition bg-white"
            />
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#eb1b23]" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center bg-white rounded-2xl border border-gray-100 shadow-sm py-20 px-8 text-center">
              <div className="w-20 h-20 rounded-full bg-red-50 flex items-center justify-center mb-4">
                <BookMarked className="w-10 h-10 text-[#eb1b23]/60" />
              </div>
              <h3 className="text-lg font-semibold text-gray-700 mb-1">No classes yet</h3>
              <p className="text-sm text-gray-400 mb-6 max-w-xs">Create your first class to get started</p>
              <button
                onClick={openAdd}
                className="flex items-center gap-2 px-5 py-2.5 bg-[#eb1b23] text-white rounded-xl font-medium text-sm hover:bg-red-700 transition-all"
              >
                <Plus className="w-4 h-4" /> Create Class
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map((cls, idx) => {
                const Icon = getClassIcon(cls.subject);
                const color = COLOR_VARIANTS[idx % COLOR_VARIANTS.length];
                const isExpanded = expandedClass === cls.id;

                return (
                  <div key={cls.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    {/* Card header */}
                    <div className="flex items-center gap-4 p-4">
                      <div className={`w-12 h-12 rounded-xl ${color.bg} flex items-center justify-center flex-shrink-0`}>
                        <Icon className={`w-6 h-6 ${color.icon}`} />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-0.5">
                          <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${color.badge}`}>{cls.subject}</span>
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md ${cls.is_active ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-100 text-gray-400'}`}>
                            {cls.is_active ? 'Active' : 'Paused'}
                          </span>
                          {!cls.is_free && (
                            <span className="text-[10px] font-semibold text-gray-500">LKR {Number(cls.price).toLocaleString()}</span>
                          )}
                        </div>
                        <h3 className="font-bold text-gray-900 text-sm leading-tight truncate">{cls.title}</h3>
                        {cls.description && (
                          <p className="text-xs text-gray-400 mt-0.5 truncate">{cls.description}</p>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button
                          onClick={() => handleToggleActive(cls)}
                          className={`text-[11px] font-semibold px-2.5 py-1 rounded-lg transition-colors ${cls.is_active ? 'bg-gray-100 text-gray-500 hover:bg-gray-200' : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'}`}
                        >
                          {cls.is_active ? 'Pause' : 'Activate'}
                        </button>
                        <button
                          onClick={() => openEdit(cls)}
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setExpandedClass(isExpanded ? null : cls.id)}
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                        >
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    {/* Stats row */}
                    <div className="flex items-center gap-4 px-4 pb-3 text-xs text-gray-400">
                      <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {cls.weeks?.length || 0} modules</span>
                      <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {cls.student_count ?? 0} Students</span>
                    </div>

                    {/* Expanded modules */}
                    {isExpanded && cls.weeks && cls.weeks.length > 0 && (
                      <div className="border-t border-gray-100 px-4 py-3 space-y-2">
                        {cls.weeks.map((week, wi) => (
                          <div key={week.id || wi} className="flex items-start gap-3 p-2.5 rounded-xl bg-gray-50">
                            <div className="w-6 h-6 rounded-lg bg-white border border-gray-200 flex items-center justify-center text-[10px] font-bold text-gray-500 flex-shrink-0 mt-0.5">
                              {wi + 1}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-gray-800 truncate">{week.title}</p>
                              {week.schedule_time && (
                                <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                                  <Clock className="w-3 h-3" />{week.schedule_time}
                                </p>
                              )}
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              {week.zoom_link && <Video className="w-3.5 h-3.5 text-blue-400" />}
                              {week.recordings?.length > 0 && <PlayCircle className="w-3.5 h-3.5 text-[#eb1b23]" />}
                              {week.materials?.length > 0 && <FileIcon className="w-3.5 h-3.5 text-gray-400" />}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── Form panel ── */}
        {showForm && (
          <div className="xl:col-span-2">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden sticky top-6">
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-slate-50 to-white">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center">
                    {editingId ? <Edit2 className="w-3.5 h-3.5 text-[#eb1b23]" /> : <Plus className="w-3.5 h-3.5 text-[#eb1b23]" />}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800 text-sm leading-tight">{editingId ? 'Edit Class' : 'New Class'}</p>
                    <p className="text-[11px] text-gray-400 leading-tight mt-0.5">{editingId ? 'Update class details' : 'Fill in the details below'}</p>
                  </div>
                </div>
                <button onClick={handleCancel} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSave} className="p-5 space-y-4 max-h-[calc(100vh-200px)] overflow-y-auto">

                {/* Title */}
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Class Title *</label>
                  <input
                    type="text"
                    required
                    value={form.title}
                    onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                    placeholder="e.g. 2027 Physics Theory — March"
                    className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#eb1b23]/20 focus:border-[#eb1b23] transition"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Description</label>
                  <textarea
                    rows={2}
                    value={form.description}
                    onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                    placeholder="Brief overview of the class…"
                    className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#eb1b23]/20 focus:border-[#eb1b23] transition resize-none"
                  />
                </div>

                {/* Pricing */}
                <div className="rounded-xl border border-gray-200 p-4 space-y-3">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Access & Pricing</p>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.is_free}
                      onChange={e => setForm(f => ({ ...f, is_free: e.target.checked }))}
                      className="w-4 h-4 rounded text-[#eb1b23] border-gray-300 focus:ring-[#eb1b23]"
                    />
                    <div>
                      <p className="text-sm font-semibold text-gray-800">Free Access</p>
                      <p className="text-[11px] text-gray-400">Available to all students at no cost</p>
                    </div>
                  </label>
                  {!form.is_free && (
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Monthly Fee (LKR)</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400">LKR</span>
                        <input
                          type="number"
                          min="0"
                          value={form.price}
                          onChange={e => setForm(f => ({ ...f, price: parseFloat(e.target.value) || 0 }))}
                          className="w-full pl-11 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#eb1b23]/20 focus:border-[#eb1b23] transition"
                        />
                      </div>
                      <div className="flex items-start gap-2 mt-2 p-2.5 bg-amber-50 border border-amber-100 rounded-xl">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-500 flex-shrink-0 mt-0.5" />
                        <p className="text-[11px] text-amber-700">Students must pay to access recordings and materials.</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Modules */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Class Modules</p>
                    <button
                      type="button"
                      onClick={addWeek}
                      className="flex items-center gap-1 text-xs font-semibold text-[#eb1b23] hover:text-red-700 transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add Module
                    </button>
                  </div>

                  {form.weeks.length === 0 ? (
                    <div
                      onClick={addWeek}
                      className="cursor-pointer rounded-xl border-2 border-dashed border-gray-200 hover:border-[#eb1b23]/40 p-6 flex flex-col items-center gap-1 text-gray-400 hover:text-[#eb1b23] transition-colors"
                    >
                      <Calendar className="w-6 h-6" />
                      <p className="text-xs font-medium">Click to add your first module</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {form.weeks.map((week, wi) => (
                        <div key={week.id} className="rounded-xl border border-gray-200 bg-gray-50 p-3 space-y-2.5">
                          <div className="flex items-center gap-2">
                            <span className="w-5 h-5 rounded bg-white border border-gray-200 flex items-center justify-center text-[10px] font-bold text-gray-500 flex-shrink-0">{wi + 1}</span>
                            <input
                              type="text"
                              value={week.title}
                              onChange={e => updateWeek(week.id, { title: e.target.value })}
                              className="flex-1 px-2.5 py-1.5 text-xs font-semibold border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-[#eb1b23]/30 focus:border-[#eb1b23]"
                              placeholder="Module title"
                            />
                            <button type="button" onClick={() => removeWeek(week.id)} className="text-gray-300 hover:text-red-500 transition-colors flex-shrink-0">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          {/* Schedule */}
                          <div className="flex items-center gap-2 px-2.5 py-1.5 bg-white border border-gray-200 rounded-lg">
                            <Clock className="w-3 h-3 text-gray-400 flex-shrink-0" />
                            <input
                              type="text"
                              value={week.schedule_time || ''}
                              onChange={e => updateWeek(week.id, { schedule_time: e.target.value })}
                              placeholder="e.g. Mon 6PM"
                              className="flex-1 text-xs bg-transparent outline-none text-gray-700"
                            />
                          </div>

                          {/* Zoom link */}
                          <div className="flex items-center gap-2 px-2.5 py-1.5 bg-white border border-gray-200 rounded-lg">
                            <Video className="w-3 h-3 text-blue-400 flex-shrink-0" />
                            <input
                              type="text"
                              value={week.zoom_link || ''}
                              onChange={e => updateWeek(week.id, { zoom_link: e.target.value })}
                              placeholder="Live class link…"
                              className="flex-1 text-xs bg-transparent outline-none text-gray-700"
                            />
                          </div>

                          {/* Recordings */}
                          <div>
                            <div className="flex items-center justify-between mb-1.5">
                              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Recordings</span>
                              {activeRecordingInput !== week.id && (
                                <button type="button" onClick={() => setActiveRecordingInput(week.id)} className="text-[10px] font-bold text-[#eb1b23] hover:underline">+ Add</button>
                              )}
                            </div>
                            {activeRecordingInput === week.id && (
                              <div className="flex gap-1 mb-1.5">
                                <input
                                  autoFocus
                                  type="text"
                                  value={recordingUrl}
                                  onChange={e => setRecordingUrl(e.target.value)}
                                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addRecording(week.id); } }}
                                  placeholder="Paste URL and press Enter"
                                  className="flex-1 text-xs px-2 py-1.5 border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-[#eb1b23]/30 focus:border-[#eb1b23]"
                                />
                                <button type="button" onClick={() => addRecording(week.id)} className="px-2 py-1 bg-[#eb1b23] text-white text-xs font-bold rounded-lg">Add</button>
                                <button type="button" onClick={() => setActiveRecordingInput(null)} className="px-1.5 text-gray-400 hover:text-gray-600"><X className="w-3.5 h-3.5" /></button>
                              </div>
                            )}
                            <div className="space-y-1">
                              {week.recordings?.map((rec, ri) => (
                                <div key={ri} className="flex items-center gap-2 px-2 py-1 bg-white border border-gray-200 rounded-lg">
                                  <PlayCircle className="w-3 h-3 text-[#eb1b23] flex-shrink-0" />
                                  <span className="flex-1 text-[10px] text-gray-500 truncate">{rec}</span>
                                  <button type="button" onClick={() => removeRecording(week.id, ri)} className="text-gray-300 hover:text-red-500"><Trash2 className="w-3 h-3" /></button>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-1">
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-[#eb1b23] text-white rounded-xl font-semibold text-sm hover:bg-red-700 transition-all disabled:opacity-60 shadow-sm"
                  >
                    <Save className="w-4 h-4" />
                    {saving ? 'Saving…' : editingId ? 'Update Class' : 'Publish Class'}
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
      </div>
    </div>
  );
}
