import { Calendar, Clock, FileText, ChevronRight, Users, Search, FileType2, Zap, History } from 'lucide-react';
import type { Exam } from './types';

interface ExamListProps {
  exams: Exam[];
  loading: boolean;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  filterStatus: string;
  setFilterStatus: (s: string) => void;
  onExamClick: (exam: Exam) => void;
  onCreateClick: () => void;
}

function getStatus(exam: Exam): 'active' | 'upcoming' | 'past' {
  const now = new Date();
  const start = new Date(exam.start_time);
  const end = new Date(exam.end_time);
  if (start <= now && end >= now) return 'active';
  if (start > now) return 'upcoming';
  return 'past';
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}
function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}

const STATUS = {
  active:   { label: 'Active Now', dot: 'bg-green-500', badge: 'bg-green-100 text-green-700 border-green-200', icon: Zap },
  upcoming: { label: 'Upcoming',   dot: 'bg-blue-500',  badge: 'bg-blue-100 text-blue-700 border-blue-200',   icon: Clock },
  past:     { label: 'Ended',      dot: 'bg-gray-400',  badge: 'bg-gray-100 text-gray-600 border-gray-200',   icon: History },
};

const TABS = [
  { key: 'all',      label: 'All' },
  { key: 'active',   label: 'Active' },
  { key: 'upcoming', label: 'Upcoming' },
  { key: 'past',     label: 'Past' },
];

export function ExamList({
  exams, loading, searchQuery, setSearchQuery,
  filterStatus, setFilterStatus, onExamClick,
}: ExamListProps) {

  const counts = {
    all: exams.length,
    active: exams.filter(e => getStatus(e) === 'active').length,
    upcoming: exams.filter(e => getStatus(e) === 'upcoming').length,
    past: exams.filter(e => getStatus(e) === 'past').length,
  };

  const filtered = exams.filter(exam => {
    const matchSearch = !searchQuery || exam.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (exam.class_title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (exam.subject || '').toLowerCase().includes(searchQuery.toLowerCase());
    const status = getStatus(exam);
    const matchFilter = filterStatus === 'all' || status === filterStatus;
    return matchSearch && matchFilter;
  });

  // Sort: active first, upcoming second, past last; within group by start_time
  const sorted = [...filtered].sort((a, b) => {
    const order = { active: 0, upcoming: 1, past: 2 };
    const sa = getStatus(a), sb = getStatus(b);
    if (order[sa] !== order[sb]) return order[sa] - order[sb];
    return new Date(a.start_time).getTime() - new Date(b.start_time).getTime();
  });

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col h-full min-h-0">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 flex-shrink-0">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Exams & Assessments</h2>
          <p className="text-xs text-gray-500 mt-0.5">{exams.length} total · {counts.active} active</p>
        </div>
      </div>

      {/* Filter tabs + search */}
      <div className="flex items-center gap-3 px-6 py-3 border-b border-gray-100 flex-shrink-0 flex-wrap">
        <div className="flex items-center bg-gray-100 rounded-xl p-1 gap-0.5">
          {TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => setFilterStatus(tab.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                filterStatus === tab.key
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
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
            placeholder="Search exams…"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#eb1b23]/20 focus:border-[#eb1b23]"
          />
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-2 border-[#eb1b23] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : sorted.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3">
              <FileText className="w-6 h-6 text-gray-400" />
            </div>
            <p className="text-sm font-medium text-gray-700">No exams found</p>
            <p className="text-xs text-gray-400 mt-1">Create your first exam using the form</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {sorted.map(exam => {
              const status = getStatus(exam);
              const cfg = STATUS[status];

              return (
                <button
                  key={exam.id}
                  onClick={() => onExamClick(exam)}
                  className="w-full text-left px-6 py-4 hover:bg-gray-50 transition-colors group flex items-center gap-4"
                >
                  {/* Icon */}
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    status === 'active' ? 'bg-green-50' : status === 'upcoming' ? 'bg-blue-50' : 'bg-gray-100'
                  }`}>
                    <FileType2 className={`w-5 h-5 ${
                      status === 'active' ? 'text-green-600' : status === 'upcoming' ? 'text-blue-600' : 'text-gray-500'
                    }`} />
                  </div>

                  {/* Title + class */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-sm text-gray-900 truncate group-hover:text-[#eb1b23] transition-colors">
                        {exam.title}
                      </span>
                      <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${cfg.badge} flex-shrink-0`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                        {cfg.label}
                      </span>
                      {exam.subject && (
                        <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-red-50 text-[#eb1b23] border border-red-100 flex-shrink-0">
                          {exam.subject}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-1 flex-wrap">
                      {exam.class_title && (
                        <span className="text-xs text-gray-500 truncate">{exam.class_title}</span>
                      )}
                      <span className="flex items-center gap-1 text-xs text-gray-400">
                        <Calendar className="w-3 h-3" />
                        {formatDate(exam.start_time)} · {formatTime(exam.start_time)}
                      </span>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="hidden sm:flex items-center gap-5 flex-shrink-0 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {exam.duration_minutes}m
                    </span>
                    <span className="flex items-center gap-1">
                      <FileText className="w-3.5 h-3.5" />
                      {exam.total_marks} marks
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="w-3.5 h-3.5" />
                      {exam.submission_count ?? 0}
                    </span>
                  </div>

                  <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-[#eb1b23] flex-shrink-0 transition-colors" />
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
