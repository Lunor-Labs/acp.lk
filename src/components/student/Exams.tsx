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
}

interface ReviewingResultData {
  attempt: ExamAttempt;
  isPdf: boolean;
  pdfUrl?: string | null;
  questions?: ExamQuestion[];
  pdfAnswers?: { question_no: number; correct_answer: number }[];
}

export default function Exams() {
  const { profile } = useAuth();
  const [upcomingExams, setUpcomingExams] = useState<Exam[]>([]);
  const [results, setResults] = useState<ExamAttempt[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeExam, setActiveExam] = useState<ActiveExam | null>(null);
  const [view, setView] = useState<'upcoming' | 'results'>('upcoming');
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [reviewingData, setReviewingData] = useState<ReviewingResultData | null>(null);

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
      .select('id, status, started_at, answers')
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
          image_path: q.image_path,
        }));
      }

      // Create or get attempt
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

    if (activeExam.isPdf || typeof answerValue === 'number') {
      setActiveExam({
        ...activeExam,
        answers: { ...activeExam.answers, [questionIndex]: answerValue },
      });
      return;
    }

    const question = activeExam.questions?.[questionIndex];
    const isMultiChoice = question?.correct_answer?.includes(',');

    if (!isMultiChoice) {
      setActiveExam({
        ...activeExam,
        answers: { ...activeExam.answers, [questionIndex]: answerValue },
      });
      return;
    }

    const currentAnswerStr = (activeExam.answers[questionIndex] as string) || '';
    let selectedArr = currentAnswerStr ? currentAnswerStr.split(',') : [];

    if (selectedArr.includes(answerValue as string)) {
      selectedArr = selectedArr.filter(a => a !== answerValue);
    } else {
      selectedArr.push(answerValue as string);
      selectedArr.sort(); // Sort alphabetically (A, C) naturally
    }

    const newAnswerStr = selectedArr.join(',');

    setActiveExam({
      ...activeExam,
      answers: { ...activeExam.answers, [questionIndex]: newAnswerStr },
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
      const totalQuestions = activeExam.isPdf ? 50 : (activeExam.questions?.length || 0);

      if (!activeExam.isPdf && activeExam.questions) {
        activeExam.questions.forEach((q, idx) => {
          const studentAnswer = activeExam.answers[idx] as string;
          if (studentAnswer !== undefined && studentAnswer !== '') {
            const correctArr = (q.correct_answer || '').split(',');
            const studentArr = studentAnswer.split(',');
            
            const isFullyCorrect = 
              correctArr.length === studentArr.length && 
              correctArr.every(ca => studentArr.includes(ca));
              
            if (isFullyCorrect) {
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
        alert('Time is up! Your exam is being automatically submitted.');
        submitExam(true);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [activeExam]);

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
                    onClick={() => submitExam()}
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
                <span className={`flex items-center ${getRemainingTimeDisplay().isWarning ? 'text-[#eb1b23] font-bold animate-pulse' : ''}`}>
                  <Clock className="w-4 h-4 mr-1" />
                  Time Remaining: {getRemainingTimeDisplay().text}
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
              onClick={() => submitExam()}
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

                    {/* Display image if present */}
                    {activeExam.questions[activeExam.currentQuestion].image_path && (
                      <div className="mb-8 rounded-lg overflow-hidden bg-gray-50 border border-gray-200 flex items-center justify-center p-4">
                        <img
                          src={supabase.storage.from('acp').getPublicUrl(activeExam.questions[activeExam.currentQuestion].image_path!.replace('acp/', '')).data.publicUrl}
                          alt={`Question ${activeExam.currentQuestion + 1}`}
                          className="max-w-full max-h-96 object-contain"
                        />
                      </div>
                    )}

                    <div className="space-y-4">
                      {activeExam.questions[activeExam.currentQuestion].options.map((option, idx) => {
                        const letter = String.fromCharCode(65 + idx);
                        const currentAnswerObj = activeExam.answers[activeExam.currentQuestion] as string;
                        const isSelected = currentAnswerObj ? currentAnswerObj.split(',').includes(letter) : false;
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
      let pdfAnswers: { question_no: number; correct_answer: number }[] = [];

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
      alert('Failed to load exam details');
    } finally {
      setLoading(false);
    }
  };

  if (reviewingData) {
    return (
      <div className="fixed inset-0 bg-gray-100 z-50 flex flex-col">
        <div className="bg-white border-b px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">Review: {reviewingData.attempt.exam.title}</h2>
          <button
            onClick={() => setReviewingData(null)}
            className="bg-white border text-[#eb1b23] border-[#eb1b23] px-6 py-2.5 rounded-xl font-bold hover:bg-red-50 transition"
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
                      const studentChoice = (reviewingData.attempt.answers as any)?.[ans.question_no] as number;
                      return (
                        <div key={ans.question_no} className="flex items-center space-x-3">
                          <span className="w-6 text-sm font-mono font-bold text-gray-500">{ans.question_no.toString().padStart(2, '0')}.</span>
                          <div className="flex-1 flex justify-between gap-1">
                            {[1,2,3,4,5].map(val => {
                              const isStu = studentChoice === val;
                              const isTrue = ans.correct_answer === val;
                              let bClass = "bg-gray-50 border-gray-200 text-gray-400";
                              if (isTrue) bClass = "bg-green-500 border-green-600 text-white shadow-sm z-10 scale-105";
                              else if (isStu) bClass = "bg-red-500 border-red-600 text-white shadow-sm z-10 scale-105";

                              return (
                                <div key={val} className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs font-bold transition-all ${bClass}`}>
                                  {val}
                                </div>
                              )
                            })}
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
                  const studentAnswer = (reviewingData.attempt.answers as any)?.[idx] as string;
                  const correctAnswers = (q.correct_answer || '').split(',');
                  const studentAnswers = studentAnswer ? studentAnswer.split(',') : [];

                  const isFullyCorrect = 
                    correctAnswers.length === studentAnswers.length && 
                    correctAnswers.every(ca => studentAnswers.includes(ca));

                  return (
                    <div key={idx} className="p-6 sm:p-8 border border-gray-200 rounded-3xl bg-white shadow-sm transition hover:shadow-md">
                      <div className="flex justify-between items-center mb-6 pb-6 border-b border-gray-100">
                        <h4 className="text-xl font-bold text-gray-900 border-l-4 border-[#eb1b23] pl-3">Question {q.question_number}</h4>
                        <div className={`font-bold px-4 py-2 rounded-full text-sm flex items-center shadow-sm border ${isFullyCorrect ? 'bg-green-50 text-green-700 border-green-100' : 'bg-red-50 text-red-700 border-red-100'}`}>
                          {isFullyCorrect ? 'Full Marks' : 'Incorrect'} <span className="ml-2 bg-white px-2 py-0.5 rounded text-xs shadow-sm">{isFullyCorrect ? q.marks : 0}/{q.marks}</span>
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

                      <div className="space-y-3">
                        {q.options.map((opt, optIdx) => {
                          const letter = String.fromCharCode(65 + optIdx);
                          const isStudentChoice = studentAnswers.includes(letter);
                          const isTrueCorrect = correctAnswers.includes(letter);

                          let bgClass = "bg-white border-gray-200 text-gray-700";
                          if (isTrueCorrect) {
                            bgClass = "bg-green-50 border-green-500 text-green-900 shadow-md ring-1 ring-green-100"; 
                          } else if (isStudentChoice) {
                            bgClass = "bg-red-50 border-red-500 text-red-900 shadow-sm";
                          }
                          
                          return (
                            <div key={optIdx} className={`p-4 sm:p-5 border-2 rounded-2xl flex items-center transition-all ${bgClass}`}>
                              <span className={`w-10 h-10 flex items-center justify-center rounded-xl font-bold text-lg mr-4 ${isTrueCorrect ? 'bg-green-500 text-white shadow-sm' : isStudentChoice ? 'bg-red-500 text-white shadow-sm' : 'bg-gray-100 text-gray-500'}`}>
                                {letter}
                              </span>
                              <span className="flex-1 font-semibold text-lg">{opt}</span>
                              {isTrueCorrect && <span className="ml-3 text-green-700 font-bold bg-white px-3 py-1.5 rounded-lg text-sm shadow-sm border border-green-200">Yes! Correct</span>}
                              {(!isTrueCorrect && isStudentChoice) && <span className="ml-3 text-red-700 font-bold bg-white px-3 py-1.5 rounded-lg text-sm shadow-sm border border-red-200">Your Pick</span>}
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
                            Rank Pending
                          </span>
                        )}
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 mb-4">{result.exam.title}</h3>

                        <div className="grid grid-cols-3 gap-4 mb-4">
                          <div className="bg-gray-50 rounded-lg p-4 transition hover:bg-gray-100 border border-transparent hover:border-gray-200">
                            <div className="text-sm text-gray-600 mb-1 font-semibold uppercase tracking-wider">Score</div>
                            <div className="text-2xl font-bold text-gray-900">
                              {result.score}/{result.exam.total_marks}
                            </div>
                          </div>
                          <div className="bg-gray-50 rounded-lg p-4 transition hover:bg-gray-100 border border-transparent hover:border-gray-200">
                            <div className="text-sm text-gray-600 mb-1 font-semibold uppercase tracking-wider">Percentage</div>
                            <div className={`text-2xl font-bold ${
                              (result.score / result.exam.total_marks) >= 0.75 ? 'text-green-600' :
                              (result.score / result.exam.total_marks) >= 0.5 ? 'text-amber-600' :
                              'text-red-600'
                            }`}>
                              {Math.round((result.score / result.exam.total_marks) * 100)}%
                            </div>
                          </div>
                          <div className="bg-gray-50 rounded-lg p-4 transition hover:bg-gray-100 border border-transparent hover:border-gray-200">
                            <div className="text-sm text-gray-600 mb-1 font-semibold uppercase tracking-wider">Rank</div>
                            <div className="text-2xl font-bold text-[#eb1b23]">
                              {isExamEnded ? `#${result.rank || 'N/A'}` : 'Pending'}
                            </div>
                          </div>
                        </div>

                      {/* Action Buttons */}
                      <div className="flex flex-col sm:flex-row items-center justify-between pt-4 border-t border-gray-100 gap-4 mt-6">
                        {!isExamEnded ? (
                          <div className="flex items-center text-amber-600 bg-amber-50 px-4 py-2 rounded-lg text-sm font-semibold border border-amber-100">
                            <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0" />
                            Rankings hidden until {endTime.toLocaleDateString()}
                          </div>
                        ) : <div />}
                        <button
                          onClick={() => viewResultDetails(result)}
                          className="w-full sm:w-auto px-8 py-3.5 bg-white border-2 border-gray-200 text-gray-700 hover:border-[#eb1b23] hover:text-[#eb1b23] font-bold rounded-xl transition shadow-sm"
                        >
                          Review Answers
                        </button>
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
  );
}
