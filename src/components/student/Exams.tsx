import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { FileText, Clock, Trophy, Award, CheckCircle, XCircle, Calendar, PlayCircle } from 'lucide-react';

interface Exam {
  id: string;
  title: string;
  description: string;
  subject: string;
  duration_minutes: number;
  total_marks: number;
  start_time: string;
  end_time: string;
  questions: ExamQuestion[];
  class: {
    title: string;
  };
}

interface ExamQuestion {
  question: string;
  options: string[];
  correct_answer: number;
}

interface ExamAttempt {
  id: string;
  exam_id: string;
  score: number;
  percentage: number;
  rank: number;
  submitted_at: string;
  exam: {
    title: string;
    subject: string;
    total_marks: number;
  };
}

interface ActiveExam {
  exam: Exam;
  currentQuestion: number;
  answers: Record<number, number>;
  startTime: Date;
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

      const { data: enrollments } = await supabase
        .from('enrollments')
        .select('class_id')
        .eq('student_id', profile?.id)
        .eq('is_active', true);

      const classIds = enrollments?.map(e => e.class_id) || [];

      if (classIds.length > 0) {
        const { data: examsData } = await supabase
          .from('exams')
          .select(`
            *,
            class:classes(title)
          `)
          .in('class_id', classIds)
          .gte('end_time', new Date().toISOString())
          .order('start_time', { ascending: true });

        setUpcomingExams(examsData || []);
      }

      const { data: resultsData } = await supabase
        .from('exam_attempts')
        .select(`
          *,
          exam:exams(title, subject, total_marks)
        `)
        .eq('student_id', profile?.id)
        .not('submitted_at', 'is', null)
        .order('submitted_at', { ascending: false });

      setResults(resultsData || []);
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
      .select('id')
      .eq('exam_id', exam.id)
      .eq('student_id', profile?.id)
      .maybeSingle();

    if (existingAttempt) {
      alert('You have already completed this exam');
      return;
    }

    const { data: attemptData, error } = await supabase
      .from('exam_attempts')
      .insert({
        exam_id: exam.id,
        student_id: profile?.id,
        score: 0,
        percentage: 0,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating exam attempt:', error);
      alert('Failed to start exam');
      return;
    }

    setActiveExam({
      exam,
      currentQuestion: 0,
      answers: {},
      startTime: new Date(),
    });
  };

  const selectAnswer = (questionIndex: number, answerIndex: number) => {
    if (!activeExam) return;
    setActiveExam({
      ...activeExam,
      answers: { ...activeExam.answers, [questionIndex]: answerIndex },
    });
  };

  const submitExam = async () => {
    if (!activeExam) return;

    let correctCount = 0;
    activeExam.exam.questions.forEach((q, idx) => {
      if (activeExam.answers[idx] === q.correct_answer) {
        correctCount++;
      }
    });

    const totalQuestions = activeExam.exam.questions.length;
    const score = Math.round((correctCount / totalQuestions) * activeExam.exam.total_marks);
    const percentage = Math.round((correctCount / totalQuestions) * 100);

    const { data: allAttempts } = await supabase
      .from('exam_attempts')
      .select('percentage')
      .eq('exam_id', activeExam.exam.id)
      .not('submitted_at', 'is', null)
      .order('percentage', { ascending: false });

    const rank = (allAttempts?.filter(a => a.percentage > percentage).length || 0) + 1;

    const { error } = await supabase
      .from('exam_attempts')
      .update({
        score,
        percentage,
        rank,
        submitted_at: new Date().toISOString(),
      })
      .eq('exam_id', activeExam.exam.id)
      .eq('student_id', profile?.id);

    if (error) {
      console.error('Error submitting exam:', error);
      alert('Failed to submit exam');
      return;
    }

    alert(`Exam submitted! Score: ${score}/${activeExam.exam.total_marks} (${percentage}%)\nRank: #${rank}`);
    setActiveExam(null);
    loadData();
  };

  if (activeExam) {
    const currentQ = activeExam.exam.questions[activeExam.currentQuestion];
    const totalQuestions = activeExam.exam.questions.length;
    const answeredCount = Object.keys(activeExam.answers).length;

    return (
      <div className="p-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{activeExam.exam.title}</h2>
                <p className="text-sm text-gray-600">{activeExam.exam.subject}</p>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-600">Question</div>
                <div className="text-2xl font-bold text-[#eb1b23]">
                  {activeExam.currentQuestion + 1} / {totalQuestions}
                </div>
              </div>
            </div>

            <div className="w-full bg-gray-200 rounded-full h-2 mb-6">
              <div
                className="bg-[#eb1b23] h-2 rounded-full transition-all"
                style={{ width: `${(answeredCount / totalQuestions) * 100}%` }}
              />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-8 mb-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-6">{currentQ.question}</h3>

            <div className="space-y-3">
              {currentQ.options.map((option, idx) => (
                <button
                  key={idx}
                  onClick={() => selectAnswer(activeExam.currentQuestion, idx)}
                  className={`w-full text-left p-4 rounded-lg border-2 transition ${
                    activeExam.answers[activeExam.currentQuestion] === idx
                      ? 'border-[#eb1b23] bg-red-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                      activeExam.answers[activeExam.currentQuestion] === idx
                        ? 'border-[#eb1b23] bg-[#eb1b23]'
                        : 'border-gray-300'
                    }`}>
                      {activeExam.answers[activeExam.currentQuestion] === idx && (
                        <CheckCircle className="w-4 h-4 text-white" />
                      )}
                    </div>
                    <span className="text-gray-900">{option}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <button
              onClick={() => setActiveExam({ ...activeExam, currentQuestion: Math.max(0, activeExam.currentQuestion - 1) })}
              disabled={activeExam.currentQuestion === 0}
              className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>

            {activeExam.currentQuestion < totalQuestions - 1 ? (
              <button
                onClick={() => setActiveExam({ ...activeExam, currentQuestion: activeExam.currentQuestion + 1 })}
                className="px-6 py-3 bg-[#eb1b23] text-white rounded-lg hover:bg-red-700 transition"
              >
                Next Question
              </button>
            ) : (
              <button
                onClick={submitExam}
                className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
              >
                Submit Exam
              </button>
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
            results.map((result) => (
              <div key={result.id} className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold">
                        {result.exam.subject}
                      </span>
                      <span className="text-xs text-gray-500">
                        {new Date(result.submitted_at).toLocaleDateString()}
                      </span>
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-4">{result.exam.title}</h3>

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
                          result.percentage >= 75 ? 'text-green-600' :
                          result.percentage >= 50 ? 'text-amber-600' :
                          'text-red-600'
                        }`}>
                          {result.percentage}%
                        </div>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-4">
                        <div className="text-sm text-gray-600 mb-1">Rank</div>
                        <div className="text-2xl font-bold text-[#eb1b23]">
                          #{result.rank}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
