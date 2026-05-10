import { Upload, X, Plus, ImageIcon, FileText, ClipboardList, Trash2 } from 'lucide-react';
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

const OPTION_LABELS = ['A', 'B', 'C', 'D', 'E'];

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3">{children}</p>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-600 mb-1.5">{label}</label>
      {children}
    </div>
  );
}

const inputCls = "w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#eb1b23]/20 focus:border-[#eb1b23] bg-gray-50 placeholder:text-gray-400";

export function ExamCreateView({
  formData, setFormData, classes,
  pdfFile, setPdfFile, showPdfAnswerSheet, setShowPdfAnswerSheet,
  pdfAnswers, updatePdfAnswer, handlePdfFileSelect, handlePdfAnswerSheetSubmit,
  questions, addQuestion, updateQuestion, handleQuestionToggleCorrectAnswer,
  updateQuestionOption, handleQuestionImageSelect, removeQuestionImage,
  handleCreateExam, isCreatingExam, pdfUploading,
}: ExamCreateViewProps) {

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 h-full flex flex-col min-h-0">
      {/* Header */}
      <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-3 flex-shrink-0">
        <div className="w-9 h-9 bg-[#eb1b23] rounded-xl flex items-center justify-center shadow-sm shadow-red-200">
          <ClipboardList className="w-4.5 h-4.5 text-white" style={{ width: 18, height: 18 }} />
        </div>
        <div>
          <h3 className="text-sm font-bold text-gray-900">Create Exam</h3>
          <p className="text-[11px] text-gray-400">Fill in details and add questions</p>
        </div>
      </div>

      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">

        {/* ── Details ── */}
        <div>
          <SectionLabel>Details</SectionLabel>
          <div className="space-y-3">
            <Field label="Assign to Class">
              <select
                value={formData.class_id}
                onChange={e => {
                  const cls = classes.find((c: Class) => c.id === e.target.value);
                  setFormData({ ...formData, class_id: e.target.value, subject: cls?.subject || '' });
                }}
                className={inputCls}
              >
                <option value="">Select a class…</option>
                {classes.map((cls: Class) => (
                  <option key={cls.id} value={cls.id}>{cls.title}</option>
                ))}
              </select>
            </Field>

            <Field label="Exam Title">
              <input
                type="text"
                value={formData.title}
                onChange={e => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g. Weekly Theory Test 05"
                className={inputCls}
              />
            </Field>
          </div>
        </div>

        <div className="border-t border-gray-100" />

        {/* ── Schedule ── */}
        <div>
          <SectionLabel>Schedule</SectionLabel>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <Field label="Start Date">
                <input type="date" value={formData.exam_date}
                  onChange={e => setFormData({ ...formData, exam_date: e.target.value })}
                  className={inputCls} />
              </Field>
              <Field label="Start Time">
                <input type="time" value={formData.exam_time}
                  onChange={e => setFormData({ ...formData, exam_time: e.target.value })}
                  className={inputCls} />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Field label="End Date">
                <input type="date" value={formData.end_date}
                  onChange={e => setFormData({ ...formData, end_date: e.target.value })}
                  className={inputCls} />
              </Field>
              <Field label="End Time">
                <input type="time" value={formData.end_time}
                  onChange={e => setFormData({ ...formData, end_time: e.target.value })}
                  className={inputCls} />
              </Field>
            </div>
            <Field label="Duration (minutes)">
              <input type="number" value={formData.duration_minutes}
                onChange={e => setFormData({ ...formData, duration_minutes: parseInt(e.target.value) || 60 })}
                className={inputCls} />
            </Field>
          </div>
        </div>

        <div className="border-t border-gray-100" />

        {/* ── Exam Type Toggle ── */}
        <div>
          <SectionLabel>Exam Type</SectionLabel>
          <div className="flex gap-2">
            {[
              { value: 'manual', label: 'Manual Questions', icon: FileText },
              { value: 'pdf',    label: 'PDF Upload',       icon: Upload },
            ].map(opt => {
              const active = formData.exam_type === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    setFormData({ ...formData, exam_type: opt.value });
                    if (opt.value === 'pdf') { setShowPdfAnswerSheet(false); setPdfFile(null); }
                  }}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border text-xs font-semibold transition-all ${
                    active
                      ? 'bg-[#eb1b23] text-white border-[#eb1b23] shadow-sm shadow-red-200'
                      : 'bg-gray-50 text-gray-600 border-gray-200 hover:border-[#eb1b23] hover:text-[#eb1b23]'
                  }`}
                >
                  <opt.icon style={{ width: 14, height: 14 }} />
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── PDF Upload ── */}
        {formData.exam_type === 'pdf' && !showPdfAnswerSheet && (
          <div>
            <SectionLabel>Upload Paper</SectionLabel>
            <label className="flex flex-col items-center gap-3 border-2 border-dashed border-gray-200 rounded-xl p-6 cursor-pointer hover:border-[#eb1b23] hover:bg-red-50/30 transition-all group">
              <div className="w-10 h-10 rounded-xl bg-gray-100 group-hover:bg-red-100 flex items-center justify-center transition-colors">
                <Upload className="w-5 h-5 text-gray-400 group-hover:text-[#eb1b23] transition-colors" />
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold text-gray-700">Click to upload PDF</p>
                <p className="text-xs text-gray-400 mt-0.5">Supports .pdf files</p>
              </div>
              <input type="file" accept=".pdf" onChange={handlePdfFileSelect} className="hidden" />
              {pdfFile && (
                <span className="text-xs font-medium text-green-700 bg-green-50 border border-green-200 px-3 py-1 rounded-full">
                  ✓ {pdfFile.name}
                </span>
              )}
            </label>
          </div>
        )}

        {/* ── Manual Questions ── */}
        {formData.exam_type === 'manual' && (
          <div>
            <SectionLabel>Questions</SectionLabel>
            <div className="space-y-4">
              {questions.map((question, qIndex) => (
                <div key={question.id} className="border border-gray-200 rounded-xl overflow-hidden">
                  {/* Question header */}
                  <div className="flex items-center justify-between px-4 py-2.5 bg-gray-50 border-b border-gray-200">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-[#eb1b23] text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0">
                        {qIndex + 1}
                      </span>
                      <span className="text-xs font-semibold text-gray-700">Question {qIndex + 1}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-gray-500">Marks:</span>
                      <input
                        type="number"
                        value={question.marks}
                        min={1}
                        onChange={e => updateQuestion(question.id, 'marks', parseInt(e.target.value) || 1)}
                        className="w-12 text-xs text-center border border-gray-200 rounded-lg px-1 py-1 focus:outline-none focus:ring-1 focus:ring-[#eb1b23]"
                      />
                      {questions.length > 1 && (
                        <button
                          onClick={() => {/* remove handled in parent – just visual */}}
                          className="text-gray-300 hover:text-red-500 transition-colors"
                          title="Remove question"
                        >
                          <Trash2 style={{ width: 14, height: 14 }} />
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="p-4 space-y-3">
                    {/* Question text */}
                    <textarea
                      value={question.question_text}
                      onChange={e => updateQuestion(question.id, 'question_text', e.target.value)}
                      placeholder="Enter question text…"
                      rows={2}
                      className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#eb1b23]/20 focus:border-[#eb1b23] resize-none placeholder:text-gray-400"
                    />

                    {/* Image upload */}
                    <div>
                      {question.image_preview ? (
                        <div className="relative rounded-xl overflow-hidden border border-gray-200">
                          <img
                            src={question.image_preview}
                            alt="Question visual"
                            className="w-full h-32 object-contain bg-gray-50"
                          />
                          <button
                            onClick={() => removeQuestionImage(question.id)}
                            className="absolute top-2 right-2 w-6 h-6 bg-white rounded-full shadow flex items-center justify-center text-red-500 hover:bg-red-50 transition"
                          >
                            <X style={{ width: 12, height: 12 }} />
                          </button>
                        </div>
                      ) : (
                        <label className="flex items-center gap-2 text-xs text-gray-400 hover:text-[#eb1b23] cursor-pointer transition-colors">
                          <ImageIcon style={{ width: 14, height: 14 }} />
                          <span>Attach image (optional)</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={e => handleQuestionImageSelect(question.id, e)}
                            className="hidden"
                          />
                        </label>
                      )}
                    </div>

                    {/* Options */}
                    <div className="space-y-1.5">
                      {question.options.map((option, optIndex) => {
                        const label = OPTION_LABELS[optIndex] ?? String(optIndex + 1);
                        const isCorrect = (question.correct_answer || '').split(',').map(s => s.trim()).includes(String(optIndex + 1));
                        return (
                          <div key={optIndex} className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleQuestionToggleCorrectAnswer(question.id, String(optIndex + 1))}
                              className={`w-6 h-6 rounded-full text-[11px] font-bold flex-shrink-0 transition-all border ${
                                isCorrect
                                  ? 'bg-[#eb1b23] text-white border-[#eb1b23]'
                                  : 'bg-white text-gray-400 border-gray-300 hover:border-[#eb1b23] hover:text-[#eb1b23]'
                              }`}
                            >
                              {label}
                            </button>
                            <input
                              type="text"
                              value={option}
                              onChange={e => updateQuestionOption(question.id, optIndex, e.target.value)}
                              placeholder={`Option ${label}`}
                              className="flex-1 text-sm border border-gray-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#eb1b23] focus:border-[#eb1b23]"
                            />
                          </div>
                        );
                      })}
                      <p className="text-[10px] text-gray-400 pt-0.5">Click a letter to mark it as correct</p>
                    </div>
                  </div>
                </div>
              ))}

              <button
                type="button"
                onClick={addQuestion}
                className="w-full flex items-center justify-center gap-2 py-2.5 border-2 border-dashed border-gray-200 rounded-xl text-xs font-semibold text-gray-500 hover:border-[#eb1b23] hover:text-[#eb1b23] hover:bg-red-50/30 transition-all"
              >
                <Plus style={{ width: 14, height: 14 }} />
                Add Question
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Sticky footer publish button */}
      {formData.exam_type === 'manual' && (
        <div className="px-5 py-4 border-t border-gray-100 flex-shrink-0">
          <button
            onClick={handleCreateExam}
            disabled={isCreatingExam}
            className="w-full bg-[#eb1b23] text-white py-2.5 rounded-xl text-sm font-bold hover:bg-red-700 transition-all shadow-sm shadow-red-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isCreatingExam ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Publishing…
              </>
            ) : 'Publish Exam'}
          </button>
        </div>
      )}

      {/* PDF answer sheet modal */}
      {formData.exam_type === 'pdf' && showPdfAnswerSheet && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => { setShowPdfAnswerSheet(false); setPdfFile(null); }} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[90vh]">
            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div>
                <h4 className="font-bold text-gray-900">MCQ Answer Sheet</h4>
                <p className="text-xs text-gray-500 mt-0.5">Select the correct answer for each question (1–5)</p>
              </div>
              <button
                onClick={() => { setShowPdfAnswerSheet(false); setPdfFile(null); }}
                className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition"
              >
                <X style={{ width: 16, height: 16 }} />
              </button>
            </div>

            {/* PDF filename */}
            {pdfFile && (
              <div className="mx-6 mt-4 flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl px-4 py-2.5">
                <FileText className="w-4 h-4 text-green-600 flex-shrink-0" />
                <span className="text-xs font-medium text-green-800 truncate">{pdfFile.name}</span>
              </div>
            )}

            {/* Answer grid */}
            <div className="overflow-y-auto flex-1 px-6 py-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {pdfAnswers.map(answer => (
                  <div
                    key={answer.question_no}
                    className="flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2"
                  >
                    <span className="text-xs font-bold text-gray-600 w-6 flex-shrink-0">Q{answer.question_no}</span>
                    <div className="flex gap-1 flex-1">
                      {[1, 2, 3, 4, 5].map(opt => (
                        <button
                          key={opt}
                          onClick={() => updatePdfAnswer(answer.question_no, opt)}
                          className={`flex-1 h-7 rounded-lg text-xs font-bold transition-all ${
                            answer.correct_answer === opt
                              ? 'bg-[#eb1b23] text-white shadow-sm'
                              : 'bg-white border border-gray-200 text-gray-600 hover:border-[#eb1b23] hover:text-[#eb1b23]'
                          }`}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Modal footer */}
            <div className="px-6 py-4 border-t border-gray-100">
              <button
                onClick={handlePdfAnswerSheetSubmit}
                disabled={pdfUploading}
                className="w-full bg-[#eb1b23] text-white py-2.5 rounded-xl text-sm font-bold hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {pdfUploading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Uploading & Saving…
                  </>
                ) : 'Save PDF Paper & Answers'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
