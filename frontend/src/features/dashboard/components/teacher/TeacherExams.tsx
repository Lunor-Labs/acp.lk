import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { TeacherExamsApi, TeacherCoursesApi, FilesApi } from '../../api';
import { ExamList } from './exams/ExamList';
import { ExamCreateView } from './exams/ExamCreateView';
import { ExamDetailModal } from './exams/ExamDetailModal';
import { AlertCircle } from 'lucide-react';
import type { Exam, Class, PdfAnswer, ManualQuestion, ExamDetail, Question } from './exams/types';

export default function TeacherExams() {
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
  const [editExamData, setEditExamData] = useState({ title: '', description: '', exam_date: '', exam_time: '', end_date: '', end_time: '', duration_minutes: 0 });
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Edit Question State
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);
  const [editQuestionData, setEditQuestionData] = useState<{
    id: string;
    question_text: string;
    options: string[];
    marks: number;
    image_path?: string;
    image_file?: File;
    image_preview?: string;
    remove_image?: boolean;
  } | null>(null);
  const [isUpdatingQuestion, setIsUpdatingQuestion] = useState(false);

  // Toast notification state
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'warning' | 'info'; visible: boolean } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info') => {
    setToast({ message, type, visible: true });
    setTimeout(() => {
      setToast(prev => prev ? { ...prev, visible: false } : null);
      setTimeout(() => setToast(null), 300);
    }, 4000);
  };

  const [formData, setFormData] = useState({
    class_id: '',
    title: '',
    subject: '',
    description: '',
    exam_date: '',
    exam_time: '',
    end_date: '',
    end_time: '',
    duration_minutes: 60,
    exam_type: 'manual', // 'manual' or 'pdf'
  });

  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfAnswers, setPdfAnswers] = useState<PdfAnswer[]>(
    Array.from({ length: 50 }, (_, i) => ({
      question_no: i + 1,
      correct_answer: 0,
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
      const data = await TeacherCoursesApi.getMyClasses();
      setClasses(data.map(c => ({ id: c.id, title: c.title, subject: c.subject })));
    } catch (error) {
      console.error('Error fetching classes:', error);
    }
  }

  async function fetchExams() {
    try {
      setLoading(true);
      const data = await TeacherExamsApi.getExams();
      setExams(data);
    } catch (error) {
      console.error('Error fetching exams:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleExamCardClick(exam: Exam) {
    try {
      setSelectedExamDetail({ ...exam, pdfPath: null, markedAnswers: [], manualQuestions: [], isPdfExam: false });
      setLoadingExamDetail(true);
      const detail = await TeacherExamsApi.getExamDetail(exam.id);

      if (detail.isPdf) {
        const formattedAnswers: PdfAnswer[] = (detail.pdfAnswers || []).map((a: any) => ({
          question_no: a.question_no,
          correct_answer: a.correct_answer,
        }));
        setMarkedAnswers(formattedAnswers);
        setManualQuestions([]);
        setEditedAnswers({});
        setSelectedExamDetail({
          ...exam,
          pdfPath: detail.pdfUrl || null,
          markedAnswers: formattedAnswers,
          manualQuestions: [],
          isPdfExam: true,
        });
      } else {
        const formattedQuestions: ManualQuestion[] = (detail.questions || []).map((q: any) => ({
          id: q.id,
          question_number: q.question_number,
          question_text: q.question_text,
          options: q.options || [],
          correct_answer: q.correct_answer,
          marks: q.marks,
          image_path: q.image_path,
        }));
        const manualAnswers = formattedQuestions.map(q => ({
          question_no: q.question_number,
          correct_answer: q.correct_answer,
        }));
        setManualQuestions(formattedQuestions);
        setMarkedAnswers(manualAnswers);
        setEditedAnswers({});
        setSelectedExamDetail({
          ...exam,
          pdfPath: null,
          markedAnswers: manualAnswers,
          manualQuestions: formattedQuestions,
          isPdfExam: false,
        });
      }
    } catch (error) {
      console.error('Error loading exam details:', error);
      showToast('Failed to load exam details', 'error');
    } finally {
      setLoadingExamDetail(false);
    }
  }

  async function handleUpdateExamDetails() {
    if (!selectedExamDetail) return;
    try {
      setIsSaving(true);
      const startTime = new Date(`${editExamData.exam_date}T${editExamData.exam_time}`);
      const endTime = new Date(`${editExamData.end_date}T${editExamData.end_time}`);

      if (endTime <= startTime) {
        showToast('End time must be after start time', 'warning');
        setIsSaving(false);
        return;
      }

      await TeacherExamsApi.updateExam(selectedExamDetail.id, {
        title: editExamData.title,
        description: editExamData.description,
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString(),
        duration_minutes: editExamData.duration_minutes,
      });

      showToast('Exam details updated successfully!', 'success');
      setIsEditingExamDetails(false);
      fetchExams();
      
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
      await TeacherExamsApi.deleteExam(selectedExamDetail.id);
      showToast('Exam deleted successfully!', 'success');
      setSelectedExamDetail(null);
      setShowDeleteConfirm(false);
      fetchExams();
    } catch (error) {
      showToast('Failed to delete exam. Please try again.', 'error');
    } finally {
      setIsDeleting(false);
    }
  }

  async function handleUpdateQuestion() {
    if (!editQuestionData || !selectedExamDetail) return;
    try {
      setIsUpdatingQuestion(true);
      let finalImagePath: string | null = editQuestionData.image_path || null;

      if (editQuestionData.image_file) {
        const ext = editQuestionData.image_file.type.split('/')[1] || 'jpg';
        const fileName = `${Date.now()}-q-edit-${Math.random().toString(36).substr(2, 9)}.${ext}`;
        const filePath = `questions/images/${fileName}`;
        const stored = await FilesApi.uploadWithSignedUrl('acp', filePath, editQuestionData.image_file);
        finalImagePath = `acp/${stored}`;
      } else if (editQuestionData.remove_image) {
        finalImagePath = null;
      }

      const filteredOptions = editQuestionData.options.map(opt => opt.trim());
      await TeacherExamsApi.updateQuestion(selectedExamDetail.id, editQuestionData.id, {
        question_text: editQuestionData.question_text,
        options: filteredOptions,
        marks: editQuestionData.marks,
        image_path: finalImagePath,
      });

      setManualQuestions(manualQuestions.map(q =>
        q.id === editQuestionData.id ? {
          ...q, question_text: editQuestionData.question_text,
          options: filteredOptions, marks: editQuestionData.marks,
          image_path: finalImagePath || undefined
        } : q
      ));

      showToast('Question updated successfully!', 'success');
      setEditingQuestionId(null);
      setEditQuestionData(null);
    } catch (error) {
      showToast('Failed to update question', 'error');
    } finally {
      setIsUpdatingQuestion(false);
    }
  }

  async function handleSaveAnswerChanges() {
    if (!selectedExamDetail) return;
    try {
      if (Object.keys(editedAnswers).length === 0) return showToast('No changes made to save', 'warning');

      setIsSaving(true);
      await TeacherExamsApi.updateAnswers(selectedExamDetail.id, editedAnswers, selectedExamDetail.isPdfExam);

      if (selectedExamDetail.isPdfExam) {
        setMarkedAnswers(markedAnswers.map(answer => ({
          question_no: answer.question_no,
          correct_answer: editedAnswers[answer.question_no] ?? answer.correct_answer,
        })));
      } else {
        setManualQuestions(manualQuestions.map(q =>
          editedAnswers[q.question_number] ? { ...q, correct_answer: editedAnswers[q.question_number] as string } : q
        ));
      }
      setEditedAnswers({});
      showToast('Answer sheet updated successfully!', 'success');
    } catch (error) {
      showToast('Failed to save changes', 'error');
    } finally {
      setIsSaving(false);
    }
  }

  function updateAnswerEdit(identifier: string | number, answer: string | number) {
    if (typeof answer === 'number') {
      setEditedAnswers(prev => ({ ...prev, [identifier]: answer }));
    } else {
      setEditedAnswers(prev => {
        const originalQuestion = manualQuestions.find(q => q.question_number === Number(identifier));
        const startingAnswer = prev[identifier] !== undefined ? prev[identifier] as string : (originalQuestion?.correct_answer || '');
        let currentAnswers = startingAnswer ? startingAnswer.split(',') : [];
        if (currentAnswers.includes(answer as string)) {
          currentAnswers = currentAnswers.filter(a => a !== answer);
        } else {
          currentAnswers.push(answer as string);
          currentAnswers.sort();
        }
        return { ...prev, [identifier]: currentAnswers.join(',') };
      });
    }
  }

  function resetForm() {
    setFormData({
      class_id: '', title: '', subject: '', description: '',
      exam_date: '', exam_time: '', end_date: '', end_time: '',
      duration_minutes: 60, exam_type: 'manual',
    });
    setQuestions([{ id: '1', question_text: '', options: ['', '', '', '', ''], correct_answer: '', marks: 1 }]);
    setPdfFile(null);
    setShowPdfAnswerSheet(false);
  }

  async function handleCreateExam() {
    try {
      if (!formData.class_id || !formData.title || !formData.exam_date || !formData.exam_time || !formData.end_date || !formData.end_time) {
        return showToast('Please fill in all required fields', 'warning');
      }

      const validQuestions = questions.filter(q => q.question_text.trim() || q.image_file || q.image_path);
      if (validQuestions.length === 0) return showToast('Please add at least one question', 'warning');

      const startTime = new Date(`${formData.exam_date}T${formData.exam_time}`);
      const endTime = new Date(`${formData.end_date}T${formData.end_time}`);
      if (endTime <= startTime) return showToast('End time must be after start time', 'warning');

      setIsCreatingExam(true);
      const payload: any = { type: 'manual', ...formData, start_time: startTime.toISOString(), end_time: endTime.toISOString(), total_marks: validQuestions.reduce((sum, q) => sum + q.marks, 0), questions: [] };

      for (let index = 0; index < validQuestions.length; index++) {
        const q = validQuestions[index];
        let imagePath: string | undefined = undefined;
        if (q.image_file) {
          const ext = q.image_file.type.split('/')[1] || 'jpg';
          const fileName = `${Date.now()}-q${index+1}-${Math.random().toString(36).substr(2, 9)}.${ext}`;
          const filePath = `questions/images/${fileName}`;
          const storedPath = await FilesApi.uploadWithSignedUrl('acp', filePath, q.image_file);
          imagePath = `acp/${storedPath}`;
        }
        payload.questions.push({
          question_number: index + 1, question_text: q.question_text, options: q.options.filter(opt => opt.trim()),
          correct_answer: q.correct_answer, marks: q.marks, image_path: imagePath,
        });
      }

      payload.total_marks = validQuestions.reduce((sum, q) => sum + q.marks, 0);

      await TeacherExamsApi.createExam(payload);
      showToast('Exam created successfully!', 'success');
      resetForm();
      fetchExams();
    } catch(err) {
      showToast('Failed to create exam.', 'error');
    } finally {
      setIsCreatingExam(false);
    }
  }

  async function handlePdfAnswerSheetSubmit() {
    if (!pdfFile || !formData.title) return;
    try {
      setPdfUploading(true);
      const startTime = new Date(`${formData.exam_date}T${formData.exam_time}`);
      const endTime = new Date(`${formData.end_date}T${formData.end_time}`);

      const fileName = `exam-${Date.now()}.pdf`;
      const filePath = `pdf/papers/${fileName}`;
      const storedPath = await FilesApi.uploadWithSignedUrl('acp', filePath, pdfFile);

      await TeacherExamsApi.createExam({
        type: 'pdf', ...formData, start_time: startTime.toISOString(), end_time: endTime.toISOString(),
        total_marks: 50, pdfPath: `acp/${storedPath}`, pdfAnswers
      });
      showToast('PDF Paper exam created successfully!', 'success');
      resetForm();
      fetchExams();
    } catch(err) {
      showToast('Failed to create PDF exam.', 'error');
    } finally {
      setPdfUploading(false);
    }
  }

  return (
    <div className="flex h-full text-left bg-gray-50/50">
      <div className="flex-1 overflow-hidden relative">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-6 h-full min-h-0 overflow-y-auto">
          {/* Left Column - Exams List */}
          <div className="lg:col-span-2">
            <ExamList 
              exams={exams} classes={classes} loading={loading}
              searchQuery={searchQuery} setSearchQuery={setSearchQuery}
              filterStatus={filterStatus} setFilterStatus={setFilterStatus}
              onExamClick={handleExamCardClick} onCreateClick={() => window.scrollTo(0, 0)}
            />
          </div>

          {/* Right Column - Create Form */}
          <div className="lg:col-span-1">
            <ExamCreateView
              formData={formData} setFormData={setFormData} classes={classes}
              pdfFile={pdfFile} setPdfFile={setPdfFile}
              showPdfAnswerSheet={showPdfAnswerSheet} setShowPdfAnswerSheet={setShowPdfAnswerSheet}
              pdfAnswers={pdfAnswers} updatePdfAnswer={(q: number, a: number) => setPdfAnswers(pdfAnswers.map(ans => ans.question_no === q ? { ...ans, correct_answer: a } : ans))}
              handlePdfFileSelect={(e: any) => { if(e.target.files?.[0]) { setPdfFile(e.target.files[0]); setShowPdfAnswerSheet(true); } }}
              questions={questions} addQuestion={() => setQuestions([...questions, { id: Date.now().toString(), question_text: '', options: ['', '', '', '', ''], correct_answer: '', marks: 1 }])}
              updateQuestion={(id: string, field: string, val: any) => setQuestions(questions.map((q) => q.id === id ? { ...q, [field]: val } : q))}
              handleQuestionToggleCorrectAnswer={(questionId: string, optionLetter: string) => {
                setQuestions(questions.map(q => {
                  if (q.id === questionId) {
                    let currentAnswers = q.correct_answer ? q.correct_answer.split(',') : [];
                    if (currentAnswers.includes(optionLetter)) currentAnswers = currentAnswers.filter(a => a !== optionLetter);
                    else currentAnswers.push(optionLetter);
                    return { ...q, correct_answer: currentAnswers.sort().join(',') };
                  }
                  return q;
                }));
              }}
              updateQuestionOption={(id: string, optionIndex: number, value: string) => setQuestions(questions.map((q) => q.id === id ? { ...q, options: q.options.map((opt, i) => (i === optionIndex ? value : opt)) } : q))}
              handleQuestionImageSelect={(id: string, e: any) => {
                const file = e.target.files?.[0];
                if (file) {
                  const reader = new FileReader();
                  reader.onload = (event) => setQuestions(questions.map((q) => q.id === id ? { ...q, image_file: file, image_preview: event.target?.result as string } : q));
                  reader.readAsDataURL(file);
                }
              }}
              removeQuestionImage={(id: string) => setQuestions(questions.map((q) => q.id === id ? { ...q, image_file: undefined, image_preview: undefined } : q))}
              handleCreateExam={handleCreateExam} handlePdfAnswerSheetSubmit={handlePdfAnswerSheetSubmit}
              isCreatingExam={isCreatingExam} pdfUploading={pdfUploading}
            />
          </div>
        </div>
      </div>

      {selectedExamDetail && (
        <ExamDetailModal 
          selectedExamDetail={selectedExamDetail} setSelectedExamDetail={setSelectedExamDetail}
          loadingExamDetail={loadingExamDetail} isEditingExamDetails={isEditingExamDetails}
          setIsEditingExamDetails={setIsEditingExamDetails} editExamData={editExamData} setEditExamData={setEditExamData}
          handleUpdateExamDetails={handleUpdateExamDetails} isSaving={isSaving} setShowDeleteConfirm={setShowDeleteConfirm}
          markedAnswers={markedAnswers} updateAnswerEdit={updateAnswerEdit} editedAnswers={editedAnswers}
          handleSaveAnswerChanges={handleSaveAnswerChanges} manualQuestions={manualQuestions}
          editingQuestionId={editingQuestionId} setEditingQuestionId={setEditingQuestionId}
          editQuestionData={editQuestionData} setEditQuestionData={setEditQuestionData}
          handleStartEditQuestion={(q: ManualQuestion) => {
            setEditingQuestionId(q.id); setEditQuestionData({ id: q.id, question_text: q.question_text, options: [...q.options], marks: q.marks, image_path: q.image_path });
          }}
          handleEditQuestionRemoveImage={() => editQuestionData && setEditQuestionData({...editQuestionData, image_file: undefined, image_preview: undefined, remove_image: true})}
          handleEditQuestionImageSelect={(e: any) => {
             const file = e.target.files?.[0];
             if (file && editQuestionData) {
               const reader = new FileReader();
               reader.onload = (event) => setEditQuestionData({...editQuestionData, image_file: file, image_preview: event.target?.result as string, remove_image: false});
               reader.readAsDataURL(file);
             }
          }}
          handleUpdateQuestion={handleUpdateQuestion} isUpdatingQuestion={isUpdatingQuestion}
        />
      )}

      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-2 bg-red-100 rounded-lg">
                <AlertCircle className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">Delete Exam?</h3>
            </div>
            <p className="text-gray-600 mb-4">Are you sure you want to delete this exam? This action cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={() => setShowDeleteConfirm(false)} className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg">Cancel</button>
              <button onClick={handleDeleteExam} disabled={isDeleting} className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg">
                {isDeleting ? 'Deleting...' : 'Delete Exam'}
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className={`fixed bottom-6 right-6 z-[100] transition-all duration-300 transform ${toast.visible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
          <div className="bg-white px-5 py-4 rounded-xl shadow-2xl border-l-4 min-w-[320px] max-w-[480px]">
             {toast.message}
          </div>
        </div>
      )}
    </div>
  );
}
