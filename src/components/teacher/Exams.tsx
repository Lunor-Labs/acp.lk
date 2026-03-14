import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { ExamRepository, ClassRepository, TeacherRepository, PdfPaperRepository } from '../../repositories';
import { Plus, Calendar, Clock, Users, Upload, X, FileText, ChevronRight } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface Exam {
  id: string;
  title: string;
  description: string;
  subject: string;
  start_time: string;
  end_time: string;
  duration_minutes: number;
  total_marks: number;
  created_at: string;
  class_title?: string;
  submission_count?: number;
  total_students?: number;
}

interface Class {
  id: string;
  title: string;
  subject: string;
}

interface Question {
  id: string;
  question_text: string;
  options: string[];
  correct_answer: string;
  marks: number;
}

interface PdfAnswer {
  question_no: number;
  correct_answer: number;
}

interface ManualAnswer {
  question_no: number;
  correct_answer: string; // A, B, C, D
}

interface ManualQuestion {
  id: string;
  question_number: number;
  question_text: string;
  options: string[];
  correct_answer: string;
  marks: number;
}

interface ExamDetail {
  id: string;
  title: string;
  subject: string;
  pdfPath: string | null;
  markedAnswers: (PdfAnswer | ManualAnswer)[];
  manualQuestions: ManualQuestion[];
  isPdfExam: boolean;
}

export default function Exams() {
  const { profile } = useAuth();
  const [exams, setExams] = useState<Exam[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');
  
  // State for exam detail modal
  const [selectedExamDetail, setSelectedExamDetail] = useState<ExamDetail | null>(null);
  const [loadingExamDetail, setLoadingExamDetail] = useState(false);
  const [markedAnswers, setMarkedAnswers] = useState<(PdfAnswer | ManualAnswer)[]>([]);
  const [manualQuestions, setManualQuestions] = useState<ManualQuestion[]>([]);
  const [editedAnswers, setEditedAnswers] = useState<Record<string, string | number>>({});
  const [isSaving, setIsSaving] = useState(false);

  const examRepo = new ExamRepository();
  const classRepo = new ClassRepository();
  const teacherRepo = new TeacherRepository();
  const pdfPaperRepo = new PdfPaperRepository();

  const [formData, setFormData] = useState({
    class_id: '',
    title: '',
    subject: '',
    description: '',
    exam_date: '',
    exam_time: '',
    duration_minutes: 60,
    exam_type: 'manual', // 'manual' or 'pdf'
  });

  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfAnswers, setPdfAnswers] = useState<PdfAnswer[]>(
    Array.from({ length: 50 }, (_, i) => ({
      question_no: i + 1,
      correct_answer: 0, // 0 means not selected, 1-5 for actual answers
    }))
  );
  const [pdfUploading, setPdfUploading] = useState(false);
  const [showPdfAnswerSheet, setShowPdfAnswerSheet] = useState(false);

  const [questions, setQuestions] = useState<Question[]>([
    {
      id: '1',
      question_text: '',
      options: ['', '', '', ''],
      correct_answer: '',
      marks: 1,
    },
  ]);

  useEffect(() => {
    fetchExams();
    fetchClasses();
  }, [profile?.id]);

  async function fetchClasses() {
    try {
      const teacher = await teacherRepo.findByProfileId(profile?.id!);
      if (!teacher) return;

      const data = await classRepo.findActiveByTeacherId(teacher.id);
      setClasses(data.map(c => ({ id: c.id, title: c.title, subject: c.subject })));
    } catch (error) {
      console.error('Error fetching classes:', error);
    }
  }

  async function fetchExams() {
    try {
      setLoading(true);

      const teacher = await teacherRepo.findByProfileId(profile?.id!);
      if (!teacher) return;

      const examsData = await examRepo.findByTeacherId(teacher.id);

      const examsWithStats = await Promise.all(
        examsData.map(async (exam) => {
          const submissionCount = await examRepo.getSubmissionCount(exam.id);

          // Get class title if class_id exists
          let classTitle = 'Unknown';
          if (exam.class_id) {
            const classData = await classRepo.findById(exam.class_id);
            classTitle = classData?.title || 'Unknown';
          }

          return {
            ...exam,
            class_title: classTitle,
            submission_count: submissionCount,
          };
        })
      );

      setExams(examsWithStats);
    } catch (error) {
      console.error('Error fetching exams:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleExamCardClick(exam: Exam) {
    try {
      setLoadingExamDetail(true);
      
      // Step 1: Check if exam_id exists in pdf_exams table
      const { data: pdfAnswersData, error: pdfError } = await supabase
        .from('pdf_exams')
        .select('*')
        .eq('exam_id', exam.id)
        .order('question_no', { ascending: true });

      console.log('PDF Answers Data:', pdfAnswersData, 'Error:', pdfError);

      // If exam exists in pdf_exams, it's a PDF exam
      if (pdfAnswersData && pdfAnswersData.length > 0) {
        const pdfPath = pdfAnswersData[0]?.pdf_path || null;
        
        let pdfUrl = null;
        if (pdfPath) {
          // Remove 'acp/' prefix to get the correct path within the bucket
          const storagePath = pdfPath.startsWith('acp/') ? pdfPath.slice(4) : pdfPath;
          const { data } = supabase.storage.from('acp').getPublicUrl(storagePath);
          pdfUrl = data?.publicUrl || null;
          console.log('PDF Path from DB:', pdfPath, 'Storage Path:', storagePath, 'Public URL:', pdfUrl);
        }
        
        const formattedAnswers: PdfAnswer[] = pdfAnswersData.map(a => ({
          question_no: a.question_no,
          correct_answer: a.correct_answer,
        }));
        
        setMarkedAnswers(formattedAnswers);
        setManualQuestions([]);
        setEditedAnswers({});
        
        setSelectedExamDetail({
          id: exam.id,
          title: exam.title,
          subject: exam.subject,
          pdfPath: pdfUrl,
          markedAnswers: formattedAnswers,
          manualQuestions: [],
          isPdfExam: true,
        });
        setLoadingExamDetail(false);
        return;
      }

      // Step 2: Otherwise, it's a manual exam - fetch exam_questions
      const { data: examQuestions, error: qError } = await supabase
        .from('exam_questions')
        .select('*')
        .eq('exam_id', exam.id)
        .order('question_number', { ascending: true });

      console.log('Exam Questions Data:', examQuestions, 'Error:', qError);

      const formattedQuestions: ManualQuestion[] = (examQuestions || []).map(q => ({
        id: q.id,
        question_number: q.question_number,
        question_text: q.question_text,
        options: q.options || [],
        correct_answer: q.correct_answer,
        marks: q.marks,
      }));
      
      // Create answer sheet for manual exam
      const manualAnswers = formattedQuestions.map(q => ({
        question_no: q.question_number,
        correct_answer: q.correct_answer, // A, B, C, D as string
      }));
      
      setManualQuestions(formattedQuestions);
      setMarkedAnswers(manualAnswers);
      setEditedAnswers({});
      
      setSelectedExamDetail({
        id: exam.id,
        title: exam.title,
        subject: exam.subject,
        pdfPath: null,
        markedAnswers: manualAnswers,
        manualQuestions: formattedQuestions,
        isPdfExam: false,
      });
    } catch (error) {
      console.error('Error loading exam details:', error);
      alert('Failed to load exam details');
    } finally {
      setLoadingExamDetail(false);
    }
  }

  async function handleSaveAnswerChanges() {
    if (!selectedExamDetail) return;
    
    try {
      const changes = Object.entries(editedAnswers);
      if (changes.length === 0) {
        alert('No changes made to save');
        return;
      }

      setIsSaving(true);

      if (selectedExamDetail.isPdfExam) {
        // Save PDF exam answers - batch update all changed answers at once
        const answersToUpdate = changes.map(([questionNo, newAnswer]) => ({
          question_no: Number(questionNo),
          correct_answer: Number(newAnswer),
        }));

        await pdfPaperRepo.updateMultipleAnswers(selectedExamDetail.id, answersToUpdate);

        // Update local state with new answers
        const updatedAnswers = markedAnswers.map(answer => ({
          question_no: answer.question_no,
          correct_answer: editedAnswers[answer.question_no] ?? answer.correct_answer,
        }));

        setMarkedAnswers(updatedAnswers as PdfAnswer[]);
      } else {
        // Save manual exam answers - use question_number as the key
        for (const [questionNumber, newAnswer] of changes) {
          const question = manualQuestions.find(q => q.question_number === Number(questionNumber));
          if (question) {
            await supabase
              .from('exam_questions')
              .update({ correct_answer: newAnswer })
              .eq('id', question.id);
          }
        }

        // Update local questions state
        const updatedQuestions = manualQuestions.map(q =>
          editedAnswers[q.question_number] ? { ...q, correct_answer: editedAnswers[q.question_number] as string } : q
        );
        setManualQuestions(updatedQuestions);
      }

      setEditedAnswers({});
      alert('Answer sheet updated successfully!');
    } catch (error) {
      console.error('Error saving answer changes:', error);
      alert('Failed to save changes');
    } finally {
      setIsSaving(false);
    }
  }

  function updateAnswerEdit(identifier: string | number, answer: string | number) {
    setEditedAnswers(prev => ({
      ...prev,
      [identifier]: answer
    }));
  }

  async function handleCreateExam() {
    try {
      const teacher = await teacherRepo.findByProfileId(profile?.id!);

      if (!teacher) {
        alert('Teacher profile not found');
        return;
      }

      if (!formData.class_id || !formData.title || !formData.exam_date || !formData.exam_time) {
        alert('Please fill in all required fields');
        return;
      }

      const validQuestions = questions.filter(q => q.question_text.trim());
      if (validQuestions.length === 0) {
        alert('Please add at least one question');
        return;
      }

      const startTime = new Date(`${formData.exam_date}T${formData.exam_time}`);
      const endTime = new Date(startTime.getTime() + formData.duration_minutes * 60000);

      const questionsToInsert = validQuestions.map((q, index) => ({
        question_number: index + 1,
        question_text: q.question_text,
        options: q.options.filter(opt => opt.trim()),
        correct_answer: q.correct_answer,
        marks: q.marks,
      }));

      await examRepo.createWithQuestions(
        {
          teacher_id: teacher.id,
          class_id: formData.class_id,
          title: formData.title,
          description: formData.description,
          subject: formData.subject,
          start_time: startTime.toISOString(),
          end_time: endTime.toISOString(),
          duration_minutes: formData.duration_minutes,
          total_marks: validQuestions.reduce((sum, q) => sum + q.marks, 0),
        },
        questionsToInsert
      );

      alert('Exam created successfully!');
      resetForm();
      fetchExams();
    } catch (error) {
      console.error('Error creating exam:', error);
      alert('Failed to create exam. Please try again.');
    }
  }

  function resetForm() {
    setFormData({
      class_id: '',
      title: '',
      subject: '',
      description: '',
      exam_date: '',
      exam_time: '',
      duration_minutes: 60,
      exam_type: 'manual',
    });
    setQuestions([
      {
        id: '1',
        question_text: '',
        options: ['', '', '', ''],
        correct_answer: '',
        marks: 1,
      },
    ]);
    setPdfFile(null);
    setPdfAnswers(
      Array.from({ length: 50 }, (_, i) => ({
        question_no: i + 1,
        correct_answer: 0,
      }))
    );
    setShowPdfAnswerSheet(false);
  }

  function addQuestion() {
    setQuestions([
      ...questions,
      {
        id: Date.now().toString(),
        question_text: '',
        options: ['', '', '', ''],
        correct_answer: '',
        marks: 1,
      },
    ]);
  }

  function updateQuestion(id: string, field: string, value: any) {
    setQuestions(
      questions.map((q) =>
        q.id === id ? { ...q, [field]: value } : q
      )
    );
  }

  function updateQuestionOption(id: string, optionIndex: number, value: string) {
    setQuestions(
      questions.map((q) =>
        q.id === id
          ? { ...q, options: q.options.map((opt, i) => (i === optionIndex ? value : opt)) }
          : q
      )
    );
  }

  async function handlePdfFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type !== 'application/pdf') {
        alert('Please select a PDF file');
        return;
      }
      setPdfFile(file);
      setShowPdfAnswerSheet(true);
    }
  }

  async function handlePdfAnswerSheetSubmit() {
    try {
      if (!pdfFile) {
        alert('Please select a PDF file');
        return;
      }

      // Validate all answers are selected (1-5)
      const allAnswered = pdfAnswers.every(answer => answer.correct_answer > 0);
      if (!allAnswered) {
        alert('Please mark correct answers for all 50 questions');
        return;
      }

      setPdfUploading(true);

      const teacher = await teacherRepo.findByProfileId(profile?.id!);
      if (!teacher) {
        alert('Teacher profile not found');
        return;
      }

      if (!formData.class_id || !formData.title || !formData.exam_date || !formData.exam_time) {
        alert('Please fill in all required fields');
        return;
      }

      // Create exam first with type indicator
      const startTime = new Date(`${formData.exam_date}T${formData.exam_time}`);
      const endTime = new Date(startTime.getTime() + formData.duration_minutes * 60000);

      const exam = await examRepo.create({
        teacher_id: teacher.id,
        class_id: formData.class_id,
        title: formData.title,
        description: formData.description,
        subject: formData.subject,
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString(),
        duration_minutes: formData.duration_minutes,
        total_marks: 50, // 50 questions
      });

      // Upload PDF to storage
      const fileName = `${exam.id}-${Date.now()}.pdf`;
      const filePath = `acp/pdf/papers/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('acp')
        .upload(`pdf/papers/${fileName}`, pdfFile, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) {
        console.error('PDF upload error:', uploadError);
        // Delete the exam if PDF upload fails
        await examRepo.delete(exam.id);
        alert('Failed to upload PDF. Please try again.');
        return;
      }

      // Save PDF answers to database
      await pdfPaperRepo.createPdfAnswers(exam.id, filePath, pdfAnswers);

      alert('PDF Paper exam created successfully!');
      resetForm();
      fetchExams();
    } catch (error) {
      console.error('Error creating PDF exam:', error);
      alert('Failed to create PDF exam. Please try again.');
    } finally {
      setPdfUploading(false);
    }
  }

  function updatePdfAnswer(questionNo: number, answerValue: number) {
    setPdfAnswers(
      pdfAnswers.map(answer =>
        answer.question_no === questionNo
          ? { ...answer, correct_answer: answerValue }
          : answer
      )
    );
  }

  function getExamStatus(exam: Exam): { label: string; color: string } {
    const now = new Date();
    const startTime = new Date(exam.start_time);
    const endTime = new Date(exam.end_time);

    if (now < startTime) {
      return { label: 'Scheduled', color: 'text-blue-600 bg-blue-50' };
    } else if (now >= startTime && now <= endTime) {
      return { label: 'Active', color: 'text-green-600 bg-green-50' };
    } else {
      return { label: 'Completed', color: 'text-gray-600 bg-gray-50' };
    }
  }

  const filteredExams = exams.filter((exam) => {
    if (filterStatus === 'all') return true;
    const status = getExamStatus(exam);
    return status.label.toLowerCase() === filterStatus;
  });

  return (
    <div className="p-8">
      <div className="mb-6">
        <h2 className="text-3xl font-bold text-gray-900">Exams</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">Recent Exams</h3>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">Filter by:</span>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#eb1b23] focus:border-transparent"
                >
                  <option value="all">All Status</option>
                  <option value="scheduled">Scheduled</option>
                  <option value="active">Active</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
            </div>

            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#eb1b23]"></div>
              </div>
            ) : filteredExams.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500">No exams found</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredExams.map((exam) => {
                  const status = getExamStatus(exam);
                  return (
                    <div
                      key={exam.id}
                      onClick={() => handleExamCardClick(exam)}
                      className="border border-gray-200 rounded-xl p-4 hover:shadow-md transition cursor-pointer hover:border-[#eb1b23] hover:bg-red-50/20"
                    >
                      <div className="flex flex-col sm:flex-row items-start gap-4">
                        <div className={`w-12 h-12 sm:w-16 sm:h-16 flex-shrink-0 rounded-xl flex items-center justify-center ${exam.subject.toLowerCase().includes('physics') ? 'bg-red-100' :
                          exam.subject.toLowerCase().includes('chemistry') ? 'bg-blue-100' :
                            exam.subject.toLowerCase().includes('maths') ? 'bg-purple-100' :
                              'bg-teal-100'
                          }`}>
                          <span className="text-xl sm:text-2xl font-bold">
                            {exam.subject.substring(0, 2).toUpperCase()}
                          </span>
                        </div>

                        <div className="flex-1 w-full">
                          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-2">
                            <div className="flex-1">
                              <div className="flex flex-wrap items-center gap-2 mb-1">
                                <span className={`px-2 sm:px-3 py-1 rounded-full text-xs font-medium ${exam.subject.toLowerCase().includes('physics') ? 'bg-red-100 text-red-700' :
                                  exam.subject.toLowerCase().includes('chemistry') ? 'bg-blue-100 text-blue-700' :
                                    exam.subject.toLowerCase().includes('maths') ? 'bg-purple-100 text-purple-700' :
                                      'bg-teal-100 text-teal-700'
                                  }`}>
                                  {exam.subject.toUpperCase()}
                                </span>
                                <span className={`px-2 sm:px-3 py-1 rounded-full text-xs font-medium ${status.color}`}>
                                  {status.label}
                                </span>
                              </div>
                              <h4 className="text-base sm:text-lg font-bold text-gray-900">{exam.title}</h4>
                              <p className="text-xs sm:text-sm text-gray-600 mt-1 line-clamp-2">{exam.description}</p>
                            </div>
                            <div className="flex items-center space-x-2 flex-shrink-0">
                              <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-[#eb1b23]" />
                            </div>
                          </div>

                          <div className="grid grid-cols-2 sm:flex sm:items-center sm:gap-6 gap-2 text-xs sm:text-sm text-gray-600 mt-3">
                            <div className="flex items-center gap-1">
                              <Calendar className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                              <span className="truncate">{new Date(exam.start_time).toLocaleDateString()}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                              <span>{new Date(exam.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Users className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                              <span className="truncate">{exam.submission_count} Submitted</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                              <span>{exam.duration_minutes}m</span>
                            </div>
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

        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-sm p-6 border-t-4 border-[#eb1b23]">
            <div className="flex items-center space-x-2 mb-6">
              <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                <Plus className="w-4 h-4 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">Create New Exam</h3>
                <p className="text-xs text-slate-500">Setup Area Details & Questions</p>
              </div>
            </div>

            <div className="space-y-4 max-h-[calc(100vh-200px)] overflow-y-auto pr-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Assign to Class
                </label>
                <select
                  value={formData.class_id}
                  onChange={(e) => {
                    const selectedClass = classes.find(c => c.id === e.target.value);
                    setFormData({
                      ...formData,
                      class_id: e.target.value,
                      subject: selectedClass?.subject || '',
                    });
                  }}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#eb1b23] focus:border-transparent"
                >
                  <option value="">Select a class</option>
                  {classes.map((cls) => (
                    <option key={cls.id} value={cls.id}>
                      {cls.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Exam Title
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. Weekly Theory Test 05"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#eb1b23] focus:border-transparent"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date
                  </label>
                  <input
                    type="date"
                    value={formData.exam_date}
                    onChange={(e) => setFormData({ ...formData, exam_date: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#eb1b23] focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Time
                  </label>
                  <input
                    type="time"
                    value={formData.exam_time}
                    onChange={(e) => setFormData({ ...formData, exam_time: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#eb1b23] focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Duration (Minutes)
                </label>
                <input
                  type="number"
                  value={formData.duration_minutes}
                  onChange={(e) => setFormData({ ...formData, duration_minutes: parseInt(e.target.value) || 60 })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#eb1b23] focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Exam Creation Type
                </label>
                <select
                  value={formData.exam_type}
                  onChange={(e) => {
                    setFormData({ ...formData, exam_type: e.target.value });
                    if (e.target.value === 'pdf') {
                      setShowPdfAnswerSheet(false);
                      setPdfFile(null);
                    }
                  }}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#eb1b23] focus:border-transparent"
                >
                  <option value="manual">Manual (Text Questions)</option>
                  <option value="pdf">PDF Paper Upload</option>
                </select>
              </div>

              {formData.exam_type === 'pdf' && !showPdfAnswerSheet ? (
                <div className="border-2 border-dashed border-[#eb1b23] rounded-lg p-6 text-center">
                  <Upload className="w-8 h-8 text-[#eb1b23] mx-auto mb-3" />
                  <label className="cursor-pointer">
                    <p className="text-sm font-medium text-gray-700 mb-1">
                      Upload PDF Paper
                    </p>
                    <p className="text-xs text-gray-500 mb-4">
                      Click to select or drag & drop a PDF file
                    </p>
                    <input
                      type="file"
                      accept=".pdf"
                      onChange={handlePdfFileSelect}
                      className="hidden"
                    />
                    <span className="inline-block bg-[#eb1b23] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-700 transition">
                      Select PDF
                    </span>
                  </label>
                  {pdfFile && (
                    <p className="text-xs text-green-600 mt-3">
                      ✓ {pdfFile.name}
                    </p>
                  )}
                </div>
              ) : null}

              {formData.exam_type === 'pdf' && showPdfAnswerSheet ? (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                  <div className="absolute inset-0 bg-black opacity-30" onClick={() => { setShowPdfAnswerSheet(false); setPdfFile(null); }}></div>
                  <div className="relative bg-white rounded-xl shadow-lg w-[90vw] max-w-3xl p-6 overflow-y-auto max-h-[90vh]">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-semibold text-gray-900">MCQ Answer Sheet (50 Questions)</h4>
                      <button
                        onClick={() => {
                          setShowPdfAnswerSheet(false);
                          setPdfFile(null);
                        }}
                        title="Close answer sheet"
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>

                    <div className="space-y-2">
                      {pdfAnswers.map((answer) => (
                        <div key={answer.question_no} className="flex items-center justify-between bg-white p-3 rounded-lg border border-gray-200">
                          <span className="text-sm font-medium text-gray-700">
                            Q{answer.question_no}
                          </span>
                          <div className="flex gap-2">
                            {[1, 2, 3, 4, 5].map((option) => (
                              <button
                                key={option}
                                onClick={() => updatePdfAnswer(answer.question_no, option)}
                                className={`w-8 h-8 rounded font-semibold text-sm transition ${
                                  answer.correct_answer === option
                                    ? 'bg-[#eb1b23] text-white'
                                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                }`}
                              >
                                {option}
                              </button>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>

                    <button
                      onClick={handlePdfAnswerSheetSubmit}
                      disabled={pdfUploading}
                      className="w-full bg-[#eb1b23] text-white px-6 py-3 rounded-lg font-medium hover:bg-red-700 transition-all duration-200 hover:shadow-lg mt-4 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {pdfUploading ? 'Uploading & Saving...' : 'Save PDF Paper & Answers'}
                    </button>
                  </div>
                </div>
              ) : null}

              {formData.exam_type === 'manual' ? (
                <>
                  {questions.map((question, qIndex) => (
                <div key={question.id} className="border border-gray-200 rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-gray-900">
                      QUESTION {qIndex + 1}
                    </span>
                    <span className="text-xs text-gray-500">{question.marks} Point</span>
                  </div>

                  <input
                    type="text"
                    value={question.question_text}
                    onChange={(e) => updateQuestion(question.id, 'question_text', e.target.value)}
                    placeholder="Enter your question here..."
                    className="w-full border-0 border-b border-gray-200 px-0 py-2 focus:ring-0 focus:border-[#eb1b23] text-sm"
                  />

                  <div className="space-y-2">
                    {question.options.map((option, optIndex) => (
                      <div key={optIndex} className="flex items-center space-x-2">
                        <input
                          type="radio"
                          name={`correct-${question.id}`}
                          checked={question.correct_answer === String.fromCharCode(65 + optIndex)}
                          onChange={() => updateQuestion(question.id, 'correct_answer', String.fromCharCode(65 + optIndex))}
                          className="text-[#eb1b23] focus:ring-[#eb1b23]"
                        />
                        <input
                          type="text"
                          value={option}
                          onChange={(e) => updateQuestionOption(question.id, optIndex, e.target.value)}
                          placeholder={`Option ${String.fromCharCode(65 + optIndex)}`}
                          className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#eb1b23] focus:border-transparent"
                        />
                      </div>
                    ))}
                    <p className="text-xs text-gray-400 italic mt-2">
                      select the radio button to mark correct answer
                    </p>
                  </div>
                </div>
              ))}

              <button
                onClick={addQuestion}
                className="w-full border-2 border-dashed border-red-300 text-[#eb1b23] px-4 py-3 rounded-lg font-medium hover:bg-red-50 transition-all duration-200 flex items-center justify-center space-x-2"
              >
                <Plus className="w-5 h-5" />
                <span>Add Another Question</span>
              </button>

              <button
                onClick={handleCreateExam}
                className="w-full bg-[#eb1b23] text-white px-6 py-3 rounded-lg font-medium hover:bg-red-700 transition-all duration-200 hover:shadow-lg"
              >
                Publish Exam
              </button>
                </>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      {/* Exam Detail Modal */}
      {selectedExamDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
            {loadingExamDetail ? (
              <div className="flex items-center justify-center h-96">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#eb1b23]"></div>
              </div>
            ) : (
              <>
                {/* Header */}
                <div className="sticky top-0 bg-gradient-to-r from-[#eb1b23] to-red-700 text-white p-6 flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold">{selectedExamDetail.title}</h2>
                    <p className="text-red-100 text-sm mt-1">{selectedExamDetail.subject}</p>
                  </div>
                  <button
                    onClick={() => setSelectedExamDetail(null)}
                    title="Close exam details"
                    className="text-white hover:bg-red-600 rounded-lg p-2 transition"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <div className="overflow-y-auto flex-1 p-6">
                  {selectedExamDetail.isPdfExam ? (
                    <>
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* PDF Viewer */}
                      <div className="border-2 border-gray-200 rounded-xl overflow-hidden bg-gray-50">
                        <div className="bg-gray-100 px-4 py-3 border-b flex items-center space-x-2">
                          <FileText className="w-5 h-5 text-[#eb1b23]" />
                          <span className="font-semibold text-gray-700">Exam Paper</span>
                        </div>
                        {selectedExamDetail.pdfPath ? (
                          <iframe
                            src={selectedExamDetail.pdfPath}
                            className="w-full h-[500px]"
                            title="Exam PDF"
                          />
                        ) : (
                          <div className="h-[500px] flex items-center justify-center text-gray-500">
                            <p>PDF not available</p>
                          </div>
                        )}
                      </div>

                      {/* Answer Sheet */}
                      <div className="border-2 border-gray-200 rounded-xl overflow-hidden flex flex-col">
                        <div className="bg-gray-100 px-4 py-3 border-b flex items-center space-x-2">
                          <FileText className="w-5 h-5 text-[#eb1b23]" />
                          <span className="font-semibold text-gray-700">Marked Answer Sheet</span>
                        </div>
                        
                        <div className="p-4 space-y-2">
                          {markedAnswers.map((answer) => (
                            <div
                              key={answer.question_no}
                              className="bg-white border border-gray-200 rounded-lg p-3 hover:border-[#eb1b23] transition"
                            >
                              <div className="flex items-center justify-between mb-2">
                                <span className="font-semibold text-gray-700">
                                  Q{answer.question_no}
                                </span>
                                <span className="text-xs text-gray-500">
                                  {answer.correct_answer === 0 ? 'Not marked' : `Answer: ${answer.correct_answer}`}
                                </span>
                              </div>
                              
                              <div className="flex gap-1 flex-wrap">
                                {[1, 2, 3, 4, 5].map((option) => (
                                  <button
                                    key={option}
                                    onClick={() => updateAnswerEdit(answer.question_no, option)}
                                    className={`px-3 py-1 rounded text-sm font-semibold transition ${
                                      editedAnswers[answer.question_no] === option ||
                                      (editedAnswers[answer.question_no] === undefined &&
                                        answer.correct_answer === option)
                                        ? 'bg-[#eb1b23] text-white'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                                  >
                                    {option}
                                  </button>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="mt-6 border-t pt-4">
                      <button
                        onClick={handleSaveAnswerChanges}
                        disabled={isSaving || Object.keys(editedAnswers).length === 0}
                        title="Save changes to answer sheet"
                        className="w-full bg-[#eb1b23] text-white px-4 py-2 rounded-lg font-medium hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                      >
                        {isSaving ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            <span>Saving...</span>
                          </>
                        ) : (
                          <span>Update Answers</span>
                        )}
                      </button>
                    </div>
                    </>
                  ) : (
                    <>
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Questions/Instructions */}
                      <div className="border-2 border-gray-200 rounded-xl overflow-hidden bg-gray-50">
                        <div className="bg-gray-100 px-4 py-3 border-b flex items-center space-x-2">
                          <FileText className="w-5 h-5 text-[#eb1b23]" />
                          <span className="font-semibold text-gray-700">Questions</span>
                        </div>
                        <div className="p-4 space-y-4">
                          {manualQuestions.length > 0 ? (
                            manualQuestions.map((question) => (
                              <div key={question.id} className="bg-white border border-gray-200 rounded-lg p-4">
                                <div className="flex items-start justify-between mb-3">
                                  <span className="font-bold text-gray-900">Q{question.question_number}</span>
                                  <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded">
                                    {question.marks} mark{question.marks > 1 ? 's' : ''}
                                  </span>
                                </div>
                                
                                <p className="text-sm font-medium text-gray-800 mb-3">{question.question_text}</p>
                                
                                <div className="space-y-2">
                                  {question.options.map((option, optIndex) => {
                                    const optionLabel = String.fromCharCode(65 + optIndex);
                                    const isCorrect = question.correct_answer === optionLabel;
                                    return (
                                      <div
                                        key={optIndex}
                                        className={`p-2 rounded text-sm border ${
                                          isCorrect
                                            ? 'border-green-500 bg-green-50'
                                            : 'border-gray-200 bg-gray-50'
                                        }`}
                                      >
                                        <span className="font-semibold text-gray-700">{optionLabel})</span>
                                        <span className="text-gray-700 ml-2">{option}</span>
                                        {isCorrect && <span className="ml-2 text-xs text-green-700">✓ Correct</span>}
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            ))
                          ) : (
                            <p className="text-gray-500 text-center py-8">No questions found</p>
                          )}
                        </div>
                      </div>

                      {/* Answer Sheet */}
                      <div className="border-2 border-gray-200 rounded-xl overflow-hidden">
                        <div className="bg-gray-100 px-4 py-3 border-b flex items-center space-x-2">
                          <FileText className="w-5 h-5 text-[#eb1b23]" />
                          <span className="font-semibold text-gray-700">Marked Answer Sheet</span>
                        </div>
                        
                        <div className="p-4 space-y-3">
                          {manualQuestions.map((question) => (
                            <div
                              key={question.id}
                              className="bg-white border border-gray-200 rounded-lg p-3 hover:border-[#eb1b23] transition"
                            >
                              <div className="flex items-center justify-between mb-2">
                                <span className="font-semibold text-gray-700">Q{question.question_number}</span>
                                <span className="text-xs text-gray-500">
                                  Current: {editedAnswers[question.question_number] === undefined ? question.correct_answer : editedAnswers[question.question_number]}
                                </span>
                              </div>
                              
                              <div className="flex gap-1 flex-wrap">
                                {question.options.map((_, optIndex) => {
                                  const optLabel = String.fromCharCode(65 + optIndex);
                                  const isSelected =
                                    editedAnswers[question.question_number] === optLabel ||
                                    (editedAnswers[question.question_number] === undefined && question.correct_answer === optLabel);
                                  
                                  return (
                                    <button
                                      key={optIndex}
                                      onClick={() => updateAnswerEdit(question.question_number, optLabel)}
                                      title={`Option ${optLabel}`}
                                      className={`w-10 h-10 rounded font-bold text-sm transition ${
                                        isSelected
                                          ? 'bg-[#eb1b23] text-white'
                                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                      }`}
                                    >
                                      {optLabel}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="mt-6 border-t pt-4">
                      <button
                        onClick={handleSaveAnswerChanges}
                        disabled={isSaving || Object.keys(editedAnswers).length === 0}
                        title="Save changes to answer sheet"
                        className="w-full bg-[#eb1b23] text-white px-4 py-2 rounded-lg font-medium hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                      >
                        {isSaving ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            <span>Saving...</span>
                          </>
                        ) : (
                          <span>Update Answers</span>
                        )}
                      </button>
                    </div>
                    </>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
