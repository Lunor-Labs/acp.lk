import { Upload, X, Plus, Image } from 'lucide-react';
import type { Question, PdfAnswer, Class } from './types';

interface ExamCreateViewProps {
  formData: any;
  setFormData: (data: any) => void;
  classes: Class[];
  pdfFile: File | null;
  setPdfFile: (f: File | null) => void;
  showPdfAnswerSheet: boolean;
  setShowPdfAnswerSheet: (s: boolean) => void;
  pdfAnswers: PdfAnswer[];
  updatePdfAnswer: (q: number, a: number) => void;
  handlePdfFileSelect: (e: any) => void;
  questions: Question[];
  addQuestion: () => void;
  updateQuestion: (id: string, field: string, val: any) => void;
  handleQuestionToggleCorrectAnswer: (id: string, option: string) => void;
  updateQuestionOption: (id: string, idx: number, val: string) => void;
  handleQuestionImageSelect: (id: string, e: any) => void;
  removeQuestionImage: (id: string) => void;
  handleCreateExam: () => void;
  handlePdfAnswerSheetSubmit: () => void;
  isCreatingExam: boolean;
  pdfUploading: boolean;
}

export function ExamCreateView({
  formData, setFormData, classes,
  pdfFile, setPdfFile, showPdfAnswerSheet, setShowPdfAnswerSheet,
  pdfAnswers, updatePdfAnswer, handlePdfFileSelect, handlePdfAnswerSheetSubmit,
  questions, addQuestion, updateQuestion, handleQuestionToggleCorrectAnswer,
  updateQuestionOption, handleQuestionImageSelect, removeQuestionImage,
  handleCreateExam, isCreatingExam, pdfUploading
}: ExamCreateViewProps) {

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 sticky top-6 max-h-[calc(100vh-2rem)] flex flex-col">
      <div className="p-6 border-b border-gray-100 flex-shrink-0">
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

      <div className="p-6 space-y-5 overflow-y-auto flex-1 custom-scrollbar">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Assign to Class
          </label>
          <select
            value={formData.class_id}
            onChange={(e) => {
              const selectedClass = classes.find((c: Class) => c.id === e.target.value);
              setFormData({
                ...formData,
                class_id: e.target.value,
                subject: selectedClass?.subject || '',
              });
            }}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#eb1b23] focus:border-transparent"
          >
            <option value="">Select a class</option>
            {classes.map((cls: Class) => (
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
              Active From Date
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
              Active From Time
            </label>
            <input
              type="time"
              value={formData.exam_time}
              onChange={(e) => setFormData({ ...formData, exam_time: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#eb1b23] focus:border-transparent"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Active Until Date
            </label>
            <input
              type="date"
              value={formData.end_date}
              onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#eb1b23] focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Active Until Time
            </label>
            <input
              type="time"
              value={formData.end_time}
              onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
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
                    type="checkbox"
                    name={`correct-${question.id}`}
                    checked={(question.correct_answer || '').split(',').map(s => s.trim()).includes(String(optIndex + 1))}
                    onChange={() => handleQuestionToggleCorrectAnswer(question.id, String(optIndex + 1))}
                    className="text-[#eb1b23] focus:ring-[#eb1b23] flex-shrink-0 rounded"
                  />
                  <input
                    type="text"
                    value={option}
                    onChange={(e) => updateQuestionOption(question.id, optIndex, e.target.value)}
                    placeholder={`Option ${optIndex + 1}`}
                    className="flex-1 min-w-0 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#eb1b23] focus:border-transparent"
                  />
                </div>
              ))}
              <p className="text-xs text-gray-400 italic mt-2">
                select the checkboxes to mark correct answers
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
  );
}
