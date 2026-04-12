import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { CoursesApi } from '../../../courses/api';
import { EnrollmentsApi } from '../../../enrollments/api';
import type { Course, Material } from '../../../courses/api';
import './MyClassCard.css';
import {
  Search,
  BookOpen,
  Video,
  Lock,
  X,
  Download,
  Calendar,
  User,
  PlayCircle,
  FileText as FileIcon,
  Play,
  FileText,
  Check,
  AlertTriangle,
  Info
} from 'lucide-react';

interface Class extends Course {
  status: 'active' | 'completed';
  teacher?: {
    id: string;
    profile: {
      full_name: string;
    };
  };
  is_enrolled?: boolean;
  payment_status?: 'paid' | 'unpaid';
}





// ── Safely parse weeks from JSONB (may arrive as string, nested array, null…) ──
function parseWeeks(raw: any): any[] {
  if (!raw) return [];
  // Already a proper array of objects
  if (Array.isArray(raw)) {
    // Flatten one level in case of [[week1, week2]] nesting
    const flat = raw.length === 1 && Array.isArray(raw[0]) ? raw[0] : raw;
    return flat.filter((w: any) => w && typeof w === 'object');
  }
  // Arrived as a JSON string
  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw);
      return parseWeeks(parsed);
    } catch {
      return [];
    }
  }
  return [];
}

// ── Colour cycling for week boxes ─────────────────────
const BOX_COLORS = ['color-red', 'color-teal', 'color-blue', 'color-purple'];

function getColor(idx: number) {
  return BOX_COLORS[idx % BOX_COLORS.length];
}

// ── ClassCard sub-component ───────────────────────────
interface ClassCardProps {
  cls: Class;
  canAccess: boolean;
  processingPayment: string | null;
  onOpenWeek: (weekIndex: number | null) => void;
  onPayment: () => void;
}

function ClassCard({ cls, canAccess, processingPayment, onOpenWeek, onPayment }: ClassCardProps) {
  const weeks = cls.weeks || [];
  const visibleWeeks = weeks.slice(0, 3);          // at most 3 animated boxes
  const overflowCount = weeks.length - 3;           // how many weeks are hidden
  const hasOverflow = overflowCount > 0;
  const hasNoWeeks = weeks.length === 0;

  // Map visible boxes to their sizes (largest → smallest)
  const boxSizeMap = ['mc-box-1', 'mc-box-2', 'mc-box-3'];

  return (
    <div className="mc-card" role="article" aria-label={cls.title}>
      {/* Background gradient */}
      <div className="mc-background" />

      {/* Top info strip */}
      <div className="mc-info-strip">
        <div className="mc-meta" style={{ marginBottom: 6 }}>
          <span className={`mc-badge ${cls.status === 'active' ? 'mc-badge-active' : 'mc-badge-completed'}`}>
            {cls.status === 'active' ? 'Active' : 'Completed'}
          </span>
          {cls.is_free ? (
            <span className="mc-badge mc-badge-free">Free</span>
          ) : (
            <span className="mc-badge mc-badge-paid">LKR {cls.price}</span>
          )}
        </div>
        <p className="mc-title">{cls.title}</p>
        <div className="mc-meta">
          <User style={{ width: 10, height: 10 }} />
          <span>{cls.teacher?.profile?.full_name || 'Teacher'}</span>
          {cls.subject && (
            <>
              <span style={{ opacity: 0.4 }}>·</span>
              <span>{cls.subject}</span>
            </>
          )}
        </div>
      </div>

      {/* Centre logo – shifts to bottom-right on hover */}
      <div className="mc-logo">
        <div className="mc-logo-icon">
          <BookOpen style={{ width: 22, height: 22, color: '#eb1b23' }} />
        </div>
        <span className="mc-logo-subject">{cls.subject}</span>
      </div>

      {/* No-weeks fallback hint */}
      {hasNoWeeks && <span className="mc-browse-badge">Browse Materials</span>}

      {/* ── Animated week boxes ── */}
      {canAccess ? (
        <>
          {visibleWeeks.map((week: any, idx: number) => (
            <button
              key={week.id || idx}
              /* Largest box = index 0, rendered first → sits BEHIND smaller boxes */
              className={`mc-box ${boxSizeMap[idx]} ${getColor(idx)}`}
              onClick={() => onOpenWeek(idx)}
              title={`Open ${week.title || `Week ${idx + 1}`}`}
              style={{ border: 'none', outline: 'none' }}
            >
              <span className="mc-box-label">
                <span className="week-num">W{idx + 1}</span>
                <span className="week-title">{week.title || `Week ${idx + 1}`}</span>
              </span>
            </button>
          ))}

          {/* Overflow box: "+N more" or single fallback "Browse" */}
          {(hasOverflow || hasNoWeeks) && (
            <button
              className={`mc-box mc-box-4 ${hasOverflow ? 'color-neutral' : 'color-teal'}`}
              onClick={() => onOpenWeek(null)}
              title={hasOverflow ? `+${overflowCount} more weeks` : 'Browse Materials'}
              style={{ border: 'none', outline: 'none' }}
            >
              <span className="mc-box-label">
                <span className="week-num" style={{ fontSize: 8 }}>
                  {hasOverflow ? `+${overflowCount}` : '▶'}
                </span>
              </span>
            </button>
          )}
        </>
      ) : (
        /* Locked state – show week boxes but locked */
        <>
          {visibleWeeks.map((_: any, idx: number) => (
            <div
              key={idx}
              className={`mc-box mc-box-locked ${boxSizeMap[idx]} ${getColor(idx)}`}
            >
              <span className="mc-box-label">
                <span className="week-num">🔒</span>
              </span>
            </div>
          ))}
          <div className="mc-box mc-box-locked mc-box-4 color-neutral">
            <span className="mc-box-label">
              <span className="week-num" style={{ fontSize: 8 }}>🔒</span>
            </span>
          </div>

          {/* Hover overlay with pay button */}
          <div className="mc-locked-overlay">
            <Lock style={{ width: 28, height: 28, color: '#fff' }} />
            <p>Complete payment to access class materials</p>
            <button
              className="mc-pay-btn"
              onClick={onPayment}
              disabled={processingPayment === cls.id}
            >
              {processingPayment === cls.id ? 'Processing…' : `Pay & Unlock · LKR ${cls.price}`}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

// ── Main component ─────────────────────────────────────
export default function MyClasses() {
  const { user } = useAuth();
  const [classes, setClasses] = useState<Class[]>([]);
  const [filteredClasses, setFilteredClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPrice, setSelectedPrice] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [processingPayment, setProcessingPayment] = useState<string | null>(null);

  // Modal state: classId + optional default week index
  const [modalState, setModalState] = useState<{ classId: string; weekIndex: number | null } | null>(null);

  // Toast notification state
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'warning' | 'info'; visible: boolean } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info') => {
    setToast({ message, type, visible: true });
    setTimeout(() => {
      setToast(prev => prev ? { ...prev, visible: false } : null);
      setTimeout(() => setToast(null), 300);
    }, 4000);
  };

  useEffect(() => {
    fetchClasses();
  }, [user?.id]);

  useEffect(() => {
    applyFilters();
  }, [classes, searchQuery, selectedPrice, selectedStatus]);

  async function fetchClasses() {
    try {
      setLoading(true);

      const allClasses = await CoursesApi.listActiveCourses() as any[];
      const enrollments = await EnrollmentsApi.getMyEnrollments();

      const enrolledClassIds = new Set(enrollments?.map(e => e.class_id) || []);
      const paidClassIds = new Set();

      const classesWithStatus = allClasses?.map(cls => ({
        ...cls,
        // Always ensure weeks is a proper array regardless of how JSONB was serialised
        weeks: parseWeeks(cls.weeks),
        // Same defensive parse for materials
        materials: Array.isArray(cls.materials)
          ? cls.materials
          : (typeof cls.materials === 'string' ? JSON.parse(cls.materials || '[]') : []),
        is_enrolled: enrolledClassIds.has(cls.id),
        payment_status: cls.is_free ? 'paid' : (paidClassIds.has(cls.id) ? 'paid' : 'unpaid') as 'paid' | 'unpaid',
      })) || [];

      setClasses(classesWithStatus);
    } catch (error) {
      console.error('Error fetching classes:', error);
    } finally {
      setLoading(false);
    }
  }

  function applyFilters() {
    let filtered = classes.filter(cls => cls.is_enrolled);

    if (searchQuery) {
      filtered = filtered.filter(cls =>
        cls.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cls.subject.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (selectedPrice === 'free') {
      filtered = filtered.filter(cls => cls.is_free);
    } else if (selectedPrice === 'paid') {
      filtered = filtered.filter(cls => !cls.is_free);
    }

    if (selectedStatus !== 'all') {
      filtered = filtered.filter(cls => cls.status === selectedStatus);
    }

    setFilteredClasses(filtered);
  }

  async function handlePayment(classItem: Class) {
    setProcessingPayment(classItem.id);

    try {
      // Stub payment resolution completely with backend implementation
      await new Promise(resolve => setTimeout(resolve, 800));
      await EnrollmentsApi.enroll(classItem.id);

      await fetchClasses();
      setProcessingPayment(null);
    } catch (error) {
      console.error('Error initiating payment:', error);
      showToast('Failed to initiate payment. Please try again.', 'error');
      setProcessingPayment(null);
    }
  }



  const canAccessClass = (classItem: Class) => {
    return classItem.is_free || classItem.payment_status === 'paid';
  };

  const activeModal = modalState
    ? filteredClasses.find(c => c.id === modalState.classId) ?? null
    : null;

  const hasActiveFilters = searchQuery || selectedPrice !== 'all' || selectedStatus !== 'all';

  return (
    <div className="min-h-screen bg-[#f0f2f7]">
      <div className="max-w-7xl mx-auto p-4 sm:p-6 md:p-8">

        {/* ── Page header ── */}
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">My Classes</h1>
          <p className="text-sm text-slate-500 mt-1">Your enrolled classes and course materials</p>
        </div>

        {/* ── Filter bar ── */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 mb-6">
          {/* Search row */}
          <div className="p-4 sm:p-5">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Search by class name or subject…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-11 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#eb1b23]/30 focus:border-[#eb1b23] transition"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Filter pills + meta row */}
          <div className="border-t border-slate-100 px-4 sm:px-5 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            {/* Left: pill groups */}
            <div className="flex flex-wrap gap-2">
              {/* Status pills */}
              <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl p-1 gap-0.5">
                {([
                  { value: 'all', label: 'All' },
                  { value: 'active', label: '● Active', activeColor: 'text-emerald-600' },
                  { value: 'completed', label: '● Completed', activeColor: 'text-slate-500' },
                ] as { value: string; label: string; activeColor?: string }[]).map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => setSelectedStatus(opt.value)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 ${
                      selectedStatus === opt.value
                        ? 'bg-white shadow-sm text-slate-800 ring-1 ring-slate-200'
                        : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>

              {/* Price pills */}
              <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl p-1 gap-0.5">
                {([
                  { value: 'all', label: 'Any price' },
                  { value: 'free', label: 'Free' },
                  { value: 'paid', label: 'Paid' },
                ] as { value: string; label: string }[]).map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => setSelectedPrice(opt.value)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 ${
                      selectedPrice === opt.value
                        ? 'bg-white shadow-sm text-slate-800 ring-1 ring-slate-200'
                        : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>

              {/* Clear all (only when filters are active) */}
              {hasActiveFilters && (
                <button
                  onClick={() => { setSearchQuery(''); setSelectedStatus('all'); setSelectedPrice('all'); }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-[#eb1b23] bg-red-50 border border-red-100 hover:bg-red-100 transition"
                >
                  <X className="w-3 h-3" />
                  Clear filters
                </button>
              )}
            </div>

            {/* Right: result count */}
            <p className="text-xs font-semibold text-slate-400 flex-shrink-0">
              {filteredClasses.length} {filteredClasses.length === 1 ? 'class' : 'classes'}
            </p>
          </div>
        </div>

        {/* ── Card grid ── */}
        {loading ? (
          <div className="flex items-center justify-center h-96">
            <div className="relative w-12 h-12">
              <div className="absolute inset-0 rounded-full border-4 border-red-100"></div>
              <div className="absolute inset-0 rounded-full border-4 border-[#eb1b23] border-t-transparent animate-spin"></div>
            </div>
          </div>
        ) : filteredClasses.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm p-16 text-center border border-slate-100">
            <BookOpen className="w-16 h-16 text-slate-200 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-700 mb-1">No classes found</h3>
            <p className="text-sm text-slate-400">Try adjusting your filters or enroll in more classes</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredClasses.map(cls => (
              <ClassCard
                key={cls.id}
                cls={cls}
                canAccess={canAccessClass(cls)}
                processingPayment={processingPayment}
                onOpenWeek={(weekIndex) => setModalState({ classId: cls.id, weekIndex })}
                onPayment={() => handlePayment(cls)}
              />
            ))}
          </div>
        )}

        {/* ── Materials Modal ── */}
        {activeModal && (
          <MaterialsModal
            classItem={activeModal}
            defaultWeekIndex={modalState!.weekIndex}
            onClose={() => setModalState(null)}
          />
        )}

        {/* Toast Notification */}
        {toast && (
          <div className={`fixed bottom-6 right-6 z-[100] transition-all duration-300 transform ${
            toast.visible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
          }`}>
            <div className={`flex items-center gap-3 px-5 py-4 rounded-xl shadow-2xl border-l-4 min-w-[320px] max-w-[480px] ${
              toast.type === 'success' ? 'bg-white border-green-500 text-slate-800' :
              toast.type === 'error' ? 'bg-white border-red-500 text-slate-800' :
              toast.type === 'warning' ? 'bg-white border-amber-500 text-slate-800' :
              'bg-white border-blue-500 text-slate-800'
            }`}>
              <div className={`p-2 rounded-lg ${
                toast.type === 'success' ? 'bg-green-100' :
                toast.type === 'error' ? 'bg-red-100' :
                toast.type === 'warning' ? 'bg-amber-100' :
                'bg-blue-100'
              }`}>
                {toast.type === 'success' ? <Check className="w-5 h-5 text-green-600" /> :
                 toast.type === 'error' ? <AlertTriangle className="w-5 h-5 text-red-600" /> :
                 toast.type === 'warning' ? <AlertTriangle className="w-5 h-5 text-amber-600" /> :
                 <Info className="w-5 h-5 text-blue-600" />}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">{toast.message}</p>
              </div>
              <button
                onClick={() => setToast(prev => prev ? { ...prev, visible: false } : null)}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── MaterialsModal ─────────────────────────────────────
function MaterialsModal({
  classItem,
  defaultWeekIndex,
  onClose,
}: {
  classItem: Class;
  defaultWeekIndex: number | null;
  onClose: () => void;
}) {
  const materials = classItem.materials || [];
  const weeks = classItem.weeks || [];

  // Ref to the scrollable body div
  const scrollBodyRef = useRef<HTMLDivElement | null>(null);
  // Refs to each week section header
  const weekRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    if (defaultWeekIndex === null || !weekRefs.current[defaultWeekIndex]) return;
    // Use a small delay so the modal has rendered and measured heights
    const timer = setTimeout(() => {
      const target = weekRefs.current[defaultWeekIndex];
      const container = scrollBodyRef.current;
      if (target && container) {
        const containerTop = container.getBoundingClientRect().top;
        const targetTop   = target.getBoundingClientRect().top;
        container.scrollBy({ top: targetTop - containerTop - 16, behavior: 'smooth' });
      }
    }, 200);
    return () => clearTimeout(timer);
  }, [defaultWeekIndex]);

  const groupedMaterials = materials.reduce((acc, material) => {
    const weekName = (material as any).week || 'General Materials';
    if (!acc[weekName]) {
      acc[weekName] = [];
    }
    acc[weekName].push(material);
    return acc;
  }, {} as Record<string, Material[]>);

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[85vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#eb1b23] to-red-700 p-6 flex items-center justify-between flex-shrink-0">
          <div>
            <h2 className="text-2xl font-bold text-white mb-1">{classItem.title}</h2>
            <p className="text-red-100">
              {defaultWeekIndex !== null && weeks[defaultWeekIndex]
                ? `Jumping to: ${weeks[defaultWeekIndex].title || `Week ${defaultWeekIndex + 1}`}`
                : 'Course Content & Materials'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-lg transition"
          >
            <X className="w-6 h-6 text-white" />
          </button>
        </div>

        {/* Week quick-nav pills (if multiple weeks) */}
        {weeks.length > 1 && (
          <div className="flex gap-2 px-6 py-3 bg-gray-50 border-b border-gray-100 overflow-x-auto flex-shrink-0">
            {weeks.map((week: any, idx: number) => (
              <button
                key={week.id || idx}
                onClick={() => {
                  const target = weekRefs.current[idx];
                  const container = scrollBodyRef.current;
                  if (target && container) {
                    const containerTop = container.getBoundingClientRect().top;
                    const targetTop   = target.getBoundingClientRect().top;
                    container.scrollBy({ top: targetTop - containerTop - 16, behavior: 'smooth' });
                  }
                }}
                className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                  defaultWeekIndex === idx
                    ? 'bg-[#eb1b23] text-white shadow-md'
                    : 'bg-white text-gray-600 border border-gray-200 hover:border-[#eb1b23] hover:text-[#eb1b23]'
                }`}
              >
                W{idx + 1} · {week.title?.substring(0, 18) || `Week ${idx + 1}`}
              </button>
            ))}
          </div>
        )}

        {/* Body */}
        <div ref={scrollBodyRef} className="p-6 overflow-y-auto flex-1 bg-gray-50">
          {weeks.length > 0 ? (
            <div className="space-y-6">
              {weeks.map((week: any, idx: number) => (
                <div
                  key={week.id || idx}
                  ref={el => { weekRefs.current[idx] = el; }}
                  className={`bg-white rounded-2xl shadow-sm border overflow-hidden transition-all ${
                    defaultWeekIndex === idx ? 'border-[#eb1b23]/40 ring-2 ring-[#eb1b23]/20' : 'border-gray-200'
                  }`}
                >
                  <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-[#eb1b23]/10 flex items-center justify-center text-[#eb1b23] font-bold">
                        {idx + 1}
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-gray-900">{week.title}</h3>
                        {week.description && <p className="text-sm text-gray-500">{week.description}</p>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {week.zoom_link && (
                        <a
                          href={week.zoom_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-sm font-semibold hover:bg-blue-100 transition border border-blue-100"
                        >
                          <Video className="w-4 h-4" />
                          Join Zoom
                        </a>
                      )}
                    </div>
                  </div>

                  <div className="p-4 space-y-4">
                    {week.recordings?.length > 0 && (
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Video Recordings</label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {week.recordings.map((rec: string, rIdx: number) => (
                            <a
                              key={rIdx}
                              href={rec}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-3 p-3 bg-red-50 text-[#eb1b23] rounded-xl hover:bg-red-100 transition border border-red-100 group"
                            >
                              <PlayCircle className="w-5 h-5 flex-shrink-0" />
                              <div className="min-w-0">
                                <p className="text-xs font-bold truncate">Part {rIdx + 1}</p>
                                <p className="text-[10px] opacity-70 truncate">Watch Recording</p>
                              </div>
                            </a>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Documents & Materials</label>
                      <div className="space-y-2">
                        {week.materials?.length > 0 ? (
                          week.materials.map((mat: any, mIdx: number) => (
                            <div key={mIdx} className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 transition border border-transparent hover:border-gray-100 bg-white shadow-sm">
                              <div className="flex items-center gap-3">
                                {mat.type === 'pdf' ? (
                                  <FileIcon className="w-5 h-5 text-red-500" />
                                ) : (
                                  <Video className="w-5 h-5 text-blue-500" />
                                )}
                                <span className="font-medium text-gray-700 text-sm">{mat.name}</span>
                              </div>
                              <a
                                href={mat.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-2 text-[#eb1b23] hover:bg-red-50 rounded-lg transition"
                              >
                                <Download className="w-5 h-5" />
                              </a>
                            </div>
                          ))
                        ) : (
                          <p className="text-sm text-gray-400 italic text-center py-2 bg-white rounded-xl border border-dashed border-gray-200">No documents for this module</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : materials.length > 0 ? (
            <div className="space-y-6">
              {Object.entries(groupedMaterials).map(([weekName, weekMaterials]) => (
                <div key={weekName} className="bg-white rounded-xl p-5 border border-gray-200">
                  <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-teal-600" />
                    {weekName}
                  </h3>
                  <div className="space-y-3">
                    {weekMaterials.map((material, mIdx) => (
                      <div
                        key={mIdx}
                        className="bg-gray-50 rounded-lg p-4 flex items-center justify-between hover:shadow-md transition group"
                      >
                        <div className="flex items-center gap-3 flex-1">
                          {material.type === 'pdf' ? (
                            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                              <FileText className="w-5 h-5 text-red-600" />
                            </div>
                          ) : (
                            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                              <Play className="w-5 h-5 text-blue-600" />
                            </div>
                          )}
                          <div>
                            <p className="font-semibold text-gray-900 group-hover:text-[#eb1b23] transition">
                              {(material as any).name || (material as any).topic}
                            </p>
                            <p className="text-sm text-gray-500 capitalize">{material.type}</p>
                          </div>
                        </div>
                        <a
                          href={material.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition font-medium"
                        >
                          <Download className="w-4 h-4" />
                          Download
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-20">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText className="w-10 h-10 text-gray-300" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">No content yet</h3>
              <p className="text-gray-500">Your teacher hasn't uploaded any materials for this class.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
