import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { ExamRepository, ClassRepository, TeacherRepository, PdfPaperRepository } from '../../repositories';
import { Plus, Calendar, Clock, Users, Upload, X, FileText, ChevronRight, Image, Edit, Trash2, AlertCircle, Search, CheckCircle2, FileQuestion, BookOpen, GraduationCap, Check, AlertTriangle, Info } from 'lucide-react';
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
  image_path?: string;
  image_file?: File;
  image_preview?: string;
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
  image_path?: string;
}

interface ExamDetail {
  id: string;
  title: string;
  description: string;
  subject: string;
  start_time: string;
  end_time: string;
  duration_minutes: number;
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
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreatingExam, setIsCreatingExam] = useState(false);
  
  // State for exam detail modal
  const [selectedExamDetail, setSelectedExamDetail] = useState<ExamDetail | null>(null);
  const [loadingExamDetail, setLoadingExamDetail] = useState(false);
  const [markedAnswers, setMarkedAnswers] = useState<(PdfAnswer | ManualAnswer)[]>([]);
  const [manualQuestions, setManualQuestions] = useState<ManualQuestion[]>([]);
  const [editedAnswers, setEditedAnswers] = useState<Record<string, string | number>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [isEditingExamDetails, setIsEditingExamDetails] = useState(false);
  const [editExamData, setEditExamData] = useState({ title: '', description: '', exam_date: '', exam_time: '', duration_minutes: 0 });
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Toast notification state
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'warning' | 'info'; visible: boolean } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info') => {
    setToast({ message, type, visible: true });
    setTimeout(() => {
      setToast(prev => prev ? { ...prev, visible: false } : null);
      setTimeout(() => setToast(null), 300);
    }, 4000);
  };

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
      options: ['', '', '', '', ''],
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
          description: exam.description,
          subject: exam.subject,
          start_time: exam.start_time,
          end_time: exam.end_time,
          duration_minutes: exam.duration_minutes,
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
        description: exam.description,
        subject: exam.subject,
        start_time: exam.start_time,
        end_time: exam.end_time,
        duration_minutes: exam.duration_minutes,
        pdfPath: null,
        markedAnswers: manualAnswers,
        manualQuestions: formattedQuestions,
        isPdfExam: false,
      });
    } catch (error) {
      console.error('Error loading exam details:', error);
      showToast('Failed to load exam details', 'error');
    } finally {
      setLoadingExamDetail(false);
    }
  }

  function startEditingExamDetails() {
    if (!selectedExamDetail) return;
    const startDate = new Date(selectedExamDetail.start_time);
    const startTime = startDate.toISOString().slice(0, 16).split('T');
    setEditExamData({
      title: selectedExamDetail.title,
      description: selectedExamDetail.description,
      exam_date: startTime[0],
      exam_time: startTime[1],
      duration_minutes: selectedExamDetail.duration_minutes,
    });
    setIsEditingExamDetails(true);
  }

  async function handleUpdateExamDetails() {
    if (!selectedExamDetail) return;
    
    try {
      setIsSaving(true);
      const startTime = new Date(`${editExamData.exam_date}T${editExamData.exam_time}`);
      const endTime = new Date(startTime.getTime() + editExamData.duration_minutes * 60000);

      await examRepo.update(selectedExamDetail.id, {
        title: editExamData.title,
        description: editExamData.description,
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString(),
        duration_minutes: editExamData.duration_minutes,
      });

      showToast('Exam details updated successfully!', 'success');
      setIsEditingExamDetails(false);
      fetchExams();
      
      // Update the selected exam detail
      setSelectedExamDetail({
        ...selectedExamDetail,
        title: editExamData.title,
        description: editExamData.description,
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString(),
        duration_minutes: editExamData.duration_minutes,
      });
    } catch (error) {
      console.error('Error updating exam details:', error);
      showToast('Failed to update exam details. Please try again.', 'error');
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDeleteExam() {
    if (!selectedExamDetail) return;

    try {
      setIsDeleting(true);
      await examRepo.delete(selectedExamDetail.id);
      
      showToast('Exam deleted successfully!', 'success');
      setSelectedExamDetail(null);
      setShowDeleteConfirm(false);
      fetchExams();
    } catch (error) {
      console.error('Error deleting exam:', error);
      showToast('Failed to delete exam. Please try again.', 'error');
    } finally {
      setIsDeleting(false);
    }
  }

  async function handleSaveAnswerChanges() {
    if (!selectedExamDetail) return;
    
    try {
      const changes = Object.entries(editedAnswers);
      if (changes.length === 0) {
        showToast('No changes made to save', 'warning');
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
      showToast('Answer sheet updated successfully!', 'success');
    } catch (error) {
      console.error('Error saving answer changes:', error);
      showToast('Failed to save changes', 'error');
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
        showToast('Teacher profile not found', 'error');
        return;
      }

      if (!formData.class_id || !formData.title || !formData.exam_date || !formData.exam_time) {
        showToast('Please fill in all required fields', 'warning');
        return;
      }

      const validQuestions = questions.filter(q => q.question_text.trim() || q.image_file || q.image_path);
      // console.log(`[EXAM] Starting exam creation with ${validQuestions.length} questions`);
      
      if (validQuestions.length === 0) {
        showToast('Please add at least one question', 'warning');
        return;
      }

      setIsCreatingExam(true);
      const startTime = new Date(`${formData.exam_date}T${formData.exam_time}`);
      const endTime = new Date(startTime.getTime() + formData.duration_minutes * 60000);

      // Upload images and prepare questions - sequential upload to avoid filename collision
      const questionsToInsert: any[] = [];
      const failedQuestions: number[] = [];
      const uploadedImages: string[] = [];

      // console.log(`[EXAM] Starting sequential image upload for ${validQuestions.length} questions...`);

      for (let index = 0; index < validQuestions.length; index++) {
        const q = validQuestions[index];
        let imagePath: string | undefined = undefined;
        const questionNum = index + 1;

        // console.log(`[Q${questionNum}] Processing question ${questionNum}/${validQuestions.length}`);
        // console.log(`[Q${questionNum}] Has image: ${!!q.image_file}, Question text: ${q.question_text.substring(0, 50)}`);

        // Upload image if provided
        if (q.image_file) {
          try {
            // Use more unique filename: timestamp + question index + random + extension
            const ext = q.image_file.type.split('/')[1] || 'jpg';
            const fileName = `${Date.now()}-q${questionNum}-${Math.random().toString(36).substr(2, 9)}.${ext}`;
            const filePath = `acp/questions/images/${fileName}`;

            // console.log(`[Q${questionNum}] Uploading image: ${fileName} (Size: ${q.image_file.size} bytes)`);

            const { error: uploadError } = await supabase.storage
              .from('acp')
              .upload(`questions/images/${fileName}`, q.image_file, {
                cacheControl: '3600',
                upsert: false,
              });

            if (uploadError) {
              // console.error(`[Q${questionNum}] ❌ Image upload FAILED:`, uploadError);
              failedQuestions.push(questionNum);
              // Continue - save question without image
            } else {
              // console.log(`[Q${questionNum}] ✅ Image uploaded successfully`);
              imagePath = filePath;
              uploadedImages.push(fileName);
            }
          } catch (error) {
            // console.error(`[Q${questionNum}] ❌ Image upload EXCEPTION:`, error);
            failedQuestions.push(questionNum);
            // Continue - save question without image
          }
        }

        // Validate question data
        const filteredOptions = q.options.filter(opt => opt.trim());
        // console.log(`[Q${questionNum}] Options: ${filteredOptions.length}, Correct answer: ${q.correct_answer}`);

        const questionData = {
          question_number: questionNum,
          question_text: q.question_text,
          options: filteredOptions,
          correct_answer: q.correct_answer,
          marks: q.marks,
          image_path: imagePath,
        };

        
        questionsToInsert.push(questionData);
      }

      // console.log(`[EXAM] Upload summary - Total: ${validQuestions.length}, Failed: ${failedQuestions.length}, Uploaded images: ${uploadedImages.length}`);

      // Check if any images failed to upload
      if (failedQuestions.length > 0) {
        const msg = `Image upload failed for questions: ${failedQuestions.join(', ')}. These questions will be saved without images.`;
        // console.warn(`[EXAM] ⚠️ ${msg}`);
        showToast(msg, 'warning');
      }

      if (questionsToInsert.length === 0) {
        showToast('No questions to save. Please check your questions and try again.', 'error');
        setIsCreatingExam(false);
        return;
      }

      // console.log(`[EXAM] Creating exam with ${questionsToInsert.length} questions in database...`);
      // console.log(`[EXAM] Exam data:`, {
      //   title: formData.title,
      //   subject: formData.subject,
      //   questions_count: questionsToInsert.length,
      // });

      const createdExam = await examRepo.createWithQuestions(
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

    //  console.log(`[EXAM] ✅ Exam created successfully! Exam ID:`, createdExam.id);
      showToast('Exam created successfully!', 'success');
      resetForm();
      fetchExams();
    } catch (error) {
      //console.error('[EXAM] ❌ Error creating exam:', error);
      showToast('Failed to create exam. Please check browser console for details.', 'error');
    } finally {
      setIsCreatingExam(false);
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
        options: ['', '', '', '', ''],
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
        options: ['', '', '', '', ''],
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

  function handleQuestionImageSelect(questionId: string, e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        showToast('Please select a valid image file', 'warning');
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        setQuestions(
          questions.map((q) =>
            q.id === questionId
              ? {
                  ...q,
                  image_file: file,
                  image_preview: event.target?.result as string,
                }
              : q
          )
        );
      };
      reader.readAsDataURL(file);
    }
  }

  function removeQuestionImage(questionId: string) {
    setQuestions(
      questions.map((q) =>
        q.id === questionId
          ? { ...q, image_file: undefined, image_preview: undefined, image_path: undefined }
          : q
      )
    );
  }

  async function handlePdfFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type !== 'application/pdf') {
        showToast('Please select a PDF file', 'warning');
        return;
      }
      setPdfFile(file);
      setShowPdfAnswerSheet(true);
    }
  }

  async function handlePdfAnswerSheetSubmit() {
    try {
      if (!pdfFile) {
        showToast('Please select a PDF file', 'warning');
        return;
      }

      // Validate all answers are selected (1-5)
      const allAnswered = pdfAnswers.every(answer => answer.correct_answer > 0);
      if (!allAnswered) {
        showToast('Please mark correct answers for all 50 questions', 'warning');
        return;
      }

      setPdfUploading(true);

      const teacher = await teacherRepo.findByProfileId(profile?.id!);
      if (!teacher) {
        showToast('Teacher profile not found', 'error');
        return;
      }

      if (!formData.class_id || !formData.title || !formData.exam_date || !formData.exam_time) {
        showToast('Please fill in all required fields', 'warning');
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
        showToast('Failed to upload PDF. Please try again.', 'error');
        return;
      }

      // Save PDF answers to database
      await pdfPaperRepo.createPdfAnswers(exam.id, filePath, pdfAnswers);

      showToast('PDF Paper exam created successfully!', 'success');
      resetForm();
      fetchExams();
    } catch (error) {
      console.error('Error creating PDF exam:', error);
      showToast('Failed to create PDF exam. Please try again.', 'error');
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
    const matchesSearch = exam.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         exam.subject.toLowerCase().includes(searchQuery.toLowerCase());
    if (filterStatus === 'all') return matchesSearch;
    const status = getExamStatus(exam);
    return status.label.toLowerCase() === filterStatus && matchesSearch;
  });

  return (
    <div className="h-full min-h-0 overflow-y-auto p-6 lg:p-8 bg-gray-50/50">
      {/* Header Section */}
      <div className="mb-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold text-slate-900">Exams</h2>
            <p className="text-slate-500 mt-1">Manage and track all your examinations</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl shadow-sm border border-gray-200">
              <Search className="w-5 h-5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search exams..."
                className="bg-transparent border-none outline-none text-sm w-48 lg:w-64 text-slate-700 placeholder-slate-400"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 rounded-lg">
              <FileQuestion className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{exams.length}</p>
              <p className="text-xs text-slate-500">Total Exams</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-50 rounded-lg">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{exams.filter(e => getExamStatus(e).label === 'Active').length}</p>
              <p className="text-xs text-slate-500">Active</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-50 rounded-lg">
              <Clock className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{exams.filter(e => getExamStatus(e).label === 'Scheduled').length}</p>
              <p className="text-xs text-slate-500">Scheduled</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-slate-50 rounded-lg">
              <GraduationCap className="w-5 h-5 text-slate-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{exams.reduce((sum, e) => sum + (e.submission_count || 0), 0)}</p>
              <p className="text-xs text-slate-500">Submissions</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Exams List */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            {/* Filter Tabs */}
            <div className="border-b border-gray-100">
              <div className="flex items-center p-2 gap-1">
                {[
                  { id: 'all', label: 'All Exams', count: exams.length },
                  { id: 'active', label: 'Active', count: exams.filter(e => getExamStatus(e).label === 'Active').length },
                  { id: 'scheduled', label: 'Scheduled', count: exams.filter(e => getExamStatus(e).label === 'Scheduled').length },
                  { id: 'completed', label: 'Completed', count: exams.filter(e => getExamStatus(e).label === 'Completed').length },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setFilterStatus(tab.id)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                      filterStatus === tab.id
                        ? 'bg-[#eb1b23] text-white shadow-md'
                        : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {tab.label}
                    <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
                      filterStatus === tab.id ? 'bg-white/20' : 'bg-slate-100'
                    }`}>
                      {tab.count}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Content */}
            <div className="p-6">
              {loading ? (
                <div className="flex items-center justify-center h-64">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#eb1b23]"></div>
                </div>
              ) : filteredExams.length === 0 ? (
                <div className="text-center py-16">
                  <div className="w-20 h-20 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <FileQuestion className="w-10 h-10 text-slate-300" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">
                    {searchQuery ? 'No exams found' : 'No exams yet'}
                  </h3>
                  <p className="text-slate-500 text-sm max-w-sm mx-auto">
                    {searchQuery 
                      ? 'Try adjusting your search terms or filters to find what you are looking for.' 
                      : 'Create your first exam to get started with assessments.'}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredExams.map((exam) => {
                    const status = getExamStatus(exam);
                    const isPdfExam = exam.total_marks === 50; // Heuristic for PDF exams
                    return (
                      <div
                        key={exam.id}
                        onClick={() => handleExamCardClick(exam)}
                        className="group bg-white border border-gray-100 rounded-xl p-5 hover:shadow-lg hover:border-[#eb1b23]/30 transition-all duration-300 cursor-pointer"
                      >
                        <div className="flex items-start gap-4">
                          {/* Icon */}
                          <div className={`flex-shrink-0 w-14 h-14 rounded-xl flex items-center justify-center ${
                            exam.subject.toLowerCase().includes('physics') ? 'bg-red-50 text-red-600' :
                            exam.subject.toLowerCase().includes('chemistry') ? 'bg-blue-50 text-blue-600' :
                            exam.subject.toLowerCase().includes('maths') || exam.subject.toLowerCase().includes('math') ? 'bg-purple-50 text-purple-600' :
                            exam.subject.toLowerCase().includes('bio') ? 'bg-green-50 text-green-600' :
                            'bg-amber-50 text-amber-600'
                          }`}>
                            {isPdfExam ? <FileText className="w-7 h-7" /> : <BookOpen className="w-7 h-7" />}
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <div className="flex items-center gap-2 mb-1 flex-wrap">
                                  <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                                    {exam.subject}
                                  </span>
                                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${status.color}`}>
                                    {status.label}
                                  </span>
                                  {isPdfExam && (
                                    <span className="px-2 py-0.5 rounded text-xs font-medium bg-orange-50 text-orange-600 border border-orange-100">
                                      PDF
                                    </span>
                                  )}
                                </div>
                                <h4 className="text-lg font-bold text-slate-900 group-hover:text-[#eb1b23] transition-colors truncate">
                                  {exam.title}
                                </h4>
                                <p className="text-sm text-slate-500 mt-1 line-clamp-1">{exam.description || 'No description'}</p>
                              </div>
                              <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-[#eb1b23] transition-colors flex-shrink-0 mt-1" />
                            </div>

                            {/* Meta Info */}
                            <div className="flex flex-wrap items-center gap-4 mt-4 text-sm text-slate-500">
                              <div className="flex items-center gap-1.5">
                                <Calendar className="w-4 h-4" />
                                <span>{new Date(exam.start_time).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <Clock className="w-4 h-4" />
                                <span>{new Date(exam.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <Users className="w-4 h-4" />
                                <span>{exam.submission_count || 0} submissions</span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <div className="w-1.5 h-1.5 rounded-full bg-slate-300"></div>
                                <span>{exam.duration_minutes} min</span>
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
        </div>

        {/* Right Column - Create Form */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 sticky top-6">
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-[#eb1b23] to-red-600 rounded-xl flex items-center justify-center shadow-lg shadow-red-200">
                  <Plus className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Create Exam</h3>
                  <p className="text-xs text-slate-500">Setup exam details & questions</p>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-5 max-h-[calc(100vh-280px)] overflow-y-auto custom-scrollbar">
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

                  {/* Image Upload Section */}
                  <div className="bg-gray-50 rounded-lg p-3">
                    {question.image_preview ? (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-semibold text-gray-600">Image Attached</span>
                          <button
                            onClick={() => removeQuestionImage(question.id)}
                            className="text-xs text-red-600 hover:text-red-700 font-medium"
                          >
                            Remove
                          </button>
                        </div>
                        <img
                          src={question.image_preview}
                          alt="Question"
                          className="w-full h-40 object-contain bg-white rounded border border-gray-200"
                        />
                      </div>
                    ) : (
                      <label className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-[#eb1b23] transition">
                        <Image className="w-5 h-5 text-gray-400 mb-1" />
                        <span className="text-xs text-gray-600 text-center">
                          Add image (optional)
                        </span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleQuestionImageSelect(question.id, e)}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>

                  <div className="space-y-2">
                    {question.options.map((option, optIndex) => (
                      <div key={optIndex} className="flex items-center space-x-2 min-w-0">
                        <input
                          type="radio"
                          name={`correct-${question.id}`}
                          checked={question.correct_answer === String.fromCharCode(65 + optIndex)}
                          onChange={() => updateQuestion(question.id, 'correct_answer', String.fromCharCode(65 + optIndex))}
                          className="text-[#eb1b23] focus:ring-[#eb1b23] flex-shrink-0"
                        />
                        <input
                          type="text"
                          value={option}
                          onChange={(e) => updateQuestionOption(question.id, optIndex, e.target.value)}
                          placeholder={`Option ${String.fromCharCode(65 + optIndex)}`}
                          className="flex-1 min-w-0 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#eb1b23] focus:border-transparent"
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
                disabled={isCreatingExam}
                className="w-full bg-[#eb1b23] text-white px-6 py-3 rounded-lg font-medium hover:bg-red-700 transition-all duration-200 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                {isCreatingExam ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Uploading & Publishing...</span>
                  </>
                ) : (
                  <span>Publish Exam</span>
                )}
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
                {isEditingExamDetails ? (
                  <div className="sticky top-0 bg-gradient-to-r from-[#eb1b23] to-red-700 text-white p-6 flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                      <h2 className="text-2xl font-bold">Edit Exam Details</h2>
                      <button
                        onClick={() => setIsEditingExamDetails(false)}
                        className="text-white hover:bg-red-600 rounded-lg p-2 transition"
                      >
                        <X className="w-6 h-6" />
                      </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-1">Exam Title</label>
                        <input
                          type="text"
                          value={editExamData.title}
                          onChange={(e) => setEditExamData({ ...editExamData, title: e.target.value })}
                          className="w-full px-3 py-2 bg-red-50 border border-red-200 rounded text-gray-900 focus:outline-none focus:ring-2 focus:ring-white"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Duration (minutes)</label>
                        <input
                          type="number"
                          value={editExamData.duration_minutes}
                          onChange={(e) => setEditExamData({ ...editExamData, duration_minutes: parseInt(e.target.value) })}
                          className="w-full px-3 py-2 bg-red-50 border border-red-200 rounded text-gray-900 focus:outline-none focus:ring-2 focus:ring-white"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Date</label>
                        <input
                          type="date"
                          value={editExamData.exam_date}
                          onChange={(e) => setEditExamData({ ...editExamData, exam_date: e.target.value })}
                          className="w-full px-3 py-2 bg-red-50 border border-red-200 rounded text-gray-900 focus:outline-none focus:ring-2 focus:ring-white"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Time</label>
                        <input
                          type="time"
                          value={editExamData.exam_time}
                          onChange={(e) => setEditExamData({ ...editExamData, exam_time: e.target.value })}
                          className="w-full px-3 py-2 bg-red-50 border border-red-200 rounded text-gray-900 focus:outline-none focus:ring-2 focus:ring-white"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium mb-1">Description</label>
                        <textarea
                          value={editExamData.description}
                          onChange={(e) => setEditExamData({ ...editExamData, description: e.target.value })}
                          rows={2}
                          className="w-full px-3 py-2 bg-red-50 border border-red-200 rounded text-gray-900 focus:outline-none focus:ring-2 focus:ring-white"
                        />
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <button
                        onClick={handleUpdateExamDetails}
                        disabled={isSaving}
                        className="flex-1 bg-white text-red-700 px-4 py-2 rounded font-medium hover:bg-gray-100 disabled:opacity-50 flex items-center justify-center space-x-2"
                      >
                        {isSaving ? (
                          <>
                            <div className="w-4 h-4 border-2 border-red-200 border-t-red-700 rounded-full animate-spin"></div>
                            <span>Saving...</span>
                          </>
                        ) : (
                          <span>Save Changes</span>
                        )}
                      </button>
                      <button
                        onClick={() => setIsEditingExamDetails(false)}
                        className="px-4 py-2 bg-red-900 text-white rounded font-medium hover:bg-red-800"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="sticky top-0 bg-gradient-to-r from-[#eb1b23] to-red-700 text-white p-6 flex items-center justify-between">
                    <div>
                      <h2 className="text-2xl font-bold">{selectedExamDetail.title}</h2>
                      <p className="text-red-100 text-sm mt-1">{selectedExamDetail.subject}</p>
                      <div className="flex items-center space-x-4 mt-2 text-sm text-red-100">
                        <span className="flex items-center">
                          <Calendar className="w-4 h-4 mr-1" />
                          {new Date(selectedExamDetail.start_time).toLocaleDateString()}
                        </span>
                        <span className="flex items-center">
                          <Clock className="w-4 h-4 mr-1" />
                          {selectedExamDetail.duration_minutes} mins
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={startEditingExamDetails}
                        className="bg-white text-red-700 p-2 rounded-lg hover:bg-gray-100 transition flex items-center space-x-1"
                        title="Edit exam details"
                      >
                        <Edit className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => setShowDeleteConfirm(true)}
                        className="bg-red-900 text-white p-2 rounded-lg hover:bg-red-800 transition"
                        title="Delete exam"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => setSelectedExamDetail(null)}
                        className="text-white hover:bg-red-600 rounded-lg p-2 transition"
                        title="Close exam details"
                      >
                        <X className="w-6 h-6" />
                      </button>
                    </div>
                  </div>
                )}

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

                                {/* Display image if present */}
                                {question.image_path && (
                                  <div className="mb-4 rounded-lg overflow-hidden bg-gray-50 border border-gray-200">
                                    <img
                                      src={supabase.storage.from('acp').getPublicUrl(question.image_path.replace('acp/', '')).data.publicUrl}
                                      alt={`Question ${question.question_number}`}
                                      className="w-full h-48 object-contain"
                                    />
                                  </div>
                                )}
                                
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

      {/* Delete Confirmation Dialog */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-2 bg-red-100 rounded-lg">
                <AlertCircle className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">Delete Exam?</h3>
            </div>
            <p className="text-gray-600 mb-4">
              Are you sure you want to delete this exam? This action cannot be undone. All exam data and student attempts will be deleted.
            </p>
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-6">
              <p className="text-sm font-medium text-gray-900">
                Exam: <span className="text-red-700">{selectedExamDetail?.title}</span>
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteExam}
                disabled={isDeleting}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                {isDeleting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Deleting...</span>
                  </>
                ) : (
                  <span>Delete Exam</span>
                )}
              </button>
            </div>
          </div>
        </div>
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
  );
}
