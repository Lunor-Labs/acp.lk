import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
  ExamsApi,
  type Exam,
  type ExamQuestion,
  type ExamAttempt,
  type ExamReviewResponse,
} from '@/features/exams/api';
import {
  FileText, Clock, Trophy, Award, Calendar, PlayCircle,
  AlertCircle, Save, Check, AlertTriangle, Info, X,
  FileQuestion, CheckCircle2, BookOpen,
} from 'lucide-react';

// ── Local state types ──────────────────────────────────────────────────────────
interface ActiveExam {
  exam: Exam;
  currentQuestion: number;
  answers: Record<number, string | number>;
  startTime: Date;
  isPdf: boolean;
  pdfUrl?: string | null;
  questions?: ExamQuestion[];
  isReviewing?: boolean;
  isSubmitting?: boolean;
  pdfView?: 'paper' | 'answers';
}

interface ReviewingResultData {
  attempt: ExamAttempt & { exam: Exam };
  isPdf: boolean;
  pdfUrl?: string | null;
  questions?: ExamQuestion[];
  pdfAnswers?: { question_no: number; correct_answer: number }[];
}

type Toast = { message: string; type: 'success' | 'error' | 'warning' | 'info'; visible: boolean };

// ── Helpers ────────────────────────────────────────────────────────────────────
function SubjectIcon({ subject, className = '' }: { subject: string; className?: string }) {
  const s = subject.toLowerCase();
  const cls = s.includes('physics')   ? 'bg-red-50 text-red-600'
            : s.includes('chemistry') ? 'bg-blue-50 text-blue-600'
            : s.includes('math')      ? 'bg-purple-50 text-purple-600'
            : s.includes('bio')       ? 'bg-green-50 text-green-600'
            :                           'bg-amber-50 text-amber-600';
  const icon = s.includes('math')      ? <span className="font-bold">∑</span>
             : s.includes('physics')   ? <span className="font-bold">⚛</span>
             : s.includes('chemistry') ? <span className="font-bold">⚗</span>
             : s.includes('bio')       ? <span className="font-bold">🧬</span>
             :                           <BookOpen className="w-5 sm:w-7 h-5 sm:h-7" />;
  return <div className={`flex-shrink-0 w-12 sm:w-14 h-12 sm:h-14 rounded-lg sm:rounded-xl flex items-center justify-center text-lg ${cls} ${className}`}>{icon}</div>;
}

// ── Main Component ─────────────────────────────────────────────────────────────
export default function StudentExams() {
  const { user } = useAuth();

  const [upcomingExams, setUpcomingExams] = useState<Exam[]>([]);
  const [results, setResults] = useState<(ExamAttempt & { exam: Exam })[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeExam, setActiveExam] = useState<ActiveExam | null>(null);
  const [view, setView] = useState<'upcoming' | 'results'>('upcoming');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [reviewingData, setReviewingData] = useState<ReviewingResultData | null>(null);
  const [mobileVisibleQuestion, setMobileVisibleQuestion] = useState(0);
  const questionRefsRef = useRef<(HTMLDivElement | null)[]>([]);
  const [toast, setToast] = useState<Toast | null>(null);

  const showToast = (message: string, type: Toast['type'] = 'info') => {
    setToast({ message, type, visible: true });
    setTimeout(() => {
      setToast(prev => prev ? { ...prev, visible: false } : null);
      setTimeout(() => setToast(null), 300);
    }, 4000);
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const [upcoming, res] = await Promise.all([
        ExamsApi.getUpcoming(),
        ExamsApi.getResults(),
      ]);
      setUpcomingExams(upcoming);
      setResults(res);
    } catch (err) {
      console.error('Error loading exams:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (user?.id) loadData(); }, [user?.id]);

  // Countdown ticker
  useEffect(() => {
    if (!activeExam || activeExam.isReviewing || activeExam.isSubmitting) return;
    const interval = setInterval(() => {
      const now = new Date();
      setCurrentTime(now);
      const examEnd = new Date(activeExam.exam.end_time);
      const elapsed = (now.getTime() - activeExam.startTime.getTime()) / 60000;
      if (elapsed >= activeExam.exam.duration_minutes || now >= examEnd) {
        clearInterval(interval);
        showToast('Time is up! Submitting automatically.', 'warning');
        handleSubmit(true);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [activeExam]);

  // IntersectionObserver for mobile scroll tracking
  useEffect(() => {
    if (!activeExam || activeExam.isPdf || activeExam.isReviewing) return;
    const observer = new IntersectionObserver(
      entries => entries.forEach(e => {
        if (e.isIntersecting) setMobileVisibleQuestion(parseInt(e.target.getAttribute('data-question-index') || '0'));
      }),
      { threshold: 0.3 }
    );
    questionRefsRef.current.forEach(r => r && observer.observe(r));
    return () => questionRefsRef.current.forEach(r => r && observer.unobserve(r));
  }, [activeExam?.questions?.length, activeExam?.isPdf, activeExam?.isReviewing]);

  const getRemainingTime = () => {
    if (!activeExam) return { text: '0m 0s', isWarning: false };
    const timerEnd = activeExam.startTime.getTime() + activeExam.exam.duration_minutes * 60000;
    const examEnd  = new Date(activeExam.exam.end_time).getTime();
    const ms = Math.max(0, Math.min(timerEnd, examEnd) - currentTime.getTime());
    const m  = Math.floor(ms / 60000);
    const s  = Math.floor((ms % 60000) / 1000);
    return { text: `${m}m ${s}s`, isWarning: ms > 0 && ms <= 300000 };
  };

  // ── Start exam ──────────────────────────────────────────────────────────────
  const startExam = async (exam: Exam) => {
    const now = new Date();
    if (now < new Date(exam.start_time)) { showToast('This exam has not started yet', 'warning'); return; }
    if (now > new Date(exam.end_time))   { showToast('This exam has ended', 'warning'); return; }
    try {
      setLoading(true);
      const data = await ExamsApi.startAttempt(exam.id);
      setActiveExam({
        exam: data.exam,
        currentQuestion: 0,
        answers: (data.attempt.answers as Record<number, string | number>) || {},
        startTime: new Date(data.attempt.started_at),
        isPdf: data.isPdf,
        pdfUrl: data.pdfUrl,
        questions: data.questions,
        pdfView: data.isPdf ? 'paper' : undefined,
      });
    } catch (err: any) {
      showToast(err.message || 'Failed to start exam', 'error');
    } finally {
      setLoading(false);
    }
  };

  // ── Select answer ───────────────────────────────────────────────────────────
  const selectAnswer = (questionIndex: number, answerValue: string | number) => {
    if (!activeExam) return;
    if (activeExam.isPdf || typeof answerValue === 'number') {
      setActiveExam({ ...activeExam, answers: { ...activeExam.answers, [questionIndex]: answerValue } });
      return;
    }
    const question = activeExam.questions?.[questionIndex];
    if (!question) return;
    const isMulti = question.correct_answer?.includes(',');
    const key = question.question_number;
    if (!isMulti) {
      setActiveExam({ ...activeExam, answers: { ...activeExam.answers, [key]: answerValue } });
      return;
    }
    const current = (activeExam.answers[key] as string) || '';
    let arr = current ? current.split(',') : [];
    arr = arr.includes(answerValue as string)
      ? arr.filter(a => a !== answerValue)
      : [...arr, answerValue as string].sort();
    setActiveExam({ ...activeExam, answers: { ...activeExam.answers, [key]: arr.join(',') } });
  };

  // ── Submit ──────────────────────────────────────────────────────────────────
  const handleSubmit = async (force = false) => {
    if (!activeExam) return;
    if (!activeExam.isReviewing && !force) {
      setActiveExam({ ...activeExam, isReviewing: true });
      return;
    }
    try {
      setActiveExam({ ...activeExam, isSubmitting: true });
      await ExamsApi.submitAttempt(activeExam.exam.id, activeExam.answers);
      showToast('Answers submitted! Marks and rank will be available after the exam ends.', 'success');
      setActiveExam(null);
      setView('upcoming');
      loadData();
    } catch (err: any) {
      showToast(err.message || 'Failed to submit exam.', 'error');
      setActiveExam(prev => prev ? { ...prev, isSubmitting: false } : null);
    }
  };

  // ── View result details ─────────────────────────────────────────────────────
  const viewResultDetails = async (attempt: ExamAttempt & { exam: Exam }) => {
    try {
      setLoading(true);
      const data: ExamReviewResponse = await ExamsApi.getReview(attempt.exam_id);
      const answers = typeof attempt.answers === 'string'
        ? JSON.parse(attempt.answers)
        : attempt.answers;
      setReviewingData({ attempt: { ...attempt, answers }, ...data });
    } catch (err) {
      showToast('Failed to load exam details', 'error');
    } finally {
      setLoading(false);
    }
  };

  // ══════════════════════════════════════════════════════════════════════════
  // RENDER: REVIEW MODE (pre-submit)
  // ══════════════════════════════════════════════════════════════════════════
  if (activeExam?.isReviewing) {
    const total = activeExam.isPdf ? 50 : (activeExam.questions?.length || 0);
    const answered = Object.keys(activeExam.answers).length;
    return (
      <div className="p-3 sm:p-4 md:p-8 bg-gray-50 min-h-screen">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-gray-200 overflow-hidden mb-6">
            <div className="bg-[#eb1b23] p-4 sm:p-6 text-white text-center">
              <AlertCircle className="w-10 sm:w-12 h-10 sm:h-12 mx-auto mb-2 opacity-80" />
              <h2 className="text-xl sm:text-2xl font-bold">Review Your Answers</h2>
              <p className="text-sm sm:text-base opacity-90">Please verify your answers before final confirmation.</p>
            </div>
            <div className="p-4 sm:p-6 md:p-8">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4 mb-6 text-center">
                {[
                  { label: 'Total', val: total, color: 'bg-gray-50' },
                  { label: 'Marked', val: answered, color: 'bg-green-50' },
                  { label: 'Skipped', val: total - answered, color: 'bg-red-50' },
                  { label: 'Time Spent', val: `${Math.floor((new Date().getTime() - activeExam.startTime.getTime()) / 60000)}m`, color: 'bg-blue-50' },
                ].map(({ label, val, color }) => (
                  <div key={label} className={`${color} rounded-lg sm:rounded-xl p-3 sm:p-4`}>
                    <p className="text-xs text-gray-500 mb-1">{label}</p>
                    <p className="text-xl sm:text-2xl font-bold text-gray-900">{val}</p>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-5 sm:grid-cols-6 md:grid-cols-8 gap-2 mb-6">
                {Array.from({ length: total }).map((_, i) => {
                  const q = activeExam.questions?.[i];
                  const key = activeExam.isPdf ? i + 1 : (q?.question_number as number);
                  const ans = activeExam.answers[key];
                  return (
                    <button key={i}
                      onClick={() => setActiveExam({ ...activeExam, isReviewing: false, currentQuestion: i })}
                      className={`aspect-square rounded-lg flex flex-col items-center justify-center transition-all border-2 text-xs sm:text-sm ${ans !== undefined ? 'bg-[#eb1b23] border-[#eb1b23] text-white shadow-md' : 'bg-white border-gray-100 text-gray-400 hover:border-[#eb1b23] hover:text-[#eb1b23]'}`}>
                      <span className="text-[8px] sm:text-[10px] uppercase font-bold opacity-70">Q{i + 1}</span>
                      <span className="font-black text-sm sm:text-lg">{ans !== undefined ? ans : '-'}</span>
                    </button>
                  );
                })}
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <button onClick={() => setActiveExam({ ...activeExam, isReviewing: false })}
                  className="flex-1 px-6 py-3 bg-white border-2 border-gray-200 text-gray-700 font-bold rounded-xl hover:border-gray-300 transition text-sm">
                  Back to Exam
                </button>
                <button onClick={() => handleSubmit()} disabled={activeExam.isSubmitting}
                  className="flex-1 px-6 py-3 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 shadow-lg shadow-green-100 transition flex items-center justify-center space-x-2 disabled:opacity-50 text-sm">
                  {activeExam.isSubmitting
                    ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    : <><Save className="w-4 h-4" /><span>Confirm &amp; Submit</span></>}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // RENDER: TAKING MODE
  // ══════════════════════════════════════════════════════════════════════════
  if (activeExam) {
    const total = activeExam.isPdf ? 50 : (activeExam.questions?.length || 0);
    const answered = Object.keys(activeExam.answers).length;
    const { text: timeText, isWarning } = getRemainingTime();

    return (
      <div className="fixed inset-0 bg-gray-100 z-50 flex flex-col">
        {/* Header */}
        <div className="bg-white border-b px-3 sm:px-6 py-3 sm:py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div className="flex items-center space-x-4 min-w-0 flex-1">
            <div className="bg-red-50 p-2 rounded-lg flex-shrink-0">
              <FileText className="w-5 sm:w-6 h-5 sm:h-6 text-[#eb1b23]" />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-base sm:text-xl font-bold text-gray-900 truncate">{activeExam.exam.title}</h2>
              <div className="flex items-center space-x-3 text-xs sm:text-sm text-gray-500">
                <span>{activeExam.exam.subject}</span>
                <span>•</span>
                <span className={`flex items-center ${isWarning ? 'text-[#eb1b23] font-bold animate-pulse' : ''}`}>
                  <Clock className="w-3 sm:w-4 h-3 sm:h-4 mr-1" />{timeText}
                </span>
              </div>
              {!activeExam.isPdf && (
                <p className="md:hidden text-xs font-bold text-[#eb1b23] mt-1">
                  Question {mobileVisibleQuestion + 1} of {activeExam.questions?.length || 0}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-4 flex-shrink-0">
            <div className="hidden sm:block text-right">
              <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">Progress</p>
              <p className="font-bold text-gray-900 text-sm">{answered} / {total}</p>
            </div>
            <button onClick={() => handleSubmit()}
              className="bg-[#eb1b23] text-white px-3 sm:px-6 py-2 sm:py-2.5 rounded-lg font-bold text-sm sm:text-base hover:bg-red-700 transition shadow-lg shadow-red-100 whitespace-nowrap">
              Review
            </button>
          </div>
        </div>

        {/* Mobile PDF toggle */}
        {activeExam.isPdf && (
          <div className="md:hidden flex bg-white border-b sticky top-0 z-10">
            {(['paper', 'answers'] as const).map(tab => (
              <button key={tab} onClick={() => setActiveExam({ ...activeExam, pdfView: tab })}
                className={`flex-1 py-3 text-sm font-bold border-b-2 transition-colors ${activeExam.pdfView === tab ? 'border-[#eb1b23] text-[#eb1b23]' : 'border-transparent text-gray-400'}`}>
                {tab === 'paper' ? 'Question Paper' : 'Answer Sheet'}
              </button>
            ))}
          </div>
        )}

        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* Left: content */}
          <div className={`flex-1 bg-gray-200 overflow-auto relative min-h-0 ${activeExam.isPdf && activeExam.pdfView === 'answers' ? 'hidden md:block' : 'block'}`}>
            {activeExam.isPdf ? (
              activeExam.pdfUrl
                ? <iframe src={activeExam.pdfUrl} className="w-full h-full border-none" title="Exam Paper" />
                : <div className="flex items-center justify-center h-full text-gray-500">Loading PDF…</div>
            ) : (
              <>
                {/* Desktop: one question at a time */}
                <div className="hidden md:block p-6 lg:p-8 max-w-3xl mx-auto w-full h-full overflow-auto">
                  {activeExam.questions?.[activeExam.currentQuestion] && (() => {
                    const q = activeExam.questions![activeExam.currentQuestion];
                    return (
                      <div className="bg-white rounded-2xl p-4 sm:p-8 shadow-sm">
                        <div className="text-xs sm:text-sm font-bold text-[#eb1b23] mb-4 uppercase tracking-widest">
                          Question {activeExam.currentQuestion + 1}
                        </div>
                        <h3 className="text-lg sm:text-2xl font-bold text-gray-900 mb-6 leading-relaxed">{q.question_text}</h3>
                        <div className="space-y-3">
                          {q.options.map((option, idx) => {
                            const optNum = String(idx + 1);
                            const cur = activeExam.answers[q.question_number] as string;
                            const sel = cur ? cur.split(',').map(s => s.trim()).includes(optNum) : false;
                            return (
                              <button key={idx} onClick={() => selectAnswer(activeExam.currentQuestion, optNum)}
                                className={`w-full text-left p-3 sm:p-5 rounded-xl border-2 transition-all flex items-center group ${sel ? 'border-[#eb1b23] bg-red-50 shadow-md' : 'border-gray-100 hover:border-gray-200 hover:bg-gray-50'}`}>
                                <span className={`w-8 sm:w-10 h-8 sm:h-10 rounded-lg flex items-center justify-center font-bold mr-3 text-sm transition-colors flex-shrink-0 ${sel ? 'bg-[#eb1b23] text-white' : 'bg-gray-100 text-gray-500 group-hover:bg-gray-200'}`}>{idx + 1}</span>
                                <span className={`text-base sm:text-lg font-medium break-words ${sel ? 'text-gray-900' : 'text-gray-700'}`}>{option}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })()}
                </div>
                {/* Mobile: all questions */}
                <div className="md:hidden p-3 sm:p-6 w-full h-full overflow-auto scroll-smooth">
                  <div className="space-y-6">
                    {activeExam.questions?.map((q, qIdx) => {
                      const cur = activeExam.answers[q.question_number] as string;
                      return (
                        <div key={qIdx} ref={el => { questionRefsRef.current[qIdx] = el; }}
                          data-question-index={qIdx}
                          className="bg-white rounded-xl p-4 sm:p-6 shadow-sm">
                          <div className="text-xs font-bold text-[#eb1b23] mb-3 uppercase tracking-widest flex justify-between">
                            <span>Question {qIdx + 1}</span>
                            <span className="text-xs font-normal text-gray-500 bg-gray-100 px-2 py-1 rounded">
                              {Object.keys(activeExam.answers).length} / {activeExam.questions?.length}
                            </span>
                          </div>
                          <h3 className="text-lg font-bold text-gray-900 mb-4 leading-relaxed">{q.question_text}</h3>
                          <div className="flex flex-wrap gap-2">
                            {q.options.map((option, idx) => {
                              const optNum = String(idx + 1);
                              const sel = cur ? cur.split(',').map(s => s.trim()).includes(optNum) : false;
                              return (
                                <button key={idx} onClick={() => selectAnswer(qIdx, optNum)}
                                  className={`flex-1 min-w-[calc(50%-0.25rem)] p-2 rounded-lg border-2 transition-all flex items-center justify-center ${sel ? 'border-[#eb1b23] bg-red-50 shadow-md' : 'border-gray-100 hover:border-gray-200 hover:bg-gray-50'}`}>
                                  <span className={`text-xs font-medium text-center break-words ${sel ? 'text-gray-900' : 'text-gray-700'}`}>{option}</span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="h-24" />
                </div>
              </>
            )}
          </div>

          {/* Right: nav panel */}
          <div className={`w-full md:w-80 lg:w-96 bg-white border-l flex flex-col flex-1 md:flex-none min-h-0 ${!activeExam.isPdf ? 'hidden md:flex' : (activeExam.pdfView === 'paper' ? 'hidden md:flex' : 'flex')}`}>
            <div className="p-3 sm:p-6 border-b bg-gray-50 font-bold text-gray-700 text-sm">
              {activeExam.isPdf ? 'Answer Sheet' : 'Question Map'}
            </div>
            <div className="flex-1 overflow-y-auto p-3 sm:p-6">
              {activeExam.isPdf ? (
                <div className="space-y-3">
                  {Array.from({ length: 50 }).map((_, i) => {
                    const qNo = i + 1;
                    return (
                      <div key={i} className="flex items-center space-x-2">
                        <span className="w-5 text-xs font-mono text-gray-400 flex-shrink-0">{String(qNo).padStart(2, '0')}.</span>
                        <div className="flex-1 flex justify-between bg-gray-50 p-1.5 rounded-lg border border-gray-100 gap-1">
                          {[1, 2, 3, 4, 5].map(val => {
                            const sel = activeExam.answers[qNo] === val;
                            return (
                              <button key={val} onClick={() => selectAnswer(qNo, val)}
                                className={`w-6 sm:w-8 h-6 sm:h-8 rounded-full text-xs font-bold transition-all flex items-center justify-center flex-shrink-0 ${sel ? 'bg-[#eb1b23] text-white shadow-md' : 'bg-white text-gray-400 hover:bg-gray-100'}`}>
                                {val}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
                  {activeExam.questions?.map((q, i) => {
                    const isCurrent = activeExam.currentQuestion === i;
                    const isAnswered = activeExam.answers[q.question_number] !== undefined;
                    return (
                      <button key={i} onClick={() => setActiveExam({ ...activeExam, currentQuestion: i })}
                        className={`aspect-square rounded-xl flex items-center justify-center font-bold text-xs sm:text-sm transition-all border-2 ${isCurrent ? 'border-[#eb1b23] bg-red-50 text-[#eb1b23] scale-105' : isAnswered ? 'border-green-100 bg-green-50 text-green-600' : 'border-transparent bg-gray-50 text-gray-400 hover:bg-gray-100'}`}>
                        {i + 1}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
            {!activeExam.isPdf && (
              <div className="hidden md:grid p-3 sm:p-6 border-t bg-gray-50 grid-cols-2 gap-3">
                <button onClick={() => setActiveExam({ ...activeExam, currentQuestion: Math.max(0, activeExam.currentQuestion - 1) })}
                  disabled={activeExam.currentQuestion === 0}
                  className="px-4 py-3 bg-white border border-gray-200 text-gray-700 rounded-xl font-bold text-sm hover:bg-gray-100 transition disabled:opacity-50">
                  Previous
                </button>
                <button onClick={() => setActiveExam({ ...activeExam, currentQuestion: Math.min(total - 1, activeExam.currentQuestion + 1) })}
                  disabled={activeExam.currentQuestion === total - 1}
                  className="px-4 py-3 bg-[#eb1b23] text-white rounded-xl font-bold text-sm hover:bg-red-700 transition shadow-lg shadow-red-100 disabled:opacity-50">
                  Next
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Mobile fixed footer */}
        {!activeExam.isPdf && (
          <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-3 shadow-lg">
            <div className="flex gap-3">
              <button onClick={() => handleSubmit()}
                className="flex-1 bg-white border border-gray-300 text-gray-700 px-4 py-3 rounded-lg font-bold text-sm hover:bg-gray-100 transition">
                Review
              </button>
              <button onClick={() => handleSubmit()}
                className="flex-1 bg-[#eb1b23] text-white px-4 py-3 rounded-lg font-bold text-sm hover:bg-red-700 transition shadow-lg shadow-red-100">
                Submit
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // RENDER: POST-EXAM REVIEW
  // ══════════════════════════════════════════════════════════════════════════
  if (reviewingData) {
    return (
      <div className="fixed inset-0 bg-gray-100 z-50 flex flex-col">
        <div className="bg-white border-b px-3 sm:px-6 py-3 sm:py-4 flex items-center justify-between gap-2">
          <h2 className="text-base sm:text-xl font-bold text-gray-900 truncate">Review: {reviewingData.attempt.exam.title}</h2>
          <button onClick={() => setReviewingData(null)}
            className="bg-white border text-[#eb1b23] border-[#eb1b23] px-3 sm:px-6 py-2 rounded-lg sm:rounded-xl font-bold text-xs sm:text-base hover:bg-red-50 transition whitespace-nowrap flex-shrink-0">
            Close Results
          </button>
        </div>
        <div className="flex-1 overflow-auto p-4 sm:p-8">
          <div className="max-w-6xl mx-auto">
            {reviewingData.isPdf ? (
              <div className="flex flex-col md:flex-row gap-6 h-[calc(100vh-120px)]">
                <div className="flex-1 bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                  {reviewingData.pdfUrl
                    ? <iframe src={reviewingData.pdfUrl} className="w-full h-full border-none" />
                    : <div className="flex items-center justify-center h-full text-gray-400 font-bold">Paper unavailable</div>}
                </div>
                <div className="w-full md:w-96 bg-white rounded-2xl shadow-sm border border-gray-200 overflow-y-auto p-6">
                  <h3 className="font-bold text-xl mb-6 text-gray-900">Your Marking Map</h3>
                  <div className="space-y-4">
                    {reviewingData.pdfAnswers?.map(ans => {
                      const stuChoice = Number((reviewingData.attempt.answers as any)?.[ans.question_no]);
                      return (
                        <div key={ans.question_no} className="flex items-center space-x-3">
                          <span className="w-6 text-sm font-mono font-bold text-gray-500">{String(ans.question_no).padStart(2, '0')}.</span>
                          <div className="flex-1 flex justify-between gap-1">
                            {[1,2,3,4,5].map(val => {
                              const isStu = stuChoice === val;
                              const isTrue = Number(ans.correct_answer) === val;
                              const cls = isTrue ? 'bg-green-500 border-green-600 text-white scale-105' : isStu ? 'bg-red-500 border-red-600 text-white scale-105' : 'bg-gray-50 border-gray-200 text-gray-400';
                              return <div key={val} className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs font-bold transition-all ${cls}`}>{val}</div>;
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {reviewingData.questions?.map((q, idx) => {
                  const stuAns = (reviewingData.attempt.answers as any)?.[q.question_number] as string;
                  const correct = (q.correct_answer || '').split(',').map(s => s.trim()).filter(Boolean);
                  const student = stuAns ? stuAns.split(',').map(s => s.trim()).filter(Boolean) : [];
                  const isCorrect = correct.length === student.length && correct.every(c => student.includes(c));
                  return (
                    <div key={idx} className="p-6 sm:p-8 border border-gray-200 rounded-3xl bg-white shadow-sm hover:shadow-md transition">
                      <div className="flex justify-between items-center mb-6 pb-6 border-b border-gray-100">
                        <h4 className="text-xl font-bold text-gray-900 border-l-4 border-[#eb1b23] pl-3">Question {q.question_number}</h4>
                        <div className={`font-bold px-4 py-2 rounded-full text-sm border ${isCorrect ? 'bg-green-50 text-green-700 border-green-100' : 'bg-red-50 text-red-700 border-red-100'}`}>
                          {isCorrect ? 'Correct' : 'Incorrect'}
                        </div>
                      </div>
                      <p className="text-gray-800 text-lg mb-8 leading-relaxed whitespace-pre-wrap">{q.question_text}</p>
                      <div className="space-y-3">
                        {q.options.map((opt, optIdx) => {
                          const optNum = String(optIdx + 1);
                          const isStu = student.includes(optNum);
                          const isTrue = correct.includes(optNum);
                          const cls = isTrue
                            ? 'bg-green-50 border-green-500 text-green-900 shadow-md'
                            : isStu
                            ? 'bg-red-50 border-red-500 text-red-900 shadow-sm'
                            : 'bg-white border-gray-200 text-gray-700';
                          return (
                            <div key={optIdx} className={`p-4 sm:p-5 border-2 rounded-2xl flex items-center ${cls}`}>
                              <span className={`w-10 h-10 flex items-center justify-center rounded-xl font-bold text-lg mr-4 ${isTrue ? 'bg-green-500 text-white' : isStu ? 'bg-red-500 text-white' : 'bg-gray-100 text-gray-500'}`}>{optIdx + 1}</span>
                              <span className="flex-1 font-semibold text-lg">{opt}</span>
                              {isTrue && <span className="ml-3 text-green-700 font-bold bg-white px-3 py-1.5 rounded-lg text-sm border border-green-200">Correct</span>}
                              {!isTrue && isStu && <span className="ml-3 text-red-700 font-bold bg-white px-3 py-1.5 rounded-lg text-sm border border-red-200">Your Pick</span>}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // RENDER: LOADING
  // ══════════════════════════════════════════════════════════════════════════
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#eb1b23]" />
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // RENDER: MAIN LIST VIEW
  // ══════════════════════════════════════════════════════════════════════════
  return (
    <div className="h-full min-h-0 overflow-y-auto p-3 sm:p-6 lg:p-8 bg-gray-50/50">
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">Exams &amp; Results</h2>
        <p className="text-slate-500 text-sm sm:text-base mt-1">Take exams and track your academic progress</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4 mb-4 sm:mb-6">
        {[
          { label: 'Upcoming Exams', val: upcomingExams.length, icon: <FileText className="w-4 sm:w-5 h-4 sm:h-5 text-blue-600" />, bg: 'bg-blue-50' },
          { label: 'Completed', val: results.length, icon: <CheckCircle2 className="w-4 sm:w-5 h-4 sm:h-5 text-green-600" />, bg: 'bg-green-50' },
          { label: 'Avg Score', val: results.length > 0 ? `${Math.round(results.reduce((s, r) => s + (r.score / r.exam.total_marks) * 100, 0) / results.length)}%` : '0%', icon: <Trophy className="w-4 sm:w-5 h-4 sm:h-5 text-amber-600" />, bg: 'bg-amber-50' },
          { label: 'Top 3 Ranks', val: results.filter(r => new Date() > new Date(r.exam.end_time) && r.rank != null && r.rank <= 3).length, icon: <Award className="w-4 sm:w-5 h-4 sm:h-5 text-[#eb1b23]" />, bg: 'bg-red-50' },
        ].map(({ label, val, icon, bg }) => (
          <div key={label} className="bg-white rounded-lg sm:rounded-xl p-3 sm:p-4 shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className={`p-2 ${bg} rounded-lg flex-shrink-0`}>{icon}</div>
              <div className="min-w-0">
                <p className="text-xl sm:text-2xl font-bold text-slate-900">{val}</p>
                <p className="text-xs text-slate-500">{label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="border-b border-gray-100">
          <div className="flex p-1 sm:p-2 gap-1">
            {(['upcoming', 'results'] as const).map(tab => (
              <button key={tab} onClick={() => setView(tab)}
                className={`flex-1 px-3 sm:px-6 py-2 sm:py-3 rounded-lg sm:rounded-xl text-xs sm:text-sm font-medium transition-all duration-200 ${view === tab ? 'bg-[#eb1b23] text-white shadow-md' : 'text-slate-600 hover:bg-slate-50'}`}>
                <span className="flex items-center justify-center gap-1 sm:gap-2">
                  {tab === 'upcoming' ? <Calendar className="w-3 sm:w-4 h-3 sm:h-4" /> : <Award className="w-3 sm:w-4 h-3 sm:h-4" />}
                  <span className="hidden sm:inline">{tab === 'upcoming' ? 'Upcoming' : 'My Results'}</span>
                  <span className="sm:hidden">{tab === 'upcoming' ? 'Exams' : 'Results'}</span>
                  {(tab === 'upcoming' ? upcomingExams : results).length > 0 && (
                    <span className={`px-2 py-0.5 rounded-full text-xs ${view === tab ? 'bg-white/20' : 'bg-slate-100'}`}>
                      {tab === 'upcoming' ? upcomingExams.length : results.length}
                    </span>
                  )}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="p-3 sm:p-6">
          {view === 'upcoming' ? (
            <div className="space-y-3 sm:space-y-4">
              {upcomingExams.length === 0 ? (
                <div className="text-center py-12 sm:py-16">
                  <div className="w-16 sm:w-20 h-16 sm:h-20 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <FileQuestion className="w-8 sm:w-10 h-8 sm:h-10 text-slate-300" />
                  </div>
                  <h3 className="text-base sm:text-lg font-semibold text-slate-900 mb-2">No upcoming exams</h3>
                  <p className="text-slate-500 text-xs sm:text-sm max-w-sm mx-auto">Your scheduled exams will appear here.</p>
                </div>
              ) : upcomingExams.map(exam => {
                const start = new Date(exam.start_time), end = new Date(exam.end_time), now = new Date();
                const isActive = now >= start && now <= end;
                const isUpcoming = now < start;
                const isPast = now > end;
                return (
                  <div key={exam.id} className="group bg-white border border-gray-100 rounded-lg sm:rounded-xl p-3 sm:p-5 hover:shadow-lg hover:border-[#eb1b23]/30 transition-all duration-300">
                    <div className="flex items-start gap-3 sm:gap-4">
                      <SubjectIcon subject={exam.subject} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">{exam.subject}</span>
                              {isActive && <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700 animate-pulse">Active</span>}
                              {isUpcoming && <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">Scheduled</span>}
                              {isPast && <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600">Ended</span>}
                            </div>
                            <h4 className="text-base sm:text-lg font-bold text-slate-900 group-hover:text-[#eb1b23] transition-colors line-clamp-2">{exam.title}</h4>
                            <p className="text-xs sm:text-sm text-slate-500 mt-1 line-clamp-1">{exam.description || 'No description'}</p>
                          </div>
                          {isActive && (
                            <button onClick={() => startExam(exam)}
                              className="flex-shrink-0 flex items-center gap-1 sm:gap-2 px-3 sm:px-5 py-2 sm:py-2.5 bg-[#eb1b23] text-white rounded-lg sm:rounded-xl font-medium text-xs sm:text-base hover:bg-red-700 transition shadow-lg shadow-red-200 whitespace-nowrap">
                              <PlayCircle className="w-4 sm:w-5 h-4 sm:h-5" />
                              <span>Start</span>
                            </button>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-2 sm:gap-4 mt-3 text-xs sm:text-sm text-slate-500">
                          <span className="flex items-center gap-1"><Calendar className="w-3 sm:w-4 h-3 sm:h-4" />{start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                          <span className="flex items-center gap-1"><Clock className="w-3 sm:w-4 h-3 sm:h-4" />{start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          <span>{exam.duration_minutes} min</span>
                          <span>{exam.total_marks} marks</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="space-y-3 sm:space-y-4">
              {results.length === 0 ? (
                <div className="text-center py-12 sm:py-16">
                  <div className="w-16 sm:w-20 h-16 sm:h-20 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Award className="w-8 sm:w-10 h-8 sm:h-10 text-slate-300" />
                  </div>
                  <h3 className="text-base sm:text-lg font-semibold text-slate-900 mb-2">No results yet</h3>
                  <p className="text-slate-500 text-xs sm:text-sm max-w-sm mx-auto">Complete exams to see your results here.</p>
                </div>
              ) : results.map(result => {
                const endTime = new Date(result.exam.end_time);
                const ended = new Date() > endTime;
                const pct = Math.round((result.score / result.exam.total_marks) * 100);
                return (
                  <div key={result.id} className="group bg-white border border-gray-100 rounded-lg sm:rounded-xl p-3 sm:p-5 hover:shadow-lg hover:border-[#eb1b23]/30 transition-all duration-300">
                    <div className="flex items-start gap-3 sm:gap-4">
                      <SubjectIcon subject={result.exam.subject} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">{result.exam.subject}</span>
                          <span className="text-xs text-slate-400">{result.submitted_at ? new Date(result.submitted_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' }) : ''}</span>
                          {!ended && <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700 flex items-center gap-1"><Clock className="w-3 h-3" />Pending</span>}
                        </div>
                        <h4 className="text-base sm:text-lg font-bold text-slate-900 group-hover:text-[#eb1b23] transition-colors line-clamp-2">{result.exam.title}</h4>
                        <div className="grid grid-cols-3 gap-1.5 sm:gap-3 mt-3">
                          <div className="bg-slate-50 rounded p-2 sm:p-3 text-center">
                            <p className="text-xs text-slate-500 mb-1">Score</p>
                            <p className="text-sm sm:text-lg font-bold text-slate-900">{result.score}/{result.exam.total_marks}</p>
                          </div>
                          <div className="bg-slate-50 rounded p-2 sm:p-3 text-center">
                            <p className="text-xs text-slate-500 mb-1">%</p>
                            <p className={`text-sm sm:text-lg font-bold ${pct >= 75 ? 'text-green-600' : pct >= 50 ? 'text-amber-600' : 'text-red-600'}`}>{pct}%</p>
                          </div>
                          <div className="bg-slate-50 rounded p-2 sm:p-3 text-center">
                            <p className="text-xs text-slate-500 mb-1">Rank</p>
                            <p className="text-sm sm:text-lg font-bold text-[#eb1b23]">{ended ? `#${result.rank ?? 'N/A'}` : 'Pending'}</p>
                          </div>
                        </div>
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mt-3 pt-3 border-t border-gray-100">
                          {!ended
                            ? <div className="flex items-center text-amber-600 text-xs sm:text-sm"><AlertCircle className="w-3 sm:w-4 h-3 sm:h-4 mr-1" /><span>Rank on {endTime.toLocaleDateString()}</span></div>
                            : <div className="hidden sm:block" />}
                          <button onClick={() => viewResultDetails(result)}
                            className="flex items-center justify-center gap-1 sm:gap-2 px-3 sm:px-5 py-2 sm:py-2.5 bg-white border-2 border-gray-200 text-slate-700 hover:border-[#eb1b23] hover:text-[#eb1b23] font-medium rounded-lg sm:rounded-xl transition text-xs sm:text-sm whitespace-nowrap flex-shrink-0">
                            <FileText className="w-3 sm:w-4 h-3 sm:h-4" />
                            <span>Review</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-3 left-3 right-3 sm:bottom-6 sm:right-6 z-[100] transition-all duration-300 transform ${toast.visible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
          <div className={`flex items-center gap-2 sm:gap-3 px-3 sm:px-5 py-3 sm:py-4 rounded-xl shadow-2xl border-l-4 bg-white ${toast.type === 'success' ? 'border-green-500' : toast.type === 'error' ? 'border-red-500' : toast.type === 'warning' ? 'border-amber-500' : 'border-blue-500'}`}>
            <div className={`p-1 sm:p-2 rounded-lg flex-shrink-0 ${toast.type === 'success' ? 'bg-green-100' : toast.type === 'error' ? 'bg-red-100' : toast.type === 'warning' ? 'bg-amber-100' : 'bg-blue-100'}`}>
              {toast.type === 'success' ? <Check className="w-4 sm:w-5 h-4 sm:h-5 text-green-600" /> :
               toast.type === 'error'   ? <AlertTriangle className="w-4 sm:w-5 h-4 sm:h-5 text-red-600" /> :
               toast.type === 'warning' ? <AlertTriangle className="w-4 sm:w-5 h-4 sm:h-5 text-amber-600" /> :
                                          <Info className="w-4 sm:w-5 h-4 sm:h-5 text-blue-600" />}
            </div>
            <p className="flex-1 text-xs sm:text-sm font-medium text-slate-800 line-clamp-3">{toast.message}</p>
            <button onClick={() => setToast(prev => prev ? { ...prev, visible: false } : null)} className="text-slate-400 hover:text-slate-600 transition-colors flex-shrink-0">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
