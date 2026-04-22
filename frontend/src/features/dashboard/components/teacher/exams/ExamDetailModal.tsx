import { X, Calendar, Clock, Edit, Trash2, FileText, Image, AlertCircle } from 'lucide-react';
import type { ExamDetail, ManualQuestion } from './types';

// Derives public URL from stored image_path (format: "acp/questions/images/foo.jpg")
function getImageUrl(imagePath: string): string {
  // image_path is stored as "acp/path/to/file" - strip the bucket prefix
  const path = imagePath.startsWith('acp/') ? imagePath.slice(4) : imagePath;
  // The backend's /api/files/public-url is async, so we construct the URL directly
  // from the known Supabase public URL pattern via env var
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
  return `${supabaseUrl}/storage/v1/object/public/acp/${path}`;
}

interface ExamDetailModalProps {
  selectedExamDetail: ExamDetail;
  setSelectedExamDetail: (e: ExamDetail | null) => void;
  loadingExamDetail: boolean;
  isEditingExamDetails: boolean;
  setIsEditingExamDetails: (s: boolean) => void;
  editExamData: any;
  setEditExamData: (d: any) => void;
  handleUpdateExamDetails: () => void;
  isSaving: boolean;
  setShowDeleteConfirm: (s: boolean) => void;
  markedAnswers: any[];
  updateAnswerEdit: (q: number, opt: number | string) => void;
  editedAnswers: Record<string, string | number>;
  handleSaveAnswerChanges: () => void;
  manualQuestions: ManualQuestion[];
  editingQuestionId: string | null;
  setEditingQuestionId: (id: string | null) => void;
  editQuestionData: any;
  setEditQuestionData: (d: any) => void;
  handleStartEditQuestion: (q: ManualQuestion) => void;
  handleEditQuestionRemoveImage: () => void;
  handleEditQuestionImageSelect: (e: any) => void;
  handleUpdateQuestion: () => void;
  isUpdatingQuestion: boolean;
}

export function ExamDetailModal({
  selectedExamDetail, setSelectedExamDetail, loadingExamDetail,
  isEditingExamDetails, setIsEditingExamDetails, editExamData, setEditExamData,
  handleUpdateExamDetails, isSaving, setShowDeleteConfirm,
  markedAnswers, updateAnswerEdit, editedAnswers, handleSaveAnswerChanges,
  manualQuestions, editingQuestionId, setEditingQuestionId,
  editQuestionData, setEditQuestionData, handleStartEditQuestion,
  handleEditQuestionRemoveImage, handleEditQuestionImageSelect,
  handleUpdateQuestion, isUpdatingQuestion
}: ExamDetailModalProps) {

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        {loadingExamDetail ? (
          <div className="flex items-center justify-center h-96">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#eb1b23]"></div>
          </div>
        ) : (
          <>
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
                    <label className="block text-sm font-medium mb-1">Active From Date</label>
                    <input
                      type="date"
                      value={editExamData.exam_date}
                      onChange={(e) => setEditExamData({ ...editExamData, exam_date: e.target.value })}
                      className="w-full px-3 py-2 bg-red-50 border border-red-200 rounded text-gray-900 focus:outline-none focus:ring-2 focus:ring-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Active From Time</label>
                    <input
                      type="time"
                      value={editExamData.exam_time}
                      onChange={(e) => setEditExamData({ ...editExamData, exam_time: e.target.value })}
                      className="w-full px-3 py-2 bg-red-50 border border-red-200 rounded text-gray-900 focus:outline-none focus:ring-2 focus:ring-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Active Until Date</label>
                    <input
                      type="date"
                      value={editExamData.end_date}
                      onChange={(e) => setEditExamData({ ...editExamData, end_date: e.target.value })}
                      className="w-full px-3 py-2 bg-red-50 border border-red-200 rounded text-gray-900 focus:outline-none focus:ring-2 focus:ring-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Active Until Time</label>
                    <input
                      type="time"
                      value={editExamData.end_time}
                      onChange={(e) => setEditExamData({ ...editExamData, end_time: e.target.value })}
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
                    onClick={() => setIsEditingExamDetails(true)}
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
                            {editingQuestionId === question.id ? (
                              <div className="space-y-4">
                                <div className="flex items-center justify-between mb-3">
                                  <span className="font-bold text-gray-900">Edit Q{question.question_number}</span>
                                  <div className="flex items-center gap-2">
                                    <label className="text-sm text-gray-600">Marks:</label>
                                    <input 
                                      type="number" 
                                      value={editQuestionData?.marks || 1} 
                                      onChange={e => setEditQuestionData({...editQuestionData!, marks: parseInt(e.target.value) || 1})}
                                      className="w-16 px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-[#eb1b23]"
                                    />
                                  </div>
                                </div>
                                
                                <textarea
                                  value={editQuestionData?.question_text || ''}
                                  onChange={e => setEditQuestionData({...editQuestionData!, question_text: e.target.value})}
                                  className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-[#eb1b23] min-h-[80px]"
                                  rows={3}
                                  placeholder="Question text..."
                                />
                                
                                {/* Image Section */}
                                <div className="bg-gray-50 rounded-lg p-3">
                                  {editQuestionData?.image_preview || (editQuestionData?.image_path && !editQuestionData?.remove_image) ? (
                                    <div className="space-y-2">
                                      <div className="flex items-center justify-between mb-2">
                                        <span className="text-xs font-semibold text-gray-600">Image Attached</span>
                                        <button
                                          onClick={handleEditQuestionRemoveImage}
                                          className="text-xs text-red-600 hover:text-red-700 font-medium"
                                        >
                                          Remove
                                        </button>
                                      </div>
                                      <img
                                        src={editQuestionData.image_preview || getImageUrl(editQuestionData.image_path || '')}
                                        alt={`Edit Question ${question.question_number}`}
                                        className="w-full h-40 object-contain bg-white rounded border border-gray-200"
                                      />
                                    </div>
                                  ) : (
                                    <label className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-[#eb1b23] transition bg-white">
                                      <Image className="w-5 h-5 text-gray-400 mb-1" />
                                      <span className="text-xs text-gray-600 text-center">
                                        Add image (optional)
                                      </span>
                                      <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleEditQuestionImageSelect}
                                        className="hidden"
                                      />
                                    </label>
                                  )}
                                </div>
                                
                                <div className="space-y-2">
                                  {editQuestionData?.options.map((option: string, optIndex: number) => (
                                    <div key={optIndex} className="flex items-center gap-2">
                                      <span className="font-semibold text-gray-700 w-6">{optIndex + 1})</span>
                                      <input
                                        type="text"
                                        value={option}
                                        onChange={e => {
                                          if (!editQuestionData) return;
                                          const newOptions = [...editQuestionData.options];
                                          newOptions[optIndex] = e.target.value;
                                          setEditQuestionData({...editQuestionData, options: newOptions});
                                        }}
                                        className="flex-1 px-3 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-[#eb1b23]"
                                      />
                                    </div>
                                  ))}
                                </div>
                                
                                <div className="flex items-center justify-end gap-2 mt-4 pt-4 border-t border-gray-100">
                                  <button
                                    onClick={() => { setEditingQuestionId(null); setEditQuestionData(null); }}
                                    className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 border border-gray-300 rounded-lg transition bg-white hover:bg-gray-50"
                                  >
                                    Cancel
                                  </button>
                                  <button
                                    onClick={handleUpdateQuestion}
                                    disabled={isUpdatingQuestion}
                                    className="px-4 py-2 text-sm font-medium text-white bg-[#eb1b23] rounded-lg hover:bg-red-700 transition disabled:opacity-50 flex items-center gap-2"
                                  >
                                    {isUpdatingQuestion ? (
                                      <>
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                        <span>Saving...</span>
                                      </>
                                    ) : (
                                      <span>Save Changes</span>
                                    )}
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <>
                                <div className="flex items-start justify-between mb-3">
                                  <div className="flex items-center gap-3">
                                    <span className="font-bold text-gray-900">Q{question.question_number}</span>
                                    <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded">
                                      {question.marks} mark{question.marks > 1 ? 's' : ''}
                                    </span>
                                  </div>
                                  
                                  <button
                                    onClick={() => handleStartEditQuestion(question)}
                                    className="text-gray-400 hover:text-[#eb1b23] p-1.5 rounded-lg hover:bg-red-50 transition"
                                    title="Edit Question"
                                  >
                                    <Edit className="w-4 h-4" />
                                  </button>
                                </div>
                                
                                <p className="text-sm font-medium text-gray-800 mb-3">{question.question_text}</p>

                                {/* Display image if present */}
                                {question.image_path && (
                                  <div className="mb-4 rounded-lg overflow-hidden bg-gray-50 border border-gray-200">
                                    <img
                                      src={getImageUrl(question.image_path)}
                                      alt={`Question ${question.question_number}`}
                                      className="w-full h-48 object-contain"
                                    />
                                  </div>
                                )}
                                
                                <div className="space-y-2">
                                  {question.options.map((option, optIndex) => {
                                    const optionLabel = String(optIndex + 1);
                                    const isCorrect = (question.correct_answer || '').split(',').map(s => s.trim()).includes(optionLabel);
                                    return (
                                      <div
                                        key={optIndex}
                                        className={`p-2 rounded text-sm border ${
                                          isCorrect
                                            ? 'border-green-500 bg-green-50'
                                            : 'border-gray-200 bg-gray-50'
                                        }`}
                                      >
                                        <span className="font-semibold text-gray-700">{optIndex + 1})</span>
                                        <span className="text-gray-700 ml-2">{option}</span>
                                        {isCorrect && <span className="ml-2 text-xs text-green-700">✓ Correct</span>}
                                      </div>
                                    );
                                  })}
                                </div>
                              </>
                            )}
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
                              const optLabel = String(optIndex + 1);
                              const currentAnsString = editedAnswers[question.question_number] !== undefined 
                                ? editedAnswers[question.question_number] as string
                                : (question.correct_answer || '');
                              const isSelected = currentAnsString.split(',').map(s => s.trim()).includes(optLabel);
                              
                              return (
                                <button
                                  key={optIndex}
                                  onClick={() => updateAnswerEdit(question.question_number, optLabel)}
                                  title={`Option ${optIndex + 1}`}
                                  className={`w-10 h-10 rounded font-bold text-sm transition ${
                                    isSelected
                                      ? 'bg-[#eb1b23] text-white'
                                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                  }`}
                                >
                                  {optIndex + 1}
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
  );
}
