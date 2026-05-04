import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { FileText, Clock, Trophy, Award, Calendar, PlayCircle, AlertCircle, Save, Check, AlertTriangle, Info, X, FileQuestion, CheckCircle2, BookOpen } from 'lucide-react';

interface Exam {
  id: string;
  title: string;
  description: string;
  subject: string;
  duration_minutes: number;
  total_marks: number;
  start_time: string;
  end_time: string;
  class: {
    title: string;
  };
}

interface ExamQuestion {
  id: string;
  question_number: number;
  question_text: string;
  options: string[];
  correct_answer: string;
  marks: number;
  image_path?: string;
}

interface ExamAttempt {
  id: string;
  exam_id: string;
  score: number;
  rank: number;
  submitted_at: string;
  answers: Record<number, string | number>;
  exam: {
    title: string;
    subject: string;
    total_marks: number;
    end_time: string;
  };
}

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
  pdfQuestionCount?: number;
}

interface ReviewingResultData {
  attempt: ExamAttempt;
  isPdf: boolean;
  pdfUrl?: string | null;
  questions?: ExamQuestion[];
  pdfAnswers?: { question_no: number; correct_answer: string }[];
}

interface MonthlyResult {
  month: string;
  monthKey: string;
  totalScore: number;
  totalPossibleMarks: number;
  rank: number;
  attempts: ExamAttempt[];
}

export default function Exams() {
  const { profile } = useAuth();
  const [upcomingExams, setUpcomingExams] = useState<Exam[]>([]);
  const [results, setResults] = useState<ExamAttempt[]>([]);
  const [monthlyResults, setMonthlyResults] = useState<MonthlyResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeExam, setActiveExam] = useState<ActiveExam | null>(null);
  const [view, setView] = useState<'upcoming' | 'results'>('upcoming');
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [reviewingData, setReviewingData] = useState<ReviewingResultData | null>(null);
  const [mobileVisibleQuestion, setMobileVisibleQuestion] = useState<number>(0);
  const questionRefsRef = useRef<(HTMLDivElement | null)[]>([]);

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
    if (profile?.id) {
      loadData();
    }
  }, [profile?.id]);

  const loadData = async () => {
    try {
      setLoading(true);

      // Get student's active enrollments
      const { data: enrollments } = await supabase
        .from('enrollments')
        .select('class_id')
        .eq('student_id', profile?.id)
        .eq('is_active', true);

      const classIds = enrollments?.map(e => e.class_id) || [];

      if (classIds.length > 0) {
        // Fetch exams for these classes
        const { data: examsData, error: examsError } = await supabase
          .from('exams')
          .select(`
            *,
            class:classes(title)
          `)
          .in('class_id', classIds)
          .gt('end_time', new Date().toISOString())
          .order('start_time', { ascending: true });

        if (examsError) throw examsError;
        setUpcomingExams(examsData || []);
      }

      // Fetch exam attempts
      const { data: resultsData, error: resultsError } = await supabase
        .from('exam_attempts')
        .select(`
          *,
          exam:exams(title, subject, total_marks, end_time)
        `)
        .eq('student_id', profile?.id)
        .order('submitted_at', { ascending: false });

      if (resultsError) throw resultsError;

      // Group by month
      const monthsMap: Record<string, MonthlyResult> = {};
      
      const resultsWithRanks = await Promise.all((resultsData || []).map(async (result) => {
        const endTime = new Date(result.exam.end_time);
        const isEnded = new Date() > endTime;
        
        let rank = result.rank;
        if (isEnded) {
          const { count } = await supabase
            .from('exam_attempts')
            .select('*', { count: 'exact', head: true })
            .eq('exam_id', result.exam_id)
            .eq('status', 'submitted')
            .gt('score', result.score);
          rank = (count || 0) + 1;
        }

        const resultWithRank = { ...result, rank };

        // Process monthly grouping
        if (isEnded) {
          const monthDate = new Date(result.exam.end_time);
          const monthKey = `${monthDate.getFullYear()}-${String(monthDate.getMonth() + 1).padStart(2, '0')}`;
          const monthName = monthDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

          if (!monthsMap[monthKey]) {
            monthsMap[monthKey] = {
              month: monthName,
              monthKey,
              totalScore: 0,
              totalPossibleMarks: 0,
              rank: 0,
              attempts: []
            };
          }
          monthsMap[monthKey].totalScore += result.score;
          monthsMap[monthKey].totalPossibleMarks += result.exam.total_marks;
          monthsMap[monthKey].attempts.push(resultWithRank);
        }

        return resultWithRank;
      }));

      // Calculate monthly ranks
      const sortedMonths = Object.keys(monthsMap).sort((a, b) => b.localeCompare(a));
      const finalMonthlyResults: MonthlyResult[] = [];

      for (const monthKey of sortedMonths) {
        const monthlyData = monthsMap[monthKey];
        
        // Fetch all exams in this month for the student's classes
        const startOfMonth = new Date(`${monthKey}-01T00:00:00Z`);
        const endOfMonth = new Date(startOfMonth);
        endOfMonth.setMonth(endOfMonth.getMonth() + 1);

        const { data: monthExams } = await supabase
          .from('exams')
          .select('id')
          .in('class_id', classIds)
          .gte('end_time', startOfMonth.toISOString())
          .lt('end_time', endOfMonth.toISOString());

        const monthExamIds = monthExams?.map(e => e.id) || [];

        if (monthExamIds.length > 0) {
          // Fetch all attempts for these exams to calculate aggregate rank
          const { data: allAttempts } = await supabase
            .from('exam_attempts')
            .select('student_id, score')
            .in('exam_id', monthExamIds)
            .eq('status', 'submitted');

          if (allAttempts) {
            // Group by student and sum scores
            const studentSums: Record<string, number> = {};
            allAttempts.forEach(att => {
              studentSums[att.student_id] = (studentSums[att.student_id] || 0) + att.score;
            });

            // Calculate rank
            const currentStudentScore = studentSums[profile?.id] || 0;
            const higherScoresCount = Object.values(studentSums).filter(s => s > currentStudentScore).length;
            monthlyData.rank = higherScoresCount + 1;
          }
        }

        finalMonthlyResults.push(monthlyData);
      }

      setResults(resultsWithRanks);
      setMonthlyResults(finalMonthlyResults);
    } catch (error) {
      console.error('Error loading exams:', error);
    } finally {
      setLoading(false);
    }
  };

  const startExam = async (exam: Exam) => {
    const now = new Date();
    const startTime = new Date(exam.start_time);
    const endTime = new Date(exam.end_time);

    if (now < startTime) {
      showToast('This exam has not started yet', 'warning');
      return;
    }

    if (now > endTime) {
      showToast('This exam has ended', 'warning');
      return;
    }

    // Check for a submitted attempt first (any row with status=submitted)
    const { data: submittedRows } = await supabase
      .from('exam_attempts')
      .select('id')
      .eq('exam_id', exam.id)
      .eq('student_id', profile?.id)
      .eq('status', 'submitted')
      .limit(1);

    if (submittedRows && submittedRows.length > 0) {
      showToast('You have already completed this exam', 'warning');
      return;
    }

    // Check for an in-progress (started) attempt to resume
    const { data: startedRows } = await supabase
      .from('exam_attempts')
      .select('id, started_at, answers')
      .eq('exam_id', exam.id)
      .eq('student_id', profile?.id)
      .eq('status', 'started')
      .order('started_at', { ascending: false })
      .limit(1);

    const existingAttempt = startedRows && startedRows.length > 0 ? startedRows[0] : null;

    try {
      setLoading(true);

      // 1. Check if it's a PDF exam
      const { data: pdfData } = await supabase
        .from('pdf_exams')
        .select('*')
        .eq('exam_id', exam.id)
        .order('question_no', { ascending: true });

      const isPdf = !!(pdfData && pdfData.length > 0);
      const pdfQuestionCount = isPdf ? pdfData!.length : 0;
      let questions: ExamQuestion[] = [];
      let pdfUrl: string | null = null;

      if (isPdf) {
        const pdfPath = pdfData![0].pdf_path;
        const storagePath = pdfPath.startsWith('acp/') ? pdfPath.slice(4) : pdfPath;
        const { data: urlData } = supabase.storage.from('acp').getPublicUrl(storagePath);
        pdfUrl = urlData?.publicUrl || null;
      } else {
        // Fetch manual questions
        const { data: qData, error: qError } = await supabase
          .from('exam_questions')
          .select('*')
          .eq('exam_id', exam.id)
          .order('question_number', { ascending: true });

        if (qError) throw qError;
        questions = (qData || []).map(q => ({
          id: q.id,
          question_number: q.question_number,
          question_text: q.question_text,
          options: q.options || [],
          correct_answer: q.correct_answer,
          marks: q.marks,
          image_path: q.image_path,
        }));
      }

      // Create or resume attempt
      let attemptId = existingAttempt?.id;
      let attemptStartTime = new Date();
      let attemptAnswers: Record<number, string | number> = {};

      if (!attemptId) {
        const { data: newAttempt, error: attemptError } = await supabase
          .from('exam_attempts')
          .insert({
            exam_id: exam.id,
            student_id: profile?.id,
            status: 'started',
            score: 0,
            answers: {},
          })
          .select()
          .single();

        if (attemptError) throw attemptError;
        attemptId = newAttempt.id;
        if (newAttempt.started_at) {
          attemptStartTime = new Date(newAttempt.started_at);
        }
      } else {
        if (existingAttempt?.started_at) {
          attemptStartTime = new Date(existingAttempt.started_at);
        }
        if (existingAttempt?.answers) {
          // Parse Jsonb or assume it's already an object
          attemptAnswers = typeof existingAttempt.answers === 'string'
            ? JSON.parse(existingAttempt.answers)
            : existingAttempt.answers;
        }
      }

      setActiveExam({
        exam,
        currentQuestion: 0,
        answers: attemptAnswers,
        startTime: attemptStartTime,
        isPdf,
        pdfUrl,
        questions,
        pdfView: isPdf ? 'paper' : undefined,
        pdfQuestionCount,
      });
    } catch (error) {
      console.error('Error starting exam:', error);
      showToast('Failed to start exam', 'error');
    } finally {
      setLoading(false);
    }
  };

  const selectAnswer = (questionIndex: number, answerValue: string | number) => {
    if (!activeExam) return;

    if (activeExam.isPdf || typeof answerValue === 'number') {
      setActiveExam({
        ...activeExam,
        answers: { ...activeExam.answers, [questionIndex]: answerValue },
      });
      return;
    }

    const question = activeExam.questions?.[questionIndex];
    if (!question) return;
    const answerKey = question.question_number;

    // Always single-select: student can only pick one answer per question
    setActiveExam({
      ...activeExam,
      answers: { ...activeExam.answers, [answerKey]: answerValue },
    });
  };

  const submitExam = async (forceSubmit?: boolean) => {
    if (!activeExam) return;
    const isForced = forceSubmit === true;

    // If not reviewing yet, switch to review mode
    if (!activeExam.isReviewing && !isForced) {
      setActiveExam({ ...activeExam, isReviewing: true });
      return;
    }

    // Final confirmation logic
    try {
      setActiveExam({ ...activeExam, isSubmitting: true });

      // Calculate score for manual exams
      let score = 0;
      let correctCount = 0;
      let incorrectCount = 0;
      const totalQuestions = activeExam.isPdf ? (activeExam.pdfQuestionCount || 0) : (activeExam.questions?.length || 0);

      if (!activeExam.isPdf && activeExam.questions) {
        activeExam.questions.forEach((q) => {
          const answerKey = q.question_number;
          const studentAnswer = activeExam.answers[answerKey] as string;
          if (studentAnswer !== undefined && studentAnswer !== '') {
            const correctArr = (q.correct_answer || '').split(',').map(s => s.trim()).filter(Boolean);

            // Student picks one answer; correct if it matches any of the correct answers
            const isCorrect = correctArr.includes(studentAnswer.trim());

            if (isCorrect) {
              score += q.marks;
              correctCount++;
            } else {
              incorrectCount++;
            }
          }
        });
      }

      // For PDF exams
      if (activeExam.isPdf) {
        const { data: correctAnswers } = await supabase
          .from('pdf_exams')
          .select('question_no, correct_answer')
          .eq('exam_id', activeExam.exam.id);

        if (correctAnswers) {
          correctAnswers.forEach(correct => {
            const studentAnswer = activeExam.answers[correct.question_no];
            if (studentAnswer !== undefined) {
              const correctArr = String(correct.correct_answer || '').split(',').map(s => s.trim()).filter(Boolean);
              const isCorrect = correctArr.includes(String(studentAnswer).trim());
              if (isCorrect) {
                score += 1; // 1 mark per question for PDF
                correctCount++;
              } else {
                incorrectCount++;
              }
            }
          });
        }
      }

      // Fetch the specific in-progress attempt id to update (avoid updating multiple rows)
      const { data: attemptToUpdate } = await supabase
        .from('exam_attempts')
        .select('id')
        .eq('exam_id', activeExam.exam.id)
        .eq('student_id', profile?.id)
        .eq('status', 'started')
        .order('started_at', { ascending: false })
        .limit(1)
        .single();

      // Update attempt by specific id only
      const { error: attemptError } = await supabase
        .from('exam_attempts')
        .update({
          score,
          answers: activeExam.answers,
          status: 'submitted',
          submitted_at: new Date().toISOString(),
        })
        .eq('id', attemptToUpdate?.id ?? '');

      if (attemptError) throw attemptError;

      // Persist to full_test_results for easier reporting/ranking
      const { error: fullResultsError } = await supabase
        .from('full_test_results')
        .insert({
          exam_id: activeExam.exam.id,
          student_id: profile?.id,
          score,
          total_questions: totalQuestions,
          correct_answers: correctCount,
          incorrect_answers: incorrectCount,
        });

      if (fullResultsError) {
        console.error('Error saving full test results:', fullResultsError);
        // We don't necessarily want to block the success alert if the main attempt updated
      }

      showToast('Your answers have been submitted successfully. You can view your marks and rank after the exam ends.', 'success');
      setActiveExam(null);
      setView('upcoming');
      loadData();
    } catch (error) {
      console.error('Error submitting exam:', error);
      showToast('Failed to submit exam. Please try again.', 'error');
      // Only reset submitting state if we didn't successfully close the exam
      setActiveExam(prev => prev ? { ...prev, isSubmitting: false } : null);
    }
  };

  useEffect(() => {
    if (!activeExam || activeExam.isReviewing || activeExam.isSubmitting) return;

    const interval = setInterval(() => {
      const now = new Date();
      setCurrentTime(now);

      const examEndTime = new Date(activeExam.exam.end_time);
      const elapsedMs = now.getTime() - activeExam.startTime.getTime();
      const elapsedMinutes = elapsedMs / 60000;

      if (elapsedMinutes >= activeExam.exam.duration_minutes || now >= examEndTime) {
        clearInterval(interval);
        showToast('Time is up! Your exam is being automatically submitted.', 'warning');
        submitExam(true);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [activeExam]);

  // IntersectionObserver for mobile question visibility tracking
  useEffect(() => {
    if (!activeExam || activeExam.isPdf || activeExam.isReviewing) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const index = parseInt(entry.target.getAttribute('data-question-index') || '0');
            setMobileVisibleQuestion(index);
          }
        });
      },
      { threshold: 0.3 }
    );

    questionRefsRef.current.forEach((ref) => {
      if (ref) observer.observe(ref);
    });

    return () => {
      questionRefsRef.current.forEach((ref) => {
        if (ref) observer.unobserve(ref);
      });
    };
  }, [activeExam?.questions?.length, activeExam?.isPdf, activeExam?.isReviewing]);

  const getRemainingTimeDisplay = () => {
    if (!activeExam) return { text: '0m 0s', isWarning: false };

    const maxDurationMs = activeExam.exam.duration_minutes * 60000;
    const timerEndTime = activeExam.startTime.getTime() + maxDurationMs;
    const examEndTime = new Date(activeExam.exam.end_time).getTime();

    // Choose the sooner closure time
    const hardEndTime = Math.min(timerEndTime, examEndTime);
    const msRemaining = Math.max(0, hardEndTime - currentTime.getTime());

    const m = Math.floor(msRemaining / 60000);
    const s = Math.floor((msRemaining % 60000) / 1000);

    return {
      text: `${m}m ${s}s`,
      isWarning: msRemaining > 0 && msRemaining <= 300000 // Last 5 minutes
    };
  };

  if (activeExam) {
    // -------------------------------------------------------------------------
    // RENDER: REVIEW MODE
    // -------------------------------------------------------------------------
    if (activeExam.isReviewing) {
      const totalQuestions = activeExam.isPdf ? (activeExam.pdfQuestionCount || 0) : (activeExam.questions?.length || 0);
      const answeredCount = Object.keys(activeExam.answers).length;

      return (
        <div className="p-3 sm:p-4 md:p-8 bg-gray-50 min-h-screen">
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-gray-200 overflow-hidden mb-6 sm:mb-8">
              <div className="bg-[#eb1b23] p-4 sm:p-6 text-white text-center">
                <AlertCircle className="w-10 sm:w-12 h-10 sm:h-12 mx-auto mb-2 opacity-80" />
                <h2 className="text-xl sm:text-2xl font-bold">Review Your Answers</h2>
                <p className="text-sm sm:text-base opacity-90">Please verify your answers before final confirmation.</p>
              </div>

              <div className="p-4 sm:p-6 md:p-8">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4 mb-6 sm:mb-8 text-center">
                  <div className="bg-gray-50 rounded-lg sm:rounded-xl p-3 sm:p-4">
                    <p className="text-xs text-gray-500 mb-1">Total</p>
                    <p className="text-xl sm:text-2xl font-bold text-gray-900">{totalQuestions}</p>
                  </div>
                  <div className="bg-green-50 rounded-lg sm:rounded-xl p-3 sm:p-4">
                    <p className="text-xs text-green-600 mb-1">Marked</p>
                    <p className="text-xl sm:text-2xl font-bold text-green-700">{answeredCount}</p>
                  </div>
                  <div className="bg-red-50 rounded-lg sm:rounded-xl p-3 sm:p-4">
                    <p className="text-xs text-red-600 mb-1">Skipped</p>
                    <p className="text-xl sm:text-2xl font-bold text-red-700">{totalQuestions - answeredCount}</p>
                  </div>
                  <div className="bg-blue-50 rounded-lg sm:rounded-xl p-3 sm:p-4">
                    <p className="text-xs text-blue-600 mb-1">Time Spent</p>
                    <p className="text-xl sm:text-2xl font-bold text-blue-700">
                      {Math.floor((new Date().getTime() - activeExam.startTime.getTime()) / 60000)}m
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-5 sm:grid-cols-6 md:grid-cols-8 gap-2 sm:gap-3 mb-6 sm:mb-8">
                  {Array.from({ length: totalQuestions }).map((_, i) => {
                    const questionNo = i + 1;
                    const qData = activeExam.questions?.[i];
                    const answerKey = activeExam.isPdf ? questionNo : (qData?.question_number as number);
                    const answer = activeExam.answers[answerKey];
                    const hasAnswer = answer !== undefined;

                    return (
                      <button
                        key={i}
                        onClick={() => setActiveExam({ ...activeExam, isReviewing: false, currentQuestion: i })}
                        className={`aspect-square rounded-lg sm:rounded-xl flex flex-col items-center justify-center transition-all border-2 text-xs sm:text-sm ${hasAnswer
                            ? 'bg-[#eb1b23] border-[#eb1b23] text-white shadow-md shadow-red-100'
                            : 'bg-white border-gray-100 text-gray-400 hover:border-[#eb1b23] hover:text-[#eb1b23]'
                          }`}
                      >
                        <span className="text-[8px] sm:text-[10px] uppercase font-bold opacity-70 mb-0.5">Q{questionNo}</span>
                        <span className="font-black text-sm sm:text-lg">{hasAnswer ? answer : '-'}</span>
                      </button>
                    );
                  })}
                </div>

                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                  <button
                    onClick={() => setActiveExam({ ...activeExam, isReviewing: false })}
                    className="flex-1 px-6 sm:px-8 py-3 sm:py-4 bg-white border-2 border-gray-200 text-gray-700 font-bold rounded-lg sm:rounded-xl hover:border-gray-300 transition text-sm sm:text-base"
                  >
                    Back to Exam
                  </button>
                  <button
                    onClick={() => submitExam()}
                    disabled={activeExam.isSubmitting}
                    className="flex-1 px-6 sm:px-8 py-3 sm:py-4 bg-green-600 text-white font-bold rounded-lg sm:rounded-xl hover:bg-green-700 shadow-lg shadow-green-100 transition flex items-center justify-center space-x-2 disabled:opacity-50 text-sm sm:text-base"
                  >
                    {activeExam.isSubmitting ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <Save className="w-4 sm:w-5 h-4 sm:h-5" />
                        <span>Confirm & Submit</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // -------------------------------------------------------------------------
    // RENDER: TAKING MODE (PDF OR MANUAL)
    // -------------------------------------------------------------------------
    const totalQuestions = activeExam.isPdf ? (activeExam.pdfQuestionCount || 0) : (activeExam.questions?.length || 0);
    const answeredCount = Object.keys(activeExam.answers).length;

    return (
      <div className="fixed inset-0 bg-gray-100 z-50 flex flex-col">
        {/* Exam Header */}
        <div className="bg-white border-b px-3 sm:px-6 py-3 sm:py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4">
          <div className="flex items-center space-x-2 sm:space-x-4 min-w-0 flex-1">
            <div className="bg-red-50 p-2 rounded-lg flex-shrink-0">
              <FileText className="w-5 sm:w-6 h-5 sm:h-6 text-[#eb1b23]" />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-base sm:text-xl font-bold text-gray-900 truncate">{activeExam.exam.title}</h2>
              <div className="flex items-center space-x-1 sm:space-x-3 text-xs sm:text-sm text-gray-500 overflow-x-auto">
                <span className="truncate">{activeExam.exam.subject}</span>
                <span className="flex-shrink-0">•</span>
                <span className={`flex items-center flex-shrink-0 ${getRemainingTimeDisplay().isWarning ? 'text-[#eb1b23] font-bold animate-pulse' : ''}`}>
                  <Clock className="w-3 sm:w-4 h-3 sm:h-4 mr-1" />
                  {getRemainingTimeDisplay().text}
                </span>
              </div>
              {/* Mobile Progress Indicator */}
              {!activeExam.isPdf && (
                <p className="md:hidden text-xs font-bold text-[#eb1b23] mt-1">
                  Question {mobileVisibleQuestion + 1} of {activeExam.questions?.length || 0}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-2 sm:space-x-4 flex-shrink-0">
            <div className="hidden sm:block text-right">
              <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">Progress</p>
              <p className="font-bold text-gray-900 text-sm">{answeredCount} / {totalQuestions}</p>
            </div>
            <button
              onClick={() => submitExam()}
              className="bg-[#eb1b23] text-white px-3 sm:px-6 py-2 sm:py-2.5 rounded-lg font-bold text-sm sm:text-base hover:bg-red-700 transition shadow-lg shadow-red-100 whitespace-nowrap"
            >
              Review
            </button>
          </div>
        </div>

        {/* Mobile View Toggle (Only for PDF) */}
        {activeExam.isPdf && (
          <div className="md:hidden flex bg-white border-b sticky top-0 z-10">
            <button
              onClick={() => setActiveExam({ ...activeExam, pdfView: 'paper' })}
              className={`flex-1 py-3 text-sm font-bold border-b-2 transition-colors ${activeExam.pdfView === 'paper' ? 'border-[#eb1b23] text-[#eb1b23]' : 'border-transparent text-gray-400'
                }`}
            >
              Question Paper
            </button>
            <button
              onClick={() => setActiveExam({ ...activeExam, pdfView: 'answers' })}
              className={`flex-1 py-3 text-sm font-bold border-b-2 transition-colors ${activeExam.pdfView === 'answers' ? 'border-[#eb1b23] text-[#eb1b23]' : 'border-transparent text-gray-400'
                }`}
            >
              Answer Sheet
            </button>
          </div>
        )}

        {/* Exam Body */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* Left Panel: Content (PDF or Manual Question) */}
          <div className={`flex-1 bg-gray-200 overflow-auto relative min-h-0 ${activeExam.isPdf && activeExam.pdfView === 'answers' ? 'hidden md:block' : 'block'
            }`}>
            {activeExam.isPdf ? (
              activeExam.pdfUrl ? (
                <iframe
                  src={activeExam.pdfUrl}
                  className="w-full h-full border-none"
                  title="Exam Paper"
                />
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500">
                  Loading PDF Paper...
                </div>
              )
            ) : (
              <>
                {/* Desktop View: Single Question */}
                <div className="hidden md:block p-6 lg:p-8 max-w-3xl mx-auto w-full h-full overflow-auto">
                  {activeExam.questions && activeExam.questions[activeExam.currentQuestion] && (
                    <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-8 shadow-sm">
                      <div className="text-xs sm:text-sm font-bold text-[#eb1b23] mb-3 sm:mb-4 uppercase tracking-widest">
                        Question {activeExam.currentQuestion + 1}
                      </div>
                      <h3 className="text-lg sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-8 leading-relaxed">
                        {activeExam.questions[activeExam.currentQuestion].question_text}
                      </h3>

                      {/* Display image if present */}
                      {activeExam.questions[activeExam.currentQuestion].image_path && (
                        <div className="mb-4 sm:mb-8 rounded-lg overflow-hidden bg-gray-50 border border-gray-200 flex items-center justify-center p-3 sm:p-4">
                          <img
                            src={supabase.storage.from('acp').getPublicUrl(activeExam.questions[activeExam.currentQuestion].image_path!.replace('acp/', '')).data.publicUrl}
                            alt={`Question ${activeExam.currentQuestion + 1}`}
                            className="max-w-full max-h-72 sm:max-h-96 object-contain"
                          />
                        </div>
                      )}

                      <div className="space-y-3 sm:space-y-4">
                        {activeExam.questions[activeExam.currentQuestion].options.map((option, idx) => {
                          const optNum = String(idx + 1);
                          const currentQuestionData = activeExam.questions![activeExam.currentQuestion];
                          const answerKey = currentQuestionData.question_number;
                          const currentAnswerObj = activeExam.answers[answerKey] as string;
                          const isSelected = currentAnswerObj === optNum;
                          return (
                            <button
                              key={idx}
                              onClick={() => selectAnswer(activeExam.currentQuestion, optNum)}
                              className={`w-full text-left p-3 sm:p-5 rounded-lg sm:rounded-xl border-2 transition-all flex items-center group ${isSelected
                                  ? 'border-[#eb1b23] bg-red-50 shadow-md shadow-red-50'
                                  : 'border-gray-100 hover:border-gray-200 hover:bg-gray-50'
                                }`}
                            >
                              <span className={`w-8 sm:w-10 h-8 sm:h-10 rounded-lg flex items-center justify-center font-bold mr-2 sm:mr-4 text-sm sm:text-base transition-colors flex-shrink-0 ${isSelected ? 'bg-[#eb1b23] text-white' : 'bg-gray-100 text-gray-500 group-hover:bg-gray-200'
                                }`}>
                                {idx + 1}
                              </span>
                              <span className={`text-base sm:text-lg font-medium ${isSelected ? 'text-gray-900' : 'text-gray-700'} break-words`}>
                                {option}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {/* Mobile View: Vertical Flow of All Questions */}
                <div className="md:hidden p-3 sm:p-6 w-full h-full overflow-auto scroll-smooth">
                  <div className="space-y-6">
                    {activeExam.questions?.map((question, qIdx) => {
                      const answeredCount = Object.keys(activeExam.answers).length;
                      const totalQuestions = activeExam.questions?.length || 0;
                      return (
                        <div
                          key={qIdx}
                          ref={(el) => { questionRefsRef.current[qIdx] = el; }}
                          data-question-index={qIdx}
                          className="bg-white rounded-xl p-4 sm:p-6 shadow-sm"
                        >
                          <div className="text-xs sm:text-sm font-bold text-[#eb1b23] mb-3 sm:mb-4 uppercase tracking-widest flex justify-between items-center">
                            <span>Question {qIdx + 1}</span>
                            <span className="text-xs font-normal text-gray-500 bg-gray-100 px-2 py-1 rounded">
                              {answeredCount} / {totalQuestions}
                            </span>
                          </div>
                          <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-4 sm:mb-6 leading-relaxed">
                            {question.question_text}
                          </h3>

                          {/* Display image if present */}
                          {question.image_path && (
                            <div className="mb-4 sm:mb-6 rounded-lg overflow-hidden bg-gray-50 border border-gray-200 flex items-center justify-center p-3 sm:p-4">
                              <img
                                src={supabase.storage.from('acp').getPublicUrl(question.image_path!.replace('acp/', '')).data.publicUrl}
                                alt={`Question ${qIdx + 1}`}
                                className="max-w-full max-h-72 object-contain"
                              />
                            </div>
                          )}

                          <div className="flex flex-wrap gap-2">
                            {question.options.map((option, idx) => {
                              const optNum = String(idx + 1);
                              const answerKey = question.question_number;
                              const currentAnswerObj = activeExam.answers[answerKey] as string;
                              const isSelected = currentAnswerObj === optNum;
                              return (
                                <button
                                  key={idx}
                                  onClick={() => selectAnswer(qIdx, optNum)}
                                  className={`flex-1 min-w-[calc(50%-0.25rem)] p-2 rounded-lg border-2 transition-all flex items-center group justify-center ${isSelected
                                      ? 'border-[#eb1b23] bg-red-50 shadow-md shadow-red-50'
                                      : 'border-gray-100 hover:border-gray-200 hover:bg-gray-50'
                                    }`}
                                >
                                  <span className={`text-xs sm:text-sm font-medium text-center ${isSelected ? 'text-gray-900' : 'text-gray-700'} break-words`}>
                                    {option}
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  {/* Bottom Spacing for Mobile to Accommodate Fixed Footer */}
                  <div className="h-24"></div>
                </div>
              </>
            )}
          </div>

          {/* Right Panel: Navigation / Bubble Sheet - Hidden on Mobile for Manual Exams */}
          <div className={`w-full md:w-80 lg:w-96 bg-white border-l flex flex-col flex-1 md:flex-none min-h-0 ${!activeExam.isPdf ? 'hidden md:flex' : (activeExam.isPdf && activeExam.pdfView === 'paper' ? 'hidden md:flex' : 'flex')
            }`}>
            <div className="p-3 sm:p-6 border-b bg-gray-50 font-bold text-gray-700 text-sm sm:text-base">
              {activeExam.isPdf ? 'Answer Sheet' : 'Question Map'}
            </div>

            <div className="flex-1 overflow-y-auto p-3 sm:p-6">
              {activeExam.isPdf ? (
                // Bubble Sheet for PDF
                <div className="space-y-3 sm:space-y-6">
                  {Array.from({ length: activeExam.pdfQuestionCount || 0 }).map((_, i) => {
                    const qNo = i + 1;
                    return (
                      <div key={i} className="flex items-center space-x-2 sm:space-x-3">
                        <span className="w-5 sm:w-6 text-xs font-mono text-gray-400 flex-shrink-0">{qNo.toString().padStart(2, '0')}.</span>
                        <div className="flex-1 flex justify-between bg-gray-50 p-1.5 sm:p-2 rounded-lg border border-gray-100 gap-1">
                          {[1, 2, 3, 4, 5].map((val) => {
                            const isSelected = activeExam.answers[qNo] === val;
                            return (
                              <button
                                key={val}
                                onClick={() => selectAnswer(qNo, val)}
                                className={`w-6 sm:w-8 h-6 sm:h-8 rounded-full text-xs font-bold transition-all flex-shrink-0 flex items-center justify-center ${isSelected
                                    ? 'bg-[#eb1b23] text-white shadow-md'
                                    : 'bg-white text-gray-400 hover:bg-gray-100 hover:text-gray-600'
                                  }`}
                              >
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
                // Question grid for Manual
                <div className="grid grid-cols-4 sm:grid-cols-5 gap-2 sm:gap-3">
                  {activeExam.questions?.map((q, i) => {
                    const isSelected = activeExam.currentQuestion === i;
                    const isAnswered = activeExam.answers[q.question_number] !== undefined;
                    return (
                      <button
                        key={i}
                        onClick={() => setActiveExam({ ...activeExam, currentQuestion: i })}
                        className={`aspect-square rounded-lg sm:rounded-xl flex items-center justify-center font-bold text-xs sm:text-sm transition-all border-2 ${isSelected
                            ? 'border-[#eb1b23] bg-red-50 text-[#eb1b23] scale-105'
                            : isAnswered
                              ? 'border-green-100 bg-green-50 text-green-600'
                              : 'border-transparent bg-gray-50 text-gray-400 hover:bg-gray-100'
                          }`}
                      >
                        {i + 1}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {!activeExam.isPdf && (
              <div className="hidden md:grid p-3 sm:p-6 border-t bg-gray-50 grid-cols-2 gap-2 sm:gap-4">
                <button
                  onClick={() => setActiveExam({ ...activeExam, currentQuestion: Math.max(0, activeExam.currentQuestion - 1) })}
                  disabled={activeExam.currentQuestion === 0}
                  className="px-3 sm:px-4 py-2 sm:py-3 bg-white border border-gray-200 text-gray-700 rounded-lg sm:rounded-xl font-bold text-sm sm:text-base hover:bg-gray-100 transition disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  onClick={() => setActiveExam({ ...activeExam, currentQuestion: Math.min(totalQuestions - 1, activeExam.currentQuestion + 1) })}
                  disabled={activeExam.currentQuestion === totalQuestions - 1}
                  className="px-3 sm:px-4 py-2 sm:py-3 bg-[#eb1b23] text-white rounded-lg sm:rounded-xl font-bold text-sm sm:text-base hover:bg-red-700 transition shadow-lg shadow-red-100 disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Bottom Action Buttons - Fixed Footer */}
        {!activeExam.isPdf && (
          <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-3 sm:p-4 shadow-lg shadow-gray-300">
            <div className="flex gap-3 sm:gap-4">
              <button
                onClick={() => submitExam()}
                className="flex-1 bg-white border border-gray-300 text-gray-700 px-4 py-3 rounded-lg font-bold text-sm sm:text-base hover:bg-gray-100 transition"
              >
                Review
              </button>
              <button
                onClick={() => submitExam()}
                className="flex-1 bg-[#eb1b23] text-white px-4 py-3 rounded-lg font-bold text-sm sm:text-base hover:bg-red-700 transition shadow-lg shadow-red-100"
              >
                Submit
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  const viewResultDetails = async (attempt: ExamAttempt) => {
    try {
      setLoading(true);

      const { data: pdfData } = await supabase
        .from('pdf_exams')
        .select('*')
        .eq('exam_id', attempt.exam_id);

      const isPdf = !!(pdfData && pdfData.length > 0);
      let questions: ExamQuestion[] = [];
      let pdfUrl: string | null = null;
      let pdfAnswers: { question_no: number; correct_answer: string }[] = [];

      if (isPdf) {
        const pdfPath = pdfData![0].pdf_path;
        const storagePath = pdfPath.startsWith('acp/') ? pdfPath.slice(4) : pdfPath;
        const { data: urlData } = supabase.storage.from('acp').getPublicUrl(storagePath);
        pdfUrl = urlData?.publicUrl || null;

        const { data: answersData } = await supabase
          .from('pdf_exams')
          .select('question_no, correct_answer')
          .eq('exam_id', attempt.exam_id);

        pdfAnswers = answersData || [];
      } else {
        const { data: qData, error: qError } = await supabase
          .from('exam_questions')
          .select('*')
          .eq('exam_id', attempt.exam_id)
          .order('question_number', { ascending: true });

        if (qError) throw qError;
        questions = (qData || []).map(q => ({
          id: q.id,
          question_number: q.question_number,
          question_text: q.question_text,
          options: q.options || [],
          correct_answer: q.correct_answer,
          marks: q.marks,
          image_path: q.image_path,
        }));
      }

      let parsedAnswers = attempt.answers;
      if (typeof parsedAnswers === 'string') {
        try {
          parsedAnswers = JSON.parse(parsedAnswers);
        } catch (e) {
          parsedAnswers = {};
        }
      }

      setReviewingData({
        attempt: { ...attempt, answers: parsedAnswers },
        isPdf,
        pdfUrl,
        questions,
        pdfAnswers
      });

    } catch (error) {
      console.error('Error loading result details:', error);
      showToast('Failed to load exam details', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (reviewingData) {
    return (
      <div className="fixed inset-0 bg-gray-100 z-50 flex flex-col">
        <div className="bg-white border-b px-3 sm:px-6 py-3 sm:py-4 flex items-center justify-between gap-2">
          <h2 className="text-base sm:text-xl font-bold text-gray-900 truncate">Review: {reviewingData.attempt.exam.title}</h2>
          <button
            onClick={() => setReviewingData(null)}
            className="bg-white border text-[#eb1b23] border-[#eb1b23] px-3 sm:px-6 py-2 sm:py-2.5 rounded-lg sm:rounded-xl font-bold text-xs sm:text-base hover:bg-red-50 transition whitespace-nowrap flex-shrink-0"
          >
            Close Results
          </button>
        </div>
        <div className="flex-1 overflow-auto p-4 sm:p-8">
          <div className="max-w-6xl mx-auto">
            {reviewingData.isPdf ? (
              <div className="flex flex-col md:flex-row gap-6 h-[calc(100vh-120px)]">
                <div className="flex-1 bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                  {reviewingData.pdfUrl ? (
                    <iframe src={reviewingData.pdfUrl} className="w-full h-full border-none" />
                  ) : (
                    <div className="flex items-center justify-center h-full text-gray-400 font-bold">Paper unavailable</div>
                  )}
                </div>
                <div className="w-full md:w-96 bg-white rounded-2xl shadow-sm border border-gray-200 overflow-y-auto p-6">
                  <h3 className="font-bold text-xl mb-6 text-gray-900">Your Marking Map</h3>
                  <div className="space-y-4">
                    {reviewingData.pdfAnswers?.map((ans) => {
                      const studentChoice = String((reviewingData.attempt.answers as any)?.[ans.question_no] ?? '');
                      const correctArr = String(ans.correct_answer || '').split(',').map(s => s.trim()).filter(Boolean);
                      const hasAnswer = studentChoice !== '' && studentChoice !== 'undefined';
                      const isStudentCorrect = hasAnswer && correctArr.includes(studentChoice);

                      return (
                        <div key={ans.question_no} className="flex items-center space-x-3">
                          <span className="w-6 text-sm font-mono font-bold text-gray-500">{ans.question_no.toString().padStart(2, '0')}.</span>
                          <div className="flex-1 flex justify-between gap-1">
                            {[1, 2, 3, 4, 5].map(val => {
                              const valStr = String(val);
                              const isStu = hasAnswer && studentChoice === valStr;
                              const isCorrectOption = correctArr.includes(valStr);

                              // Determine bubble style
                              let bClass = "bg-gray-50 border-gray-200 text-gray-400";

                              if (isCorrectOption) {
                                // All correct answers always show green
                                bClass = "bg-green-500 border-green-600 text-white shadow-sm";
                              } else if (isStu) {
                                // Student picked this wrong answer
                                bClass = "bg-red-500 border-red-600 text-white shadow-sm";
                              }

                              return (
                                <div key={val} className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs font-bold transition-all ${bClass}`}>
                                  {val}
                                </div>
                              )
                            })}
                          </div>
                          {/* Result indicator */}
                          <div className="w-5 flex-shrink-0 text-center">
                            {hasAnswer ? (
                              isStudentCorrect
                                ? <span className="text-green-600 font-bold text-sm">✓</span>
                                : <span className="text-red-500 font-bold text-sm">✕</span>
                            ) : (
                              <span className="text-gray-300 text-sm">—</span>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {reviewingData.questions?.map((q, idx) => {
                  const studentAnswer = (reviewingData.attempt.answers as any)?.[q.question_number] as string;
                  const correctAnswers = (q.correct_answer || '').split(',').map(s => s.trim()).filter(Boolean);

                  // Student picks one answer; correct if it matches any of the correct answers
                  const isCorrect = studentAnswer ? correctAnswers.includes(studentAnswer.trim()) : false;

                  return (
                    <div key={idx} className="p-6 sm:p-8 border border-gray-200 rounded-3xl bg-white shadow-sm transition hover:shadow-md">
                      <div className="flex justify-between items-center mb-6 pb-6 border-b border-gray-100">
                        <h4 className="text-xl font-bold text-gray-900 border-l-4 border-[#eb1b23] pl-3">Question {q.question_number}</h4>
                        <div className={`font-bold px-4 py-2 rounded-full text-sm flex items-center shadow-sm border ${isCorrect ? 'bg-green-50 text-green-700 border-green-100' : 'bg-red-50 text-red-700 border-red-100'}`}>
                          {isCorrect ? 'Correct' : 'Incorrect'}
                          {/* <span className="ml-2 bg-white px-2 py-0.5 rounded text-xs shadow-sm">{isFullyCorrect ? q.marks : 0}/{q.marks}</span> */}
                        </div>
                      </div>

                      <p className="text-gray-800 text-lg mb-8 leading-relaxed whitespace-pre-wrap">{q.question_text}</p>

                      {q.image_path && (
                        <div className="mb-8 rounded-2xl overflow-hidden bg-gray-50 flex justify-center p-6 border border-gray-100">
                          <img
                            src={supabase.storage.from('acp').getPublicUrl(q.image_path.replace('acp/', '')).data.publicUrl}
                            className="max-h-80 object-contain rounded-lg shadow-sm"
                          />
                        </div>
                      )}

                      {/* Desktop Answer View */}
                      <div className="hidden md:block space-y-3">
                        {q.options.map((opt, optIdx) => {
                          const optNum = String(optIdx + 1);
                          const isStudentChoice = studentAnswer?.trim() === optNum.trim();
                          const isTrueCorrect = correctAnswers.includes(optNum.trim());

                          let bgClass = "bg-white border-gray-200 text-gray-700";
                          if (isTrueCorrect) {
                            bgClass = "bg-green-50 border-green-500 text-green-900 shadow-md ring-1 ring-green-100";
                          } else if (isStudentChoice) {
                            bgClass = "bg-red-50 border-red-500 text-red-900 shadow-sm";
                          }

                          return (
                            <div key={optIdx} className={`p-4 sm:p-5 border-2 rounded-2xl flex items-center transition-all ${bgClass}`}>
                              <span className={`w-10 h-10 flex items-center justify-center rounded-xl font-bold text-lg mr-4 ${isTrueCorrect ? 'bg-green-500 text-white shadow-sm' : isStudentChoice ? 'bg-red-500 text-white shadow-sm' : 'bg-gray-100 text-gray-500'}`}>
                                {optIdx + 1}
                              </span>
                              <span className="flex-1 font-semibold text-lg">{opt}</span>
                              {isTrueCorrect && <span className="ml-3 text-green-700 font-bold bg-white px-3 py-1.5 rounded-lg text-sm shadow-sm border border-green-200">Yes! Correct</span>}
                              {(!isTrueCorrect && isStudentChoice) && <span className="ml-3 text-red-700 font-bold bg-white px-3 py-1.5 rounded-lg text-sm shadow-sm border border-red-200">Your Pick</span>}
                            </div>
                          )
                        })}
                      </div>

                      {/* Mobile Answer View - Compact Layout */}
                      <div className="md:hidden flex flex-wrap gap-2">
                        {q.options.map((opt, optIdx) => {
                          const optNum = String(optIdx + 1);
                          const isStudentChoice = studentAnswer?.trim() === optNum.trim();
                          const isTrueCorrect = correctAnswers.includes(optNum.trim());

                          let containerClass = "border-gray-100 bg-gray-50";
                          let statusIcon = null;

                          if (isTrueCorrect && isStudentChoice) {
                            // Marked right - green with checkmark
                            containerClass = "border-green-500 bg-green-100";
                            statusIcon = "✓";
                          } else if (isStudentChoice && !isTrueCorrect) {
                            // Marked wrong - red with X
                            containerClass = "border-red-500 bg-red-100";
                            statusIcon = "✕";
                          } else if (isTrueCorrect) {
                            // Correct but not marked - green without mark
                            containerClass = "border-green-500 bg-green-100";
                            statusIcon = null;
                          }

                          return (
                            <div
                              key={optIdx}
                              className={`flex-1 min-w-[calc(50%-0.25rem)] p-2 rounded-lg border-2 transition-all flex items-center group justify-center relative ${containerClass}`}
                            >
                              <span className={`text-xs sm:text-sm font-medium text-center flex-1 ${isTrueCorrect || isStudentChoice ? 'text-gray-900 font-semibold' : 'text-gray-700'} break-words`}>
                                {opt}
                              </span>
                              {statusIcon && (
                                <span className={`absolute top-1 right-1 text-xs font-bold ${isTrueCorrect && isStudentChoice ? 'text-green-600' : 'text-red-600'}`}>
                                  {statusIcon}
                                </span>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#eb1b23]"></div>
      </div>
    );
  }

  return (
    <div className="h-full min-h-0 overflow-y-auto p-3 sm:p-6 lg:p-8 bg-gray-50/50">
      {/* Header Section */}
      <div className="mb-6 sm:mb-8">
        <div className="flex flex-col gap-4">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">Exams & Results</h2>
            <p className="text-slate-500 text-sm sm:text-base mt-1">Take exams and track your academic progress</p>
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4 mb-4 sm:mb-6">
        <div className="bg-white rounded-lg sm:rounded-xl p-3 sm:p-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="p-2 bg-blue-50 rounded-lg flex-shrink-0">
              <FileText className="w-4 sm:w-5 h-4 sm:h-5 text-blue-600" />
            </div>
            <div className="min-w-0">
              <p className="text-xl sm:text-2xl font-bold text-slate-900">{upcomingExams.length}</p>
              <p className="text-xs text-slate-500">Upcoming Exams</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg sm:rounded-xl p-3 sm:p-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="p-2 bg-green-50 rounded-lg flex-shrink-0">
              <CheckCircle2 className="w-4 sm:w-5 h-4 sm:h-5 text-green-600" />
            </div>
            <div className="min-w-0">
              <p className="text-xl sm:text-2xl font-bold text-slate-900">{results.length}</p>
              <p className="text-xs text-slate-500">Completed</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg sm:rounded-xl p-3 sm:p-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="p-2 bg-amber-50 rounded-lg flex-shrink-0">
              <Trophy className="w-4 sm:w-5 h-4 sm:h-5 text-amber-600" />
            </div>
            <div className="min-w-0">
              <p className="text-xl sm:text-2xl font-bold text-slate-900">
                {monthlyResults.length > 0 ? monthlyResults[0].totalScore : 0}
              </p>
              <p className="text-xs text-slate-500">Latest Monthly Sum</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg sm:rounded-xl p-3 sm:p-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="p-2 bg-red-50 rounded-lg flex-shrink-0">
              <Award className="w-4 sm:w-5 h-4 sm:h-5 text-[#eb1b23]" />
            </div>
            <div className="min-w-0">
              <p className="text-xl sm:text-2xl font-bold text-slate-900">
                {monthlyResults.length > 0 ? `#${monthlyResults[0].rank}` : 'N/A'}
              </p>
              <p className="text-xs text-slate-500">Latest Monthly Rank</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="border-b border-gray-100">
          <div className="flex p-1 sm:p-2 gap-1">
            <button
              onClick={() => setView('upcoming')}
              className={`flex-1 px-3 sm:px-6 py-2 sm:py-3 rounded-lg sm:rounded-xl text-xs sm:text-sm font-medium transition-all duration-200 ${view === 'upcoming'
                  ? 'bg-[#eb1b23] text-white shadow-md'
                  : 'text-slate-600 hover:bg-slate-50'
                }`}
            >
              <span className="flex items-center justify-center gap-1 sm:gap-2 flex-wrap">
                <Calendar className="w-3 sm:w-4 h-3 sm:h-4" />
                <span className="hidden sm:inline">Upcoming</span>
                <span className="sm:hidden">Exams</span>
                {upcomingExams.length > 0 && (
                  <span className={`px-2 py-0.5 rounded-full text-xs ${view === 'upcoming' ? 'bg-white/20' : 'bg-slate-100'}`}>
                    {upcomingExams.length}
                  </span>
                )}
              </span>
            </button>
            <button
              onClick={() => setView('results')}
              className={`flex-1 px-3 sm:px-6 py-2 sm:py-3 rounded-lg sm:rounded-xl text-xs sm:text-sm font-medium transition-all duration-200 ${view === 'results'
                  ? 'bg-[#eb1b23] text-white shadow-md'
                  : 'text-slate-600 hover:bg-slate-50'
                }`}
            >
              <span className="flex items-center justify-center gap-1 sm:gap-2 flex-wrap">
                <Award className="w-3 sm:w-4 h-3 sm:h-4" />
                <span className="hidden sm:inline">My Results</span>
                <span className="sm:hidden">Results</span>
                {results.length > 0 && (
                  <span className={`px-2 py-0.5 rounded-full text-xs ${view === 'results' ? 'bg-white/20' : 'bg-slate-100'}`}>
                    {results.length}
                  </span>
                )}
              </span>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-3 sm:p-6">
          {view === 'upcoming' ? (
            <div className="space-y-3 sm:space-y-4">
              {upcomingExams.length === 0 ? (
                <div className="text-center py-12 sm:py-16">
                  <div className="w-16 sm:w-20 h-16 sm:h-20 bg-slate-50 rounded-xl sm:rounded-2xl flex items-center justify-center mx-auto mb-3 sm:mb-4">
                    <FileQuestion className="w-8 sm:w-10 h-8 sm:h-10 text-slate-300" />
                  </div>
                  <h3 className="text-base sm:text-lg font-semibold text-slate-900 mb-2">No upcoming exams</h3>
                  <p className="text-slate-500 text-xs sm:text-sm max-w-sm mx-auto">
                    Check back later for new assessments. Your scheduled exams will appear here.
                  </p>
                </div>
              ) : (
                upcomingExams.map((exam) => {
                  const startTime = new Date(exam.start_time);
                  const endTime = new Date(exam.end_time);
                  const now = new Date();
                  const isActive = now >= startTime && now <= endTime;
                  const isPast = now > endTime;
                  const isUpcoming = now < startTime;

                  return (
                    <div
                      key={exam.id}
                      className="group bg-white border border-gray-100 rounded-lg sm:rounded-xl p-3 sm:p-5 hover:shadow-lg hover:border-[#eb1b23]/30 transition-all duration-300"
                    >
                      <div className="flex items-start gap-3 sm:gap-4">
                        {/* Subject Icon */}
                        <div className={`flex-shrink-0 w-12 sm:w-14 h-12 sm:h-14 rounded-lg sm:rounded-xl flex items-center justify-center text-lg sm:text-xl ${exam.subject.toLowerCase().includes('physics') ? 'bg-red-50 text-red-600' :
                            exam.subject.toLowerCase().includes('chemistry') ? 'bg-blue-50 text-blue-600' :
                              exam.subject.toLowerCase().includes('maths') || exam.subject.toLowerCase().includes('math') ? 'bg-purple-50 text-purple-600' :
                                exam.subject.toLowerCase().includes('bio') ? 'bg-green-50 text-green-600' :
                                  'bg-amber-50 text-amber-600'
                          }`}>
                          {exam.subject.toLowerCase().includes('maths') || exam.subject.toLowerCase().includes('math') ? (
                            <span className="font-bold">∑</span>
                          ) : exam.subject.toLowerCase().includes('physics') ? (
                            <span className="font-bold">⚛</span>
                          ) : exam.subject.toLowerCase().includes('chemistry') ? (
                            <span className="font-bold">⚗</span>
                          ) : exam.subject.toLowerCase().includes('bio') ? (
                            <span className="font-bold">🧬</span>
                          ) : (
                            <BookOpen className="w-5 sm:w-7 h-5 sm:h-7" />
                          )}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 sm:gap-3">
                            <div className="min-w-0">
                              <div className="flex items-center gap-1 sm:gap-2 mb-1 flex-wrap">
                                <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                                  {exam.subject}
                                </span>
                                {isActive && (
                                  <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700 animate-pulse whitespace-nowrap">
                                    Active
                                  </span>
                                )}
                                {isUpcoming && (
                                  <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700 whitespace-nowrap">
                                    Scheduled
                                  </span>
                                )}
                                {isPast && (
                                  <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600 whitespace-nowrap">
                                    Ended
                                  </span>
                                )}
                              </div>
                              <h4 className="text-base sm:text-lg font-bold text-slate-900 group-hover:text-[#eb1b23] transition-colors line-clamp-2">
                                {exam.title}
                              </h4>
                              {/* <p className="text-xs sm:text-sm text-slate-500 mt-1 line-clamp-1">{exam.description || 'No description'}</p> */}
                            </div>
                            {isActive && (
                              <button
                                onClick={() => startExam(exam)}
                                className="flex-shrink-0 flex items-center gap-1 sm:gap-2 px-3 sm:px-5 py-2 sm:py-2.5 bg-[#eb1b23] text-white rounded-lg sm:rounded-xl font-medium text-xs sm:text-base hover:bg-red-700 transition shadow-lg shadow-red-200 whitespace-nowrap"
                              >
                                <PlayCircle className="w-4 sm:w-5 h-4 sm:h-5" />
                                <span>Start</span>
                              </button>
                            )}
                          </div>

                          {/* Meta Info */}
                          <div className="flex flex-wrap items-center gap-2 sm:gap-4 mt-3 sm:mt-4 text-xs sm:text-sm text-slate-500">
                            <div className="flex items-center gap-1">
                              <Calendar className="w-3 sm:w-4 h-3 sm:h-4" />
                              <span>{startTime.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="w-3 sm:w-4 h-3 sm:h-4" />
                              <span>{startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <div className="w-1 h-1 rounded-full bg-slate-300"></div>
                              <span>{exam.duration_minutes} min</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <div className="w-1 h-1 rounded-full bg-slate-300"></div>
                              <span>{exam.total_marks} marks</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          ) : (
            <div className="space-y-3 sm:space-y-4">
              {monthlyResults.length === 0 ? (
                <div className="text-center py-12 sm:py-16">
                  <div className="w-16 sm:w-20 h-16 sm:h-20 bg-slate-50 rounded-xl sm:rounded-2xl flex items-center justify-center mx-auto mb-3 sm:mb-4">
                    <Award className="w-8 sm:w-10 h-8 sm:h-10 text-slate-300" />
                  </div>
                  <h3 className="text-base sm:text-lg font-semibold text-slate-900 mb-2">No results yet</h3>
                  <p className="text-slate-500 text-xs sm:text-sm max-w-sm mx-auto">
                    Complete exams to see your performance metrics and rankings here.
                  </p>
                </div>
              ) : (
                monthlyResults.map((monthly) => {
                  const percentage = Math.round((monthly.totalScore / monthly.totalPossibleMarks) * 100);

                  return (
                    <div
                      key={monthly.monthKey}
                      className="bg-white border border-gray-100 rounded-lg sm:rounded-xl p-3 sm:p-5 hover:shadow-lg transition-all duration-300"
                    >
                      <div className="flex flex-col gap-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-[#eb1b23]/5 rounded-lg">
                              <Calendar className="w-5 h-5 text-[#eb1b23]" />
                            </div>
                            <div>
                              <h4 className="text-lg font-bold text-slate-900">{monthly.month}</h4>
                              <p className="text-xs text-slate-500">{monthly.attempts.length} Tests Completed</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Monthly Rank</p>
                            <p className="text-3xl font-black text-[#eb1b23]">#{monthly.rank}</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3 sm:gap-4">
                          <div className="bg-slate-50 rounded-xl p-3 sm:p-4 flex flex-col items-center">
                            <p className="text-[10px] sm:text-xs text-slate-500 mb-1 uppercase tracking-wider font-bold">Total Marks</p>
                            <p className="text-lg sm:text-xl font-bold text-slate-900">{monthly.totalScore} / {monthly.totalPossibleMarks}</p>
                          </div>
                          <div className="bg-slate-50 rounded-xl p-3 sm:p-4 flex flex-col items-center">
                            <p className="text-[10px] sm:text-xs text-slate-500 mb-1 uppercase tracking-wider font-bold">Percentage</p>
                            <p className={`text-lg sm:text-xl font-bold ${percentage >= 75 ? 'text-green-600' : percentage >= 50 ? 'text-amber-600' : 'text-red-600'}`}>
                              {percentage}%
                            </p>
                          </div>
                        </div>

                        <div className="border-t border-dashed border-gray-100 pt-4 mt-2">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Individual Test Scores</p>
                          <div className="space-y-2">
                            {monthly.attempts.map((att) => (
                              <div key={att.id} className="flex items-center justify-between p-3 bg-gray-50/50 rounded-lg border border-gray-50 hover:bg-white hover:border-[#eb1b23]/20 transition-all group">
                                <div className="min-w-0 flex-1">
                                  <p className="text-sm font-bold text-slate-800 truncate group-hover:text-[#eb1b23]">{att.exam.title}</p>
                                  <p className="text-[10px] text-slate-500">{att.exam.subject} • {new Date(att.submitted_at).toLocaleDateString()}</p>
                                </div>
                                <div className="flex items-center gap-4">
                                  <div className="text-right">
                                    <p className="text-sm font-bold text-slate-900">{att.score}/{att.exam.total_marks}</p>
                                    <p className="text-[10px] text-[#eb1b23] font-medium">Rank #{att.rank}</p>
                                  </div>
                                  <button
                                    onClick={() => viewResultDetails(att)}
                                    className="p-2 hover:bg-[#eb1b23]/5 rounded-lg text-slate-400 hover:text-[#eb1b23] transition-colors"
                                    title="Review Details"
                                  >
                                    <FileText className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>
      </div>

      {/* Toast Notification */}
      {toast && (
        <div className={`fixed bottom-3 left-3 right-3 sm:bottom-6 sm:right-6 z-[100] transition-all duration-300 transform ${toast.visible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
          }`}>
          <div className={`flex items-center gap-2 sm:gap-3 px-3 sm:px-5 py-3 sm:py-4 rounded-lg sm:rounded-xl shadow-2xl border-l-4 ${toast.type === 'success' ? 'bg-white border-green-500 text-slate-800' :
              toast.type === 'error' ? 'bg-white border-red-500 text-slate-800' :
                toast.type === 'warning' ? 'bg-white border-amber-500 text-slate-800' :
                  'bg-white border-blue-500 text-slate-800'
            }`}>
            <div className={`p-1 sm:p-2 rounded-lg flex-shrink-0 ${toast.type === 'success' ? 'bg-green-100' :
                toast.type === 'error' ? 'bg-red-100' :
                  toast.type === 'warning' ? 'bg-amber-100' :
                    'bg-blue-100'
              }`}>
              {toast.type === 'success' ? <Check className="w-4 sm:w-5 h-4 sm:h-5 text-green-600" /> :
                toast.type === 'error' ? <AlertTriangle className="w-4 sm:w-5 h-4 sm:h-5 text-red-600" /> :
                  toast.type === 'warning' ? <AlertTriangle className="w-4 sm:w-5 h-4 sm:h-5 text-amber-600" /> :
                    <Info className="w-4 sm:w-5 h-4 sm:h-5 text-blue-600" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs sm:text-sm font-medium line-clamp-3">{toast.message}</p>
            </div>
            <button
              onClick={() => setToast(prev => prev ? { ...prev, visible: false } : null)}
              className="text-slate-400 hover:text-slate-600 transition-colors flex-shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
