import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../lib/database';
import { payHereService } from '../../lib/payhere';
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
  Info,
  Loader,
  AlertCircle,
  CheckCircle,
  LayoutGrid,
  List,
  ChevronDown,
} from 'lucide-react';

interface Class {
  id: string;
  title: string;
  description: string;
  subject: string;
  schedule: string;
  price: number;
  is_free: boolean;
  status: 'active' | 'completed';
  zoom_link: string;
  next_session_date: string;
  materials: Material[];
  teacher: {
    id: string;
    profile: {
      full_name: string;
      avatar_url?: string;
    };
  };
  is_enrolled?: boolean;
}

interface Material {
  id: string;
  week: string;
  topic: string;
  type: 'pdf' | 'video';
  url: string;
  name: string;
}

interface Teacher {
  id: string;
  name: string;
}

// Subject → gradient + decorative SVG pattern
const SUBJECT_THEMES: Record<string, { gradient: string; emoji: string }> = {
  Physics:     { gradient: 'from-[#1a3a3a] to-[#2d6b5e]', emoji: '⚛' },
  Mathematics: { gradient: 'from-[#1a2f3a] to-[#1e5c6b]', emoji: '∑' },
  Chemistry:   { gradient: 'from-[#1a3a2a] to-[#256b4a]', emoji: '⚗' },
  Biology:     { gradient: 'from-[#1a3a1a] to-[#3a6b2a]', emoji: '🧬' },
  English:     { gradient: 'from-[#2a1a3a] to-[#5a2d6b]', emoji: '📖' },
  History:     { gradient: 'from-[#3a2a1a] to-[#6b4a1e]', emoji: '🏛' },
  ICT:         { gradient: 'from-[#1a243a] to-[#1e426b]', emoji: '💻' },
};

function getSubjectTheme(subject: string) {
  const match = Object.keys(SUBJECT_THEMES).find(k =>
    subject?.toLowerCase().includes(k.toLowerCase())
  );
  return match ? SUBJECT_THEMES[match] : { gradient: 'from-[#1a3a3a] to-[#2d6b5e]', emoji: '📚' };
}

// Simple avatar initials fallback
function AvatarFallback({ name, size = 32 }: { name: string; size?: number }) {
  const initials = name
    .split(' ')
    .map(n => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <div
      style={{ width: size, height: size, fontSize: size * 0.4 }}
      className="rounded-full bg-gradient-to-br from-teal-400 to-emerald-600 text-white flex items-center justify-center font-bold flex-shrink-0"
    >
      {initials}
    </div>
  );
}

export default function BrowseClasses() {
  const { profile } = useAuth();
  const [classes, setClasses] = useState<Class[]>([]);
  const [filteredClasses, setFilteredClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubject, setSelectedSubject] = useState('all');
  const [selectedTeacher, setSelectedTeacher] = useState('all');
  const [selectedPrice, setSelectedPrice] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [subjects, setSubjects] = useState<string[]>([]);
  const [enrollingClassId, setEnrollingClassId] = useState<string | null>(null);
  const [processingPayment, setProcessingPayment] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    fetchClasses();
  }, [profile?.id]);

  useEffect(() => {
    applyFilters();
  }, [classes, selectedSubject, selectedTeacher, selectedPrice]);

  async function fetchClasses() {
    try {
      setLoading(true);

      const { data: allClasses, error } = await db
        .from<any>('classes')
        .select(`
          id,
          title,
          description,
          subject,
          schedule,
          price,
          is_free,
          status,
          zoom_link,
          next_session_date,
          materials,
          teacher:teachers(
            id,
            profile:profiles(
              full_name,
              avatar_url
            )
          )
        `)
        .eq('is_active', true)
        .order('next_session_date', { ascending: true })
        .execute();

      if (error) throw error;

      const { data: enrollments } = await db
        .from<any>('enrollments')
        .select('class_id')
        .eq('student_id', profile?.id)
        .eq('is_active', true)
        .execute();

      const enrolledClassIds = new Set(enrollments?.map(e => e.class_id) || []);

      const classesWithStatus = allClasses?.map(cls => ({
        ...cls,
        is_enrolled: enrolledClassIds.has(cls.id)
      })) || [];

      setClasses(classesWithStatus);

      // Extract unique subjects
      const uniqueSubjects = Array.from(
        new Set(allClasses?.map(cls => cls.subject).filter(Boolean))
      ).sort() as string[];
      setSubjects(uniqueSubjects);

      const uniqueTeachers = Array.from(
        new Map(
          allClasses
            ?.filter(cls => cls.teacher?.profile?.full_name)
            .map(cls => [
              cls.teacher.id,
              { id: cls.teacher.id, name: cls.teacher.profile.full_name }
            ])
        ).values()
      ).sort((a, b) => a.name.localeCompare(b.name));

      setTeachers(uniqueTeachers);
    } catch (error) {
      console.error('Error fetching classes:', error);
      setErrorMessage('Failed to load classes');
    } finally {
      setLoading(false);
    }
  }

  function applyFilters() {
    let filtered = classes.filter(cls => !cls.is_enrolled && cls.status === 'active');

    if (selectedSubject !== 'all') {
      filtered = filtered.filter(cls => cls.subject === selectedSubject);
    }

    if (selectedTeacher !== 'all') {
      filtered = filtered.filter(cls => cls.teacher?.id === selectedTeacher);
    }

    if (selectedPrice === 'free') {
      filtered = filtered.filter(cls => cls.is_free);
    } else if (selectedPrice === 'paid') {
      filtered = filtered.filter(cls => !cls.is_free);
    }

    setFilteredClasses(filtered);
  }

  async function handleEnrollFree(classItem: Class) {
    setEnrollingClassId(classItem.id);
    try {
      const { error } = await db
        .from<any>('enrollments')
        .insert({
          student_id: profile?.id,
          class_id: classItem.id,
          is_active: true
        })
        .execute();

      if (error) throw error;

      setSuccessMessage(`Successfully enrolled in "${classItem.title}"!`);
      await fetchClasses();
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error) {
      console.error('Error enrolling in class:', error);
      setErrorMessage('Failed to enroll. Please try again.');
      setTimeout(() => setErrorMessage(null), 3000);
    } finally {
      setEnrollingClassId(null);
    }
  }

  async function handleEnrollPaid(classItem: Class) {
    setProcessingPayment(classItem.id);

    try {
      const { data: dbPaymentData, error: paymentError } = await db
        .from<any>('class_payments')
        .insert({
          student_id: profile?.id,
          class_id: classItem.id,
          amount: classItem.price,
          payment_status: 'pending',
          payment_method: 'payhere',
        })
        .select()
        .execute();

      const payment = dbPaymentData?.[0];

      if (paymentError || !payment) throw paymentError || new Error('Failed to create payment');

      if (!payHereService.isPayHereLoaded()) {
        alert('Payment gateway is loading. Please try again in a moment.');
        setProcessingPayment(null);
        return;
      }

      const nameParts = profile?.full_name?.split(' ') || ['Student'];
      const firstName = nameParts[0] || 'Student';
      const lastName = nameParts.slice(1).join(' ') || '';

      const paymentData = payHereService.createPaymentData({
        orderId: payment.id,
        items: classItem.title,
        amount: classItem.price,
        firstName,
        lastName,
        email: profile?.email || '',
        phone: profile?.phone || '',
        city: 'Colombo',
        country: 'Sri Lanka',
        address: '',
      });

      await payHereService.initiatePayment(paymentData, {
        onCompleted: async (orderId: string) => {
          await db
            .from<any>('class_payments')
            .update({
              payment_status: 'completed',
              payment_reference: orderId,
              paid_at: new Date().toISOString(),
            })
            .eq('id', payment.id)
            .execute();

          await db
            .from<any>('enrollments')
            .insert({
              student_id: profile?.id,
              class_id: classItem.id,
              is_active: true
            })
            .execute();

          setSuccessMessage(`Payment successful! Enrolled in "${classItem.title}"`);
          await fetchClasses();
          setTimeout(() => setSuccessMessage(null), 3000);
          setProcessingPayment(null);
        },
        onDismissed: () => {
          setProcessingPayment(null);
        },
        onError: async (error: any) => {
          console.error('Payment error:', error);
          await db
            .from<any>('class_payments')
            .update({ payment_status: 'failed' })
            .eq('id', payment.id)
            .execute();

          setErrorMessage('Payment failed. Please try again.');
          setTimeout(() => setErrorMessage(null), 3000);
          setProcessingPayment(null);
        },
      });
    } catch (error) {
      console.error('Error initiating payment:', error);
      setErrorMessage('Failed to process enrollment. Please try again.');
      setTimeout(() => setErrorMessage(null), 3000);
      setProcessingPayment(null);
    }
  }

  const isProcessing = (id: string) =>
    enrollingClassId === id || processingPayment === id;

  return (
    <div style={{ minHeight: '100vh', background: '#f5f6fa' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '40px 24px' }}>

        {/* Header */}
        <div style={{ marginBottom: 32 }}>
          <div style={{
            display: 'inline-block',
            background: 'rgba(235,27,35,0.10)',
            color: '#eb1b23',
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: '0.12em',
            padding: '5px 14px',
            borderRadius: 20,
            marginBottom: 14,
            border: '1px solid rgba(235,27,35,0.18)',
          }}>
            DISCOVERY PORTAL
          </div>
          <h1 style={{
            fontSize: 36,
            fontWeight: 800,
            color: '#111827',
            marginBottom: 8,
            lineHeight: 1.15,
          }}>
            Browse Classes
          </h1>
          <p style={{ color: '#6b7280', fontSize: 15, maxWidth: 540, lineHeight: 1.6 }}>
            Explore our curated selection of high-performance academic courses. Designed for excellence, led by industry experts.
          </p>
        </div>

        {/* Alert Messages */}
        {successMessage && (
          <div style={{
            marginBottom: 20,
            background: '#f0fdf4',
            border: '1px solid #bbf7d0',
            borderRadius: 12,
            padding: '14px 18px',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
          }}>
            <CheckCircle size={18} color="#16a34a" />
            <p style={{ color: '#15803d', fontSize: 14 }}>{successMessage}</p>
          </div>
        )}

        {errorMessage && (
          <div style={{
            marginBottom: 20,
            background: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: 12,
            padding: '14px 18px',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
          }}>
            <AlertCircle size={18} color="#dc2626" />
            <p style={{ color: '#b91c1c', fontSize: 14 }}>{errorMessage}</p>
          </div>
        )}

        {/* Filter Bar */}
        <div style={{
          background: '#fff',
          borderRadius: 16,
          boxShadow: '0 1px 4px rgba(0,0,0,0.07)',
          border: '1px solid #e5e7eb',
          padding: '18px 22px',
          marginBottom: 32,
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          flexWrap: 'wrap',
        }}>
          {/* Subject */}
          <FilterSelect
            label="SUBJECT"
            value={selectedSubject}
            onChange={setSelectedSubject}
          >
            <option value="all">All Subjects</option>
            {subjects.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </FilterSelect>

          <div style={{ width: 1, height: 36, background: '#e5e7eb' }} />

          {/* Teacher */}
          <FilterSelect
            label="TEACHER"
            value={selectedTeacher}
            onChange={setSelectedTeacher}
          >
            <option value="all">All Tutors</option>
            {teachers.map(t => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </FilterSelect>

          <div style={{ width: 1, height: 36, background: '#e5e7eb' }} />

          {/* Price */}
          <FilterSelect
            label="PRICE"
            value={selectedPrice}
            onChange={setSelectedPrice}
          >
            <option value="all">Any Price</option>
            <option value="free">Free</option>
            <option value="paid">Paid</option>
          </FilterSelect>

          {/* Spacer */}
          <div style={{ flex: 1 }} />

          {/* View Toggle */}
          <div style={{
            display: 'flex',
            gap: 4,
            background: '#f3f4f6',
            borderRadius: 10,
            padding: 4,
          }}>
            <button
              onClick={() => setViewMode('grid')}
              style={{
                padding: '6px 10px',
                borderRadius: 7,
                border: 'none',
                cursor: 'pointer',
                background: viewMode === 'grid' ? '#fff' : 'transparent',
                boxShadow: viewMode === 'grid' ? '0 1px 4px rgba(0,0,0,0.10)' : 'none',
                color: viewMode === 'grid' ? '#eb1b23' : '#9ca3af',
                transition: 'all 0.15s',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <LayoutGrid size={18} />
            </button>
            <button
              onClick={() => setViewMode('list')}
              style={{
                padding: '6px 10px',
                borderRadius: 7,
                border: 'none',
                cursor: 'pointer',
                background: viewMode === 'list' ? '#fff' : 'transparent',
                boxShadow: viewMode === 'list' ? '0 1px 4px rgba(0,0,0,0.10)' : 'none',
                color: viewMode === 'list' ? '#eb1b23' : '#9ca3af',
                transition: 'all 0.15s',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <List size={18} />
            </button>
          </div>
        </div>

        {/* Classes Grid / List */}
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 320 }}>
            <div style={{
              width: 48, height: 48, borderRadius: '50%',
              border: '4px solid #eb1b23', borderTopColor: 'transparent',
              animation: 'spin 0.8s linear infinite',
            }} />
          </div>
        ) : filteredClasses.length === 0 ? (
          <div style={{
            background: '#fff',
            borderRadius: 20,
            border: '1px solid #e5e7eb',
            padding: '80px 24px',
            textAlign: 'center',
          }}>
            <BookOpen size={64} color="#d1d5db" style={{ margin: '0 auto 20px' }} />
            <h3 style={{ fontSize: 22, fontWeight: 700, color: '#111827', marginBottom: 8 }}>No classes available</h3>
            <p style={{ color: '#6b7280', fontSize: 15 }}>Try adjusting your filters to find more classes</p>
          </div>
        ) : viewMode === 'grid' ? (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: 24,
          }}>
            {filteredClasses.map(cls => (
              <ClassCard
                key={cls.id}
                classItem={cls}
                processing={isProcessing(cls.id)}
                processingPayment={processingPayment === cls.id}
                onEnroll={() => cls.is_free ? handleEnrollFree(cls) : handleEnrollPaid(cls)}
              />
            ))}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {filteredClasses.map(cls => (
              <ClassListRow
                key={cls.id}
                classItem={cls}
                processing={isProcessing(cls.id)}
                processingPayment={processingPayment === cls.id}
                onEnroll={() => cls.is_free ? handleEnrollFree(cls) : handleEnrollPaid(cls)}
              />
            ))}
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .browse-card { transition: transform 0.22s ease, box-shadow 0.22s ease; }
        .browse-card:hover { transform: translateY(-4px); box-shadow: 0 16px 40px rgba(0,0,0,0.13) !important; }
        .enroll-btn:hover:not(:disabled) { opacity: 0.88; transform: translateY(-1px); }
        .enroll-btn:active:not(:disabled) { transform: translateY(0); }
      `}</style>
    </div>
  );
}

/* ─── Sub-components ──────────────────────────────────────────────── */

function FilterSelect({
  label, value, onChange, children,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  children: React.ReactNode;
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, position: 'relative' }}>
      <span style={{
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: '0.1em',
        color: '#9ca3af',
        whiteSpace: 'nowrap',
      }}>
        {label}:
      </span>
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
        <select
          value={value}
          onChange={e => onChange(e.target.value)}
          style={{
            appearance: 'none',
            WebkitAppearance: 'none',
            background: 'transparent',
            border: 'none',
            outline: 'none',
            fontSize: 14,
            fontWeight: 500,
            color: '#374151',
            paddingRight: 22,
            cursor: 'pointer',
          }}
        >
          {children}
        </select>
        <ChevronDown size={14} color="#9ca3af" style={{ position: 'absolute', right: 0, pointerEvents: 'none' }} />
      </div>
    </div>
  );
}

function ClassCard({
  classItem, processing, processingPayment, onEnroll,
}: {
  classItem: Class;
  processing: boolean;
  processingPayment: boolean;
  onEnroll: () => void;
}) {
  const theme = getSubjectTheme(classItem.subject);
  const teacherName = classItem.teacher?.profile?.full_name || 'Unknown';
  const avatarUrl = classItem.teacher?.profile?.avatar_url;

  return (
    <div
      className="browse-card"
      style={{
        background: '#fff',
        borderRadius: 18,
        overflow: 'hidden',
        boxShadow: '0 2px 12px rgba(0,0,0,0.07)',
        border: '1px solid #e5e7eb',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Thumbnail */}
      <div style={{
        background: `linear-gradient(135deg, var(--g1), var(--g2))`,
        backgroundImage: `linear-gradient(135deg, ${theme.gradient.replace('from-', '').replace('to-', '').split(' ').map(c => c.replace('[', '').replace(']', '')).join(', ')})`,
        height: 160,
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
      }}
        className={`bg-gradient-to-br ${theme.gradient}`}
      >
        {/* Decorative pattern */}
        <div style={{
          position: 'absolute', inset: 0, opacity: 0.07,
          backgroundImage: 'repeating-linear-gradient(45deg, #fff 0, #fff 1px, transparent 0, transparent 50%)',
          backgroundSize: '12px 12px',
        }} />

        {/* Subject emoji / icon */}
        <span style={{ fontSize: 52, opacity: 0.35, userSelect: 'none', zIndex: 1 }}>
          {theme.emoji}
        </span>

        {/* Subject tag (bottom-left) */}
        <div style={{
          position: 'absolute',
          bottom: 12,
          left: 12,
          background: 'rgba(0,0,0,0.45)',
          color: '#fff',
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: '0.1em',
          padding: '4px 10px',
          borderRadius: 6,
          backdropFilter: 'blur(4px)',
        }}>
          {classItem.subject?.toUpperCase()}
        </div>

        {/* Price badge (top-left) */}
        <div style={{
          position: 'absolute',
          top: 12,
          left: 12,
          background: classItem.is_free ? 'rgba(16,185,129,0.9)' : 'rgba(30,30,30,0.8)',
          color: '#fff',
          fontSize: 11,
          fontWeight: 700,
          padding: '4px 10px',
          borderRadius: 20,
          backdropFilter: 'blur(4px)',
        }}>
          {classItem.is_free ? 'FREE' : `LKR ${classItem.price.toLocaleString()}`}
        </div>
      </div>

      {/* Body */}
      <div style={{ padding: '18px 18px 0', flex: 1 }}>
        <h3 style={{
          fontSize: 17,
          fontWeight: 700,
          color: '#111827',
          marginBottom: 12,
          lineHeight: 1.3,
        }}>
          {classItem.title}
        </h3>

        {/* Teacher row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {avatarUrl ? (
            <img src={avatarUrl} alt={teacherName} style={{ width: 30, height: 30, borderRadius: '50%', objectFit: 'cover', border: '2px solid #e5e7eb', flexShrink: 0 }} />
          ) : (
            <AvatarFallback name={teacherName} size={30} />
          )}
          <span style={{ fontSize: 13, color: '#6b7280', fontWeight: 500 }}>{teacherName}</span>
        </div>
      </div>

      {/* Enroll Button */}
      <div style={{ padding: '16px 18px 18px' }}>
        <button
          className="enroll-btn"
          onClick={onEnroll}
          disabled={processing}
          style={{
            width: '100%',
            padding: '12px',
            borderRadius: 10,
            border: 'none',
            cursor: processing ? 'not-allowed' : 'pointer',
            background: processing ? '#f3f4f6' : '#eb1b23',
            color: processing ? '#9ca3af' : '#fff',
            fontSize: 14,
            fontWeight: 700,
            letterSpacing: '0.02em',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            transition: 'all 0.18s ease',
          }}
        >
          {processing ? (
            <>
              <Loader size={15} style={{ animation: 'spin 0.8s linear infinite' }} />
              {processingPayment ? 'Processing...' : 'Enrolling...'}
            </>
          ) : (
            'Enroll Now'
          )}
        </button>
      </div>
    </div>
  );
}

function ClassListRow({
  classItem, processing, processingPayment, onEnroll,
}: {
  classItem: Class;
  processing: boolean;
  processingPayment: boolean;
  onEnroll: () => void;
}) {
  const theme = getSubjectTheme(classItem.subject);
  const teacherName = classItem.teacher?.profile?.full_name || 'Unknown';
  const avatarUrl = classItem.teacher?.profile?.avatar_url;

  return (
    <div
      className="browse-card"
      style={{
        background: '#fff',
        borderRadius: 16,
        overflow: 'hidden',
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
        border: '1px solid #e5e7eb',
        display: 'flex',
        alignItems: 'stretch',
      }}
    >
      {/* Thumbnail strip */}
      <div
        className={`bg-gradient-to-br ${theme.gradient}`}
        style={{ width: 100, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}
      >
        <div style={{ position: 'absolute', inset: 0, opacity: 0.07, backgroundImage: 'repeating-linear-gradient(45deg,#fff 0,#fff 1px,transparent 0,transparent 50%)', backgroundSize: '12px 12px' }} />
        <span style={{ fontSize: 32, opacity: 0.4 }}>{theme.emoji}</span>
      </div>

      {/* Content */}
      <div style={{ flex: 1, padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 180 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', color: '#6b7280', background: '#f3f4f6', padding: '2px 8px', borderRadius: 4 }}>
              {classItem.subject?.toUpperCase()}
            </span>
            <span style={{
              fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 10,
              background: classItem.is_free ? 'rgba(16,185,129,0.12)' : 'rgba(235,27,35,0.10)',
              color: classItem.is_free ? '#059669' : '#eb1b23',
            }}>
              {classItem.is_free ? 'FREE' : `LKR ${classItem.price.toLocaleString()}`}
            </span>
          </div>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: '#111827', marginBottom: 6, lineHeight: 1.3 }}>{classItem.title}</h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {avatarUrl ? (
              <img src={avatarUrl} alt={teacherName} style={{ width: 22, height: 22, borderRadius: '50%', objectFit: 'cover', border: '2px solid #e5e7eb' }} />
            ) : (
              <AvatarFallback name={teacherName} size={22} />
            )}
            <span style={{ fontSize: 12, color: '#6b7280' }}>{teacherName}</span>
          </div>
        </div>

        {/* Enroll button */}
        <button
          className="enroll-btn"
          onClick={onEnroll}
          disabled={processing}
          style={{
            padding: '10px 28px',
            borderRadius: 10,
            border: 'none',
            cursor: processing ? 'not-allowed' : 'pointer',
            background: processing ? '#f3f4f6' : '#eb1b23',
            color: processing ? '#9ca3af' : '#fff',
            fontSize: 13,
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            transition: 'all 0.18s ease',
            whiteSpace: 'nowrap',
          }}
        >
          {processing ? (
            <>
              <Loader size={14} style={{ animation: 'spin 0.8s linear infinite' }} />
              {processingPayment ? 'Processing...' : 'Enrolling...'}
            </>
          ) : (
            'Enroll Now'
          )}
        </button>
      </div>
    </div>
  );
}
