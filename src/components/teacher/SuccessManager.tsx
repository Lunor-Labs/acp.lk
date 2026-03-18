import React, { useState, useEffect, useRef } from 'react';
import { Upload, Trash2, Edit2, Plus, AlertCircle, CheckCircle, Save, X } from 'lucide-react';
import { successRepository } from '../../repositories/SuccessRepository';
import type { SuccessStudentWithUrl } from '../../repositories/SuccessRepository';

interface SuccessManagerProps {
    teacherId: string;
}

interface SuccessFormState {
    full_name: string;
    index_no: string;
    results: string;
    faculty: string;
    university: string;
}

const EMPTY_FORM: SuccessFormState = {
    full_name: '',
    index_no: '',
    results: 'AAA',
    faculty: '',
    university: '',
};

export default function SuccessManager({ teacherId }: SuccessManagerProps) {
    const [students, setStudents] = useState<SuccessStudentWithUrl[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [form, setForm] = useState<SuccessFormState>(EMPTY_FORM);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        loadStudents();
    }, []);

    async function loadStudents() {
        try {
            setLoading(true);
            const data = await successRepository.getAllWithUrls();
            setStudents(data);
        } catch (err: any) {
            setError(err.message || 'Failed to load success students');
        } finally {
            setLoading(false);
        }
    }

    function showSuccessMsg(msg: string) {
        setSuccess(msg);
        setTimeout(() => setSuccess(null), 3000);
    }

    function showErrorMsg(msg: string) {
        setError(msg);
        setTimeout(() => setError(null), 4000);
    }

    function handleEdit(student: SuccessStudentWithUrl) {
        setEditingId(String(student.id));
        setForm({
            full_name: student.full_name || '',
            index_no: String(student.index_no || ''),
            results: student.results || 'AAA',
            faculty: student.faculty || '',
            university: student.university || '',
        });
        setSelectedFile(null);
        setShowForm(true);
    }

    function handleNew() {
        setEditingId(null);
        setForm(EMPTY_FORM);
        setSelectedFile(null);
        setShowForm(true);
    }

    function handleCancel() {
        setShowForm(false);
        setEditingId(null);
        setForm(EMPTY_FORM);
        setSelectedFile(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    }

    function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
        const files = e.target.files;
        if (files && files.length > 0) {
            const file = files[0];
            if (!file.type.startsWith('image/')) {
                showErrorMsg('Please select an image file');
                return;
            }
            if (file.size > 5 * 1024 * 1024) {
                showErrorMsg('Image size must be less than 5MB');
                return;
            }
            setSelectedFile(file);
        }
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        
        if (!form.full_name.trim() || !form.index_no.trim() || !form.faculty.trim() || !form.university.trim()) {
            showErrorMsg('All fields are required');
            return;
        }

        if (!editingId && !selectedFile) {
            showErrorMsg('Please select an image for new student');
            return;
        }

        setSaving(true);
        try {
            if (editingId) {
                // Update existing record
                await successRepository.updateSuccess(editingId, {
                    full_name: form.full_name,
                    index_no: BigInt(form.index_no),
                    results: form.results,
                    faculty: form.faculty,
                    university: form.university,
                });
                showSuccessMsg('Student record updated!');
            } else if (selectedFile) {
                // Create new record with image
                await successRepository.uploadSuccess(
                    selectedFile,
                    form.full_name,
                    form.index_no,
                    form.results,
                    form.faculty,
                    form.university
                );
                showSuccessMsg('Student record created and image uploaded!');
            }
            
            await loadStudents();
            handleCancel();
        } catch (err: any) {
            showErrorMsg(err.message || 'Operation failed');
        } finally {
            setSaving(false);
        }
    }

    async function handleDelete(student: SuccessStudentWithUrl) {
        if (!confirm('Delete this student record? This cannot be undone.')) return;
        
        try {
            await successRepository.deleteSuccess(student.id, student.image_path || '');
            setStudents((prev) => prev.filter((s) => s.id !== student.id));
            showSuccessMsg('Student record deleted.');
        } catch (err: any) {
            showErrorMsg(err.message || 'Failed to delete record');
        }
    }

    return (
        <div className="p-4 sm:p-6 lg:p-8">
            <div className="mb-8">
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Success Manager</h2>
                <p className="text-gray-500">Manage successful student stories on the landing page.</p>
            </div>

            {/* Alerts */}
            {error && (
                <div className="mb-4 flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span className="text-sm">{error}</span>
                </div>
            )}
            {success && (
                <div className="mb-4 flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl">
                    <CheckCircle className="w-4 h-4 flex-shrink-0" />
                    <span className="text-sm">{success}</span>
                </div>
            )}

            {/* Add Button */}
            {!showForm && (
                <div className="mb-8">
                    <button
                        onClick={handleNew}
                        className="flex items-center gap-2 px-6 py-3 bg-[#eb1b23] text-white rounded-xl font-medium hover:bg-red-700 transition-colors"
                    >
                        <Plus className="w-5 h-5" />
                        Add Success Story
                    </button>
                </div>
            )}

            {/* Form */}
            {showForm && (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-8">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">
                        {editingId ? 'Edit Student Record' : 'Add New Student Record'}
                    </h3>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Full Name */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Full Name *
                                </label>
                                <input
                                    type="text"
                                    value={form.full_name}
                                    onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#eb1b23]/20 focus:border-[#eb1b23]"
                                    placeholder="Student name"
                                />
                            </div>

                            {/* Index Number */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Index Number *
                                </label>
                                <input
                                    type="text"
                                    value={form.index_no}
                                    onChange={(e) => setForm({ ...form, index_no: e.target.value })}
                                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#eb1b23]/20 focus:border-[#eb1b23]"
                                    placeholder="Index number"
                                />
                            </div>

                            {/* Faculty */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Faculty *
                                </label>
                                <input
                                    type="text"
                                    value={form.faculty}
                                    onChange={(e) => setForm({ ...form, faculty: e.target.value })}
                                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#eb1b23]/20 focus:border-[#eb1b23]"
                                    placeholder="Faculty name"
                                />
                            </div>

                            {/* University */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    University *
                                </label>
                                <input
                                    type="text"
                                    value={form.university}
                                    onChange={(e) => setForm({ ...form, university: e.target.value })}
                                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#eb1b23]/20 focus:border-[#eb1b23]"
                                    placeholder="University name"
                                />
                            </div>

                            {/* Results/Grade */}
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Results/Grade
                                </label>
                                <input
                                    type="text"
                                    value={form.results}
                                    onChange={(e) => setForm({ ...form, results: e.target.value })}
                                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#eb1b23]/20 focus:border-[#eb1b23]"
                                    placeholder="e.g., AAA, 4.0 GPA"
                                />
                            </div>
                        </div>

                        {/* Image Upload */}
                        {!editingId && (
                            <div className="mt-6 pt-6 border-t border-gray-200">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Student Photo *
                                </label>
                                <div className="flex items-center gap-3">
                                    <button
                                        type="button"
                                        onClick={() => fileInputRef.current?.click()}
                                        className="flex items-center gap-2 px-6 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                                    >
                                        <Upload className="w-4 h-4" />
                                        Choose Image
                                    </button>
                                    {selectedFile && (
                                        <span className="text-sm text-green-600 font-medium">
                                            ✓ {selectedFile.name}
                                        </span>
                                    )}
                                </div>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    onChange={handleFileSelect}
                                    className="hidden"
                                />
                            </div>
                        )}

                        {/* Form Actions */}
                        <div className="flex gap-3 pt-6 border-t border-gray-200">
                            <button
                                type="submit"
                                disabled={saving}
                                className="flex items-center gap-2 px-6 py-2.5 bg-[#eb1b23] text-white rounded-xl font-medium text-sm hover:bg-red-700 transition-colors disabled:opacity-60"
                            >
                                <Save className="w-4 h-4" />
                                {saving ? 'Saving...' : 'Save'}
                            </button>
                            <button
                                type="button"
                                onClick={handleCancel}
                                className="flex items-center gap-2 px-6 py-2.5 border border-gray-200 rounded-xl font-medium text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                            >
                                <X className="w-4 h-4" />
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Students List */}
            {loading ? (
                <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#eb1b23]" />
                </div>
            ) : students.length === 0 ? (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
                    <p className="text-gray-500 mb-4">No success stories yet</p>
                    <button
                        onClick={handleNew}
                        className="text-[#eb1b23] hover:text-red-700 font-medium"
                    >
                        Add the first one
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {students.map((student) => (
                        <div
                            key={student.id}
                            className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg transition-shadow"
                        >
                            {student.image_path && student.resolvedUrl && (
                                <img
                                    src={student.resolvedUrl}
                                    alt={student.full_name}
                                    className="w-full h-48 object-cover"
                                />
                            )}

                            <div className="p-4">
                                <h3 className="font-semibold text-gray-900 mb-1">{student.full_name}</h3>
                                <p className="text-xs text-gray-500 mb-3">Index: {student.index_no}</p>

                                <div className="space-y-2 mb-4 text-sm">
                                    <p className="text-gray-700">
                                        <span className="font-medium text-gray-600">Faculty:</span> {student.faculty}
                                    </p>
                                    <p className="text-gray-700">
                                        <span className="font-medium text-gray-600">University:</span> {student.university}
                                    </p>
                                    <p className="text-gray-700">
                                        <span className="font-medium text-gray-600">Results:</span> {student.results}
                                    </p>
                                </div>

                                <div className="flex gap-2 pt-3 border-t border-gray-100">
                                    <button
                                        onClick={() => handleEdit(student)}
                                        className="flex-1 flex items-center justify-center gap-1 px-3 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                    >
                                        <Edit2 className="w-4 h-4" />
                                        Edit
                                    </button>
                                    <button
                                        onClick={() => handleDelete(student)}
                                        className="flex-1 flex items-center justify-center gap-1 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                        Delete
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
