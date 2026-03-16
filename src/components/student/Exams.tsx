import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { FileText, Clock, Trophy, Award, Calendar, PlayCircle, AlertCircle, Save } from 'lucide-react';

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
}

interface ExamAttempt {
  id: string;
  exam_id: string;
  score: number;
  rank: number;
  submitted_at: string;
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
}

export default function Exams() {
  const { profile } = useAuth();
  const [upcomingExams, setUpcomingExams] = useState<Exam[]>([]);
  const [results, setResults] = useState<ExamAttempt[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeExam, setActiveExam] = useState<ActiveExam | null>(null);
  const [view, setView] = useState<'upcoming' | 'results'>('upcoming');

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

      // Calculate ranks dynamically for finished exams
      const resultsWithRanks = await Promise.all((resultsData || []).map(async (result) => {
        const endTime = new Date(result.exam.end_time);
        if (new Date() > endTime) {
          // Count how many students have a higher score for this specific exam
          const { count } = await supabase
            .from('exam_attempts')
            .select('*', { count: 'exact', head: true })
            .eq('exam_id', result.exam_id)
            .eq('status', 'submitted')
            .gt('score', result.score);
          
          return {
            ...result,
            rank: (count || 0) + 1
          };
        }
        return result;
      }));

      setResults(resultsWithRanks);
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
      alert('This exam has not started yet');
      return;
    }

    if (now > endTime) {
      alert('This exam has ended');
      return;
    }

    const { data: existingAttempt } = await supabase
      .from('exam_attempts')
      .select('id, status')
      .eq('exam_id', exam.id)
      .eq('student_id', profile?.id)
      .maybeSingle();

    if (existingAttempt && existingAttempt.status === 'submitted') {
      alert('You have already completed this exam');
      return;
    }

    try {
      setLoading(true);

      // 1. Check if it's a PDF exam
      const { data: pdfData } = await supabase
        .from('pdf_exams')
        .select('*')
        .eq('exam_id', exam.id)
        .limit(1);

      const isPdf = !!(pdfData && pdfData.length > 0);
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
        }));
      }

      // Create or get attempt
      let attemptId = existingAttempt?.id;
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
      }

      setActiveExam({
        exam,
        currentQuestion: 0,
        answers: {},
        startTime: new Date(),
        isPdf,
        pdfUrl,
        questions,
        pdfView: isPdf ? 'paper' : undefined,
      });
    } catch (error) {
      console.error('Error starting exam:', error);
      alert('Failed to start exam');
    } finally {
      setLoading(false);
    }
  };

  const selectAnswer = (questionIndex: number, answerValue: string | number) => {
    if (!activeExam) return;
    setActiveExam({
      ...activeExam,
      answers: { ...activeExam.answers, [questionIndex]: answerValue },
    });
  };

  const submitExam = async () => {
    if (!activeExam) return;

    // If not reviewing yet, switch to review mode
    if (!activeExam.isReviewing) {
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
      const totalQuestions = activeExam.isPdf ? 50 : (activeExam.questions?.length || 0);

      if (!activeExam.isPdf && activeExam.questions) {
        activeExam.questions.forEach((q, idx) => {
          const studentAnswer = activeExam.answers[idx];
          if (studentAnswer !== undefined) {
            if (studentAnswer === q.correct_answer) {
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
              if (studentAnswer === correct.correct_answer) {
                score += 1; // Assuming 1 mark per question for PDF
                correctCount++;
              } else {
                incorrectCount++;
              }
            }
          });
        }
      }

      // Update attempt
      const { error: attemptError } = await supabase
        .from('exam_attempts')
        .update({
          score,
          answers: activeExam.answers,
          status: 'submitted',
          submitted_at: new Date().toISOString(),
        })
        .eq('exam_id', activeExam.exam.id)
        .eq('student_id', profile?.id);

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

      alert('Your answers have been submitted successfully. You can view your marks and rank after the exam ends.');
      setActiveExam(null);
      setView('upcoming');
      loadData();
    } catch (error) {
      console.error('Error submitting exam:', error);
      alert('Failed to submit exam. Please try again.');
      // Only reset submitting state if we didn't successfully close the exam
      setActiveExam(prev => prev ? { ...prev, isSubmitting: false } : null);
    }
  };

  if (activeExam) {
    // -------------------------------------------------------------------------
    // RENDER: REVIEW MODE
    // -------------------------------------------------------------------------
    if (activeExam.isReviewing) {
      const totalQuestions = activeExam.isPdf ? 50 : (activeExam.questions?.length || 0);
      const answeredCount = Object.keys(activeExam.answers).length;

      return (
        <div className="p-4 sm:p-8 bg-gray-50 min-h-screen">
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden mb-8">
              <div className="bg-[#eb1b23] p-6 text-white text-center">
                <AlertCircle className="w-12 h-12 mx-auto mb-2 opacity-80" />
                <h2 className="text-2xl font-bold">Review Your Answers</h2>
                <p className="opacity-90">Please verify your answers before final confirmation.</p>
              </div>

              <div className="p-8">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8 text-center">
                  <div className="bg-gray-50 rounded-xl p-4">
                    <p className="text-sm text-gray-500 mb-1">Total</p>
                    <p className="text-2xl font-bold text-gray-900">{totalQuestions}</p>
                  </div>
                  <div className="bg-green-50 rounded-xl p-4">
                    <p className="text-sm text-green-600 mb-1">Marked</p>
                    <p className="text-2xl font-bold text-green-700">{answeredCount}</p>
                  </div>
                  <div className="bg-red-50 rounded-xl p-4">
                    <p className="text-sm text-red-600 mb-1">Skipped</p>
                    <p className="text-2xl font-bold text-red-700">{totalQuestions - answeredCount}</p>
                  </div>
                  <div className="bg-blue-50 rounded-xl p-4">
                    <p className="text-sm text-blue-600 mb-1">Time Spent</p>
                    <p className="text-2xl font-bold text-blue-700">
                      {Math.floor((new Date().getTime() - activeExam.startTime.getTime()) / 60000)}m
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-3 mb-8">
                  {Array.from({ length: totalQuestions }).map((_, i) => {
                    const questionNo = i + 1;
                    const idx = activeExam.isPdf ? questionNo : i;
                    const answer = activeExam.answers[idx];
                    const hasAnswer = answer !== undefined;

                    return (
                      <button
                        key={i}
                        onClick={() => setActiveExam({ ...activeExam, isReviewing: false, currentQuestion: i })}
                        className={`min-h-[64px] rounded-xl flex flex-col items-center justify-center transition-all border-2 ${
                          hasAnswer
                            ? 'bg-[#eb1b23] border-[#eb1b23] text-white shadow-md shadow-red-100'
                            : 'bg-white border-gray-100 text-gray-400 hover:border-[#eb1b23] hover:text-[#eb1b23]'
                        }`}
                      >
                        <span className="text-[10px] uppercase font-bold opacity-70 mb-0.5">Q{questionNo}</span>
                        <span className="text-lg font-black">{hasAnswer ? answer : '-'}</span>
                      </button>
                    );
                  })}
                </div>

                <div className="flex flex-col sm:flex-row gap-4">
                  <button
                    onClick={() => setActiveExam({ ...activeExam, isReviewing: false })}
                    className="flex-1 px-8 py-4 bg-white border-2 border-gray-200 text-gray-700 font-bold rounded-xl hover:border-gray-300 transition"
                  >
                    Back to Exam
                  </button>
                  <button
                    onClick={submitExam}
                    disabled={activeExam.isSubmitting}
                    className="flex-1 px-8 py-4 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 shadow-lg shadow-green-100 transition flex items-center justify-center space-x-2 disabled:opacity-50"
                  >
                    {activeExam.isSubmitting ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <Save className="w-5 h-5" />
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
    const totalQuestions = activeExam.isPdf ? 50 : (activeExam.questions?.length || 0);
    const answeredCount = Object.keys(activeExam.answers).length;

    return (
      <div className="fixed inset-0 bg-gray-100 z-50 flex flex-col">
        {/* Exam Header */}
        <div className="bg-white border-b px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="bg-red-50 p-2 rounded-lg">
              <FileText className="w-6 h-6 text-[#eb1b23]" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">{activeExam.exam.title}</h2>
              <div className="flex items-center space-x-3 text-sm text-gray-500">
                <span>{activeExam.exam.subject}</span>
                <span>•</span>
                <span className="flex items-center">
                  <Clock className="w-4 h-4 mr-1" />
                  Time Remaining: {Math.max(0, activeExam.exam.duration_minutes - Math.floor((new Date().getTime() - activeExam.startTime.getTime()) / 60000))} mins
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="hidden sm:block text-right">
              <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">Progress</p>
              <p className="font-bold text-gray-900">{answeredCount} / {totalQuestions} Answered</p>
            </div>
            <button
              onClick={submitExam}
              className="bg-[#eb1b23] text-white px-6 py-2.5 rounded-lg font-bold hover:bg-red-700 transition shadow-lg shadow-red-100"
            >
              Review & Submit
            </button>
          </div>
        </div>

        {/* Mobile View Toggle (Only for PDF) */}
        {activeExam.isPdf && (
          <div className="md:hidden flex bg-white border-b sticky top-0 z-10">
            <button
              onClick={() => setActiveExam({ ...activeExam, pdfView: 'paper' })}
              className={`flex-1 py-3 text-sm font-bold border-b-2 transition-colors ${
                activeExam.pdfView === 'paper' ? 'border-[#eb1b23] text-[#eb1b23]' : 'border-transparent text-gray-400'
              }`}
            >
              Question Paper
            </button>
            <button
              onClick={() => setActiveExam({ ...activeExam, pdfView: 'answers' })}
              className={`flex-1 py-3 text-sm font-bold border-b-2 transition-colors ${
                activeExam.pdfView === 'answers' ? 'border-[#eb1b23] text-[#eb1b23]' : 'border-transparent text-gray-400'
              }`}
            >
              Answer Sheet
            </button>
          </div>
        )}

        {/* Exam Body */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* Left Panel: Content (PDF or Manual Question) */}
          <div className={`flex-1 bg-gray-200 overflow-auto relative min-h-0 ${
            activeExam.isPdf && activeExam.pdfView === 'answers' ? 'hidden md:block' : 'block'
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
              <div className="p-8 max-w-3xl mx-auto">
                {activeExam.questions && activeExam.questions[activeExam.currentQuestion] && (
                  <div className="bg-white rounded-2xl p-8 shadow-sm">
                    <div className="text-sm font-bold text-[#eb1b23] mb-4 uppercase tracking-widest">
                      Question {activeExam.currentQuestion + 1}
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-8 leading-relaxed">
                      {activeExam.questions[activeExam.currentQuestion].question_text}
                    </h3>

                    <div className="space-y-4">
                      {activeExam.questions[activeExam.currentQuestion].options.map((option, idx) => {
                        const letter = String.fromCharCode(65 + idx);
                        const isSelected = activeExam.answers[activeExam.currentQuestion] === letter;
                        return (
                          <button
                            key={idx}
                            onClick={() => selectAnswer(activeExam.currentQuestion, letter)}
                            className={`w-full text-left p-5 rounded-xl border-2 transition-all flex items-center group ${
                              isSelected
                                ? 'border-[#eb1b23] bg-red-50 shadow-md shadow-red-50'
                                : 'border-gray-100 hover:border-gray-200 hover:bg-gray-50'
                            }`}
                          >
                            <span className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold mr-4 transition-colors ${
                              isSelected ? 'bg-[#eb1b23] text-white' : 'bg-gray-100 text-gray-500 group-hover:bg-gray-200'
                            }`}>
                              {letter}
                            </span>
                            <span className={`text-lg font-medium ${isSelected ? 'text-gray-900' : 'text-gray-700'}`}>
                              {option}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Panel: Navigation / Bubble Sheet */}
          <div className={`w-full md:w-80 lg:w-96 bg-white border-l flex flex-col flex-1 md:flex-none min-h-0 ${
            activeExam.isPdf && activeExam.pdfView === 'paper' ? 'hidden md:flex' : 'flex'
          }`}>
            <div className="p-6 border-b bg-gray-50 font-bold text-gray-700">
              {activeExam.isPdf ? 'Answer Sheet' : 'Question Map'}
            </div>
            
            <div className="flex-1 overflow-y-auto p-6">
              {activeExam.isPdf ? (
                // Bubble Sheet for PDF
                <div className="space-y-6">
                  {Array.from({ length: 50 }).map((_, i) => {
                    const qNo = i + 1;
                    return (
                      <div key={i} className="flex items-center space-x-3">
                        <span className="w-6 text-sm font-mono text-gray-400">{qNo.toString().padStart(2, '0')}.</span>
                        <div className="flex-1 flex justify-between bg-gray-50 p-2 rounded-lg border border-gray-100">
                          {[1, 2, 3, 4, 5].map((val) => {
                            const isSelected = activeExam.answers[qNo] === val;
                            return (
                              <button
                                key={val}
                                onClick={() => selectAnswer(qNo, val)}
                                className={`w-8 h-8 rounded-full text-xs font-bold transition-all ${
                                  isSelected
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
                <div className="grid grid-cols-4 sm:grid-cols-5 gap-3">
                  {activeExam.questions?.map((_, i) => {
                    const isSelected = activeExam.currentQuestion === i;
                    const isAnswered = activeExam.answers[i] !== undefined;
                    return (
                      <button
                        key={i}
                        onClick={() => setActiveExam({ ...activeExam, currentQuestion: i })}
                        className={`aspect-square rounded-xl flex items-center justify-center font-bold text-sm transition-all border-2 ${
                          isSelected
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
              <div className="p-6 border-t bg-gray-50 grid grid-cols-2 gap-4">
                <button
                  onClick={() => setActiveExam({ ...activeExam, currentQuestion: Math.max(0, activeExam.currentQuestion - 1) })}
                  disabled={activeExam.currentQuestion === 0}
                  className="px-4 py-3 bg-white border border-gray-200 text-gray-700 rounded-xl font-bold hover:bg-gray-100 transition disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  onClick={() => setActiveExam({ ...activeExam, currentQuestion: Math.min(totalQuestions - 1, activeExam.currentQuestion + 1) })}
                  disabled={activeExam.currentQuestion === totalQuestions - 1}
                  className="px-4 py-3 bg-[#eb1b23] text-white rounded-xl font-bold hover:bg-red-700 transition shadow-lg shadow-red-100 disabled:opacity-50"
                >
                  Next
                </button>
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
    <div className="p-8">
      <div className="mb-6">
        <h2 className="text-3xl font-bold text-gray-900">Exams & Results</h2>
        <p className="text-gray-600 mt-1">Take exams and view your performance</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm mb-6">
        <div className="flex border-b">
          <button
            onClick={() => setView('upcoming')}
            className={`flex-1 px-6 py-4 font-medium transition ${
              view === 'upcoming'
                ? 'text-[#eb1b23] border-b-2 border-[#eb1b23]'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Upcoming Exams
          </button>
          <button
            onClick={() => setView('results')}
            className={`flex-1 px-6 py-4 font-medium transition ${
              view === 'results'
                ? 'text-[#eb1b23] border-b-2 border-[#eb1b23]'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            My Results
          </button>
        </div>
      </div>

      {view === 'upcoming' ? (
        <div className="space-y-4">
          {upcomingExams.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm p-12 text-center">
              <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No upcoming exams</h3>
              <p className="text-gray-600">Check back later for new assessments</p>
            </div>
          ) : (
            upcomingExams.map((exam) => {
              const startTime = new Date(exam.start_time);
              const endTime = new Date(exam.end_time);
              const now = new Date();
              const isActive = now >= startTime && now <= endTime;
              const isPast = now > endTime;

              return (
                <div key={exam.id} className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold">
                          {exam.subject}
                        </span>
                        {isActive && (
                          <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">
                            ACTIVE NOW
                          </span>
                        )}
                        {isPast && (
                          <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-semibold">
                            ENDED
                          </span>
                        )}
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 mb-2">{exam.title}</h3>
                      <p className="text-sm text-gray-600 mb-4">{exam.description}</p>

                      <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                        <div className="flex items-center space-x-1">
                          <Calendar className="w-4 h-4" />
                          <span>{startTime.toLocaleDateString()} at {startTime.toLocaleTimeString()}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Clock className="w-4 h-4" />
                          <span>{exam.duration_minutes} minutes</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Trophy className="w-4 h-4" />
                          <span>{exam.total_marks} marks</span>
                        </div>
                      </div>
                    </div>

                    {isActive && (
                      <button
                        onClick={() => startExam(exam)}
                        className="flex items-center space-x-2 px-6 py-3 bg-[#eb1b23] text-white rounded-lg hover:bg-red-700 transition ml-4"
                      >
                        <PlayCircle className="w-5 h-5" />
                        <span>Start Exam</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {results.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm p-12 text-center">
              <Award className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No results yet</h3>
              <p className="text-gray-600">Complete exams to see your results here</p>
            </div>
          ) : (
            results.map((result) => {
              const endTime = new Date(result.exam.end_time);
              const now = new Date();
              const isExamEnded = now > endTime;

              return (
                <div key={result.id} className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold">
                          {result.exam.subject}
                        </span>
                        <span className="text-xs text-gray-500">
                          Submitted on {new Date(result.submitted_at).toLocaleDateString()}
                        </span>
                        {!isExamEnded && (
                          <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-semibold flex items-center">
                            <Clock className="w-3 h-3 mr-1" />
                            Results Pending
                          </span>
                        )}
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 mb-4">{result.exam.title}</h3>

                      {isExamEnded ? (
                        <div className="grid grid-cols-3 gap-4">
                          <div className="bg-gray-50 rounded-lg p-4">
                            <div className="text-sm text-gray-600 mb-1">Score</div>
                            <div className="text-2xl font-bold text-gray-900">
                              {result.score}/{result.exam.total_marks}
                            </div>
                          </div>
                          <div className="bg-gray-50 rounded-lg p-4">
                            <div className="text-sm text-gray-600 mb-1">Percentage</div>
                            <div className={`text-2xl font-bold ${
                              (result.score / result.exam.total_marks) >= 0.75 ? 'text-green-600' :
                              (result.score / result.exam.total_marks) >= 0.5 ? 'text-amber-600' :
                              'text-red-600'
                            }`}>
                              {Math.round((result.score / result.exam.total_marks) * 100)}%
                            </div>
                          </div>
                          <div className="bg-gray-50 rounded-lg p-4">
                            <div className="text-sm text-gray-600 mb-1">Rank</div>
                            <div className="text-2xl font-bold text-[#eb1b23]">
                              #{result.rank || 'N/A'}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 flex items-center text-amber-800">
                          <AlertCircle className="w-5 h-5 mr-3 flex-shrink-0" />
                          <p className="text-sm">
                            Your answers are safely recorded. Detailed marks and rankings will be revealed on 
                            <strong className="ml-1">{endTime.toLocaleDateString()} at {endTime.toLocaleTimeString()}</strong> after the exam officially ends.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
