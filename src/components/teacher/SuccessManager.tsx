import React, { useState, useEffect, useRef } from 'react';
import {
    Upload, Trash2, Edit2, Plus, AlertCircle, CheckCircle,
    Save, X, GraduationCap, Award, BookOpen, User, ImageIcon, Trophy
} from 'lucide-react';
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
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMsg, setSuccessMsg] = useState<string | null>(null);
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [form, setForm] = useState<SuccessFormState>(EMPTY_FORM);
    const [deleteTarget, setDeleteTarget] = useState<SuccessStudentWithUrl | null>(null);
    const [deleting, setDeleting] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => { loadStudents(); }, []);

    async function loadStudents() {
        try {
            setLoading(true);
            const data = await successRepository.getAllWithUrls();
            setStudents(data);
        } catch (err: any) {
            showErrorMsg(err.message || 'Failed to load success stories');
        } finally {
            setLoading(false);
        }
    }

    function showSuccessMsg(msg: string) {
        setSuccessMsg(msg);
        setTimeout(() => setSuccessMsg(null), 3000);
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
        setPreviewUrl(student.resolvedUrl || null);
        setShowForm(true);
    }

    function handleNew() {
        setEditingId(null);
        setForm(EMPTY_FORM);
        setSelectedFile(null);
        setPreviewUrl(null);
        setShowForm(true);
    }

    function handleCancel() {
        setShowForm(false);
        setEditingId(null);
        setForm(EMPTY_FORM);
        setSelectedFile(null);
        setPreviewUrl(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    }

    function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;
        if (!file.type.startsWith('image/')) { showErrorMsg('Please select an image file'); return; }
        if (file.size > 5 * 1024 * 1024) { showErrorMsg('Image must be under 5MB'); return; }
        setSelectedFile(file);
        setPreviewUrl(URL.createObjectURL(file));
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        const { full_name, index_no, faculty, university } = form;
        if (!full_name.trim() || !index_no.trim() || !faculty.trim() || !university.trim()) {
            showErrorMsg('All fields are required');
            return;
        }
        if (!editingId && !selectedFile) {
            showErrorMsg('Please select a photo for the new student');
            return;
        }

        setSaving(true);
        try {
            if (editingId) {
                await successRepository.updateSuccess(editingId, {
                    full_name: form.full_name,
                    index_no: BigInt(form.index_no),
                    results: form.results,
                    faculty: form.faculty,
                    university: form.university,
                });
                // If user chose a new image while editing, upload it too
                if (selectedFile) {
                    await successRepository.uploadSuccess(
                        selectedFile, form.full_name, form.index_no,
                        form.results, form.faculty, form.university
                    );
                }
                showSuccessMsg('Student record updated successfully!');
            } else if (selectedFile) {
                await successRepository.uploadSuccess(
                    selectedFile, form.full_name, form.index_no,
                    form.results, form.faculty, form.university
                );
                showSuccessMsg('Success story added!');
            }
            await loadStudents();
            handleCancel();
        } catch (err: any) {
            showErrorMsg(err.message || 'Operation failed');
        } finally {
            setSaving(false);
        }
    }

    async function confirmDelete() {
        if (!deleteTarget) return;
        setDeleting(true);
        try {
            await successRepository.deleteSuccess(deleteTarget.id, deleteTarget.image_path || '');
            setStudents(prev => prev.filter(s => s.id !== deleteTarget.id));
            showSuccessMsg('Record deleted.');
        } catch (err: any) {
            showErrorMsg(err.message || 'Failed to delete');
        } finally {
            setDeleting(false);
            setDeleteTarget(null);
        }
    }

    return (
        <div className="p-4 sm:p-6 lg:p-8">

            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">Success Stories</h2>
                    <p className="text-sm text-gray-500 mt-1">Showcase your students' achievements on the landing page.</p>
                </div>
                {!showForm && (
                    <button
                        onClick={handleNew}
                        className="flex items-center gap-2 px-5 py-2.5 bg-[#eb1b23] text-white rounded-xl font-medium text-sm hover:bg-red-700 transition-all shadow-sm hover:shadow-md"
                    >
                        <Plus className="w-4 h-4" />
                        Add Story
                    </button>
                )}
            </div>

            {/* Toast Alerts */}
            {error && (
                <div className="mb-4 flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm animate-pulse">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    {error}
                </div>
            )}
            {successMsg && (
                <div className="mb-4 flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-xl text-sm">
                    <CheckCircle className="w-4 h-4 flex-shrink-0" />
                    {successMsg}
                </div>
            )}

            {/* Split layout when form is open */}
            <div className={`${showForm ? 'grid grid-cols-1 xl:grid-cols-5 gap-6' : ''}`}>

                {/* ── Form Panel ─────────────────────────────────── */}
                {showForm && (
                    <div className="xl:col-span-2">
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden sticky top-6">
                            {/* Form header */}
                            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-slate-50 to-white">
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center">
                                        {editingId ? <Edit2 className="w-4 h-4 text-[#eb1b23]" /> : <Plus className="w-4 h-4 text-[#eb1b23]" />}
                                    </div>
                                    <h3 className="font-semibold text-gray-800 text-sm">
                                        {editingId ? 'Edit Record' : 'New Success Story'}
                                    </h3>
                                </div>
                                <button onClick={handleCancel} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
                                    <X className="w-4 h-4" />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="p-6 space-y-4">

                                {/* Photo picker / preview */}
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                                        Student Photo {!editingId && <span className="text-red-400">*</span>}
                                    </label>
                                    <div
                                        onClick={() => fileInputRef.current?.click()}
                                        className="relative cursor-pointer group rounded-xl border-2 border-dashed border-gray-200 hover:border-[#eb1b23] transition-colors overflow-hidden bg-gray-50 hover:bg-red-50/30"
                                        style={{ height: '180px' }}
                                    >
                                        {previewUrl ? (
                                            <>
                                                <img src={previewUrl} alt="preview" className="w-full h-full object-cover" />
                                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                    <div className="text-white text-center">
                                                        <Upload className="w-6 h-6 mx-auto mb-1" />
                                                        <span className="text-xs font-medium">Change Photo</span>
                                                    </div>
                                                </div>
                                            </>
                                        ) : (
                                            <div className="h-full flex flex-col items-center justify-center text-gray-400 group-hover:text-[#eb1b23] transition-colors">
                                                <ImageIcon className="w-10 h-10 mb-2" />
                                                <span className="text-sm font-medium">Click to upload photo</span>
                                                <span className="text-xs mt-1">JPG, PNG · Max 5MB</span>
                                            </div>
                                        )}
                                    </div>
                                    <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />
                                    {selectedFile && (
                                        <p className="text-xs text-emerald-600 mt-1.5 flex items-center gap-1">
                                            <CheckCircle className="w-3 h-3" /> {selectedFile.name}
                                        </p>
                                    )}
                                </div>

                                {/* Full name */}
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Full Name *</label>
                                    <div className="relative">
                                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                        <input
                                            type="text"
                                            value={form.full_name}
                                            onChange={e => setForm({ ...form, full_name: e.target.value })}
                                            className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#eb1b23]/20 focus:border-[#eb1b23] transition"
                                            placeholder="e.g. Kavindu Perera"
                                        />
                                    </div>
                                </div>

                                {/* Index No */}
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Index Number *</label>
                                    <div className="relative">
                                        <BookOpen className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                        <input
                                            type="text"
                                            value={form.index_no}
                                            onChange={e => setForm({ ...form, index_no: e.target.value })}
                                            className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#eb1b23]/20 focus:border-[#eb1b23] transition"
                                            placeholder="e.g. 2023456"
                                        />
                                    </div>
                                </div>

                                {/* Results */}
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">A/L Results</label>
                                    <div className="relative">
                                        <Award className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                        <input
                                            type="text"
                                            value={form.results}
                                            onChange={e => setForm({ ...form, results: e.target.value })}
                                            className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#eb1b23]/20 focus:border-[#eb1b23] transition"
                                            placeholder="e.g. AAA, 3A 1B"
                                        />
                                    </div>
                                </div>

                                {/* Faculty */}
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Faculty *</label>
                                    <div className="relative">
                                        <GraduationCap className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                        <input
                                            type="text"
                                            value={form.faculty}
                                            onChange={e => setForm({ ...form, faculty: e.target.value })}
                                            className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#eb1b23]/20 focus:border-[#eb1b23] transition"
                                            placeholder="e.g. Faculty of Medicine"
                                        />
                                    </div>
                                </div>

                                {/* University */}
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">University *</label>
                                    <div className="relative">
                                        <GraduationCap className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                        <input
                                            type="text"
                                            value={form.university}
                                            onChange={e => setForm({ ...form, university: e.target.value })}
                                            className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#eb1b23]/20 focus:border-[#eb1b23] transition"
                                            placeholder="e.g. University of Colombo"
                                        />
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex gap-3 pt-2">
                                    <button
                                        type="submit"
                                        disabled={saving}
                                        className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-[#eb1b23] text-white rounded-xl font-medium text-sm hover:bg-red-700 transition-all disabled:opacity-60 shadow-sm"
                                    >
                                        <Save className="w-4 h-4" />
                                        {saving ? 'Saving…' : editingId ? 'Update Record' : 'Add Story'}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleCancel}
                                        className="px-4 py-2.5 border border-gray-200 rounded-xl font-medium text-sm text-gray-600 hover:bg-gray-50 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* ── Cards Panel ────────────────────────────────── */}
                <div className={showForm ? 'xl:col-span-3' : ''}>
                    {loading ? (
                        <div className="flex items-center justify-center h-64">
                            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#eb1b23]" />
                        </div>
                    ) : students.length === 0 ? (
                        <div className="flex flex-col items-center justify-center bg-white rounded-2xl border border-gray-100 shadow-sm py-20 px-8 text-center">
                            <div className="w-20 h-20 rounded-full bg-amber-50 flex items-center justify-center mb-4">
                                <Trophy className="w-10 h-10 text-amber-400" />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-700 mb-1">No success stories yet</h3>
                            <p className="text-sm text-gray-400 mb-6 max-w-xs">
                                Add your top students' achievements — they'll appear on the landing page to inspire others.
                            </p>
                            <button
                                onClick={handleNew}
                                className="flex items-center gap-2 px-5 py-2.5 bg-[#eb1b23] text-white rounded-xl font-medium text-sm hover:bg-red-700 transition-all"
                            >
                                <Plus className="w-4 h-4" />
                                Add First Story
                            </button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {students.map((student) => (
                                <div
                                    key={String(student.id)}
                                    className="group bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg transition-all duration-200 overflow-hidden"
                                >
                                    {/* Photo */}
                                    <div className="relative h-48 bg-gradient-to-br from-slate-100 to-slate-200 overflow-hidden">
                                        {student.resolvedUrl ? (
                                            <img
                                                src={student.resolvedUrl}
                                                alt={student.full_name || ''}
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center">
                                                <User className="w-16 h-16 text-slate-300" />
                                            </div>
                                        )}

                                        {/* Result badge */}
                                        <div className="absolute top-3 right-3">
                                            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#eb1b23] text-white text-xs font-bold rounded-full shadow">
                                                <Award className="w-3 h-3" />
                                                {student.results || 'AAA'}
                                            </span>
                                        </div>

                                        {/* Action buttons overlay */}
                                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3 gap-2">
                                            <button
                                                onClick={() => handleEdit(student)}
                                                className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-white text-gray-800 rounded-lg text-xs font-semibold hover:bg-blue-50 hover:text-blue-700 transition-colors"
                                            >
                                                <Edit2 className="w-3.5 h-3.5" />
                                                Edit
                                            </button>
                                            <button
                                                onClick={() => setDeleteTarget(student)}
                                                className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-red-500 text-white rounded-lg text-xs font-semibold hover:bg-red-600 transition-colors"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                                Delete
                                            </button>
                                        </div>
                                    </div>

                                    {/* Info */}
                                    <div className="p-4">
                                        <h3 className="font-bold text-gray-900 text-base truncate">{student.full_name}</h3>
                                        <p className="text-xs text-gray-400 mb-3">Index: {String(student.index_no)}</p>

                                        <div className="space-y-1.5">
                                            <div className="flex items-start gap-2">
                                                <GraduationCap className="w-3.5 h-3.5 text-[#eb1b23] mt-0.5 flex-shrink-0" />
                                                <p className="text-xs text-gray-600 line-clamp-1">{student.faculty}</p>
                                            </div>
                                            <div className="flex items-start gap-2">
                                                <BookOpen className="w-3.5 h-3.5 text-slate-400 mt-0.5 flex-shrink-0" />
                                                <p className="text-xs text-gray-500 line-clamp-1">{student.university}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* ── Delete Confirmation Modal ──────────────────────── */}
            {deleteTarget && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 animate-fade-in">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center flex-shrink-0">
                                <Trash2 className="w-6 h-6 text-red-500" />
                            </div>
                            <div>
                                <h3 className="font-bold text-gray-900">Delete Record</h3>
                                <p className="text-sm text-gray-500">This cannot be undone.</p>
                            </div>
                        </div>

                        {deleteTarget.resolvedUrl && (
                            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl mb-4">
                                <img src={deleteTarget.resolvedUrl} alt="" className="w-12 h-12 rounded-lg object-cover" />
                                <div>
                                    <p className="font-semibold text-sm text-gray-800">{deleteTarget.full_name}</p>
                                    <p className="text-xs text-gray-400">{deleteTarget.university}</p>
                                </div>
                            </div>
                        )}

                        <p className="text-sm text-gray-600 mb-5">
                            Are you sure you want to remove <span className="font-semibold text-gray-800">{deleteTarget.full_name}</span>'s success story?
                            The photo will also be permanently deleted.
                        </p>

                        <div className="flex gap-3">
                            <button
                                onClick={confirmDelete}
                                disabled={deleting}
                                className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-xl font-medium text-sm transition-colors disabled:opacity-60"
                            >
                                <Trash2 className="w-4 h-4" />
                                {deleting ? 'Deleting…' : 'Yes, Delete'}
                            </button>
                            <button
                                onClick={() => setDeleteTarget(null)}
                                className="flex-1 py-2.5 border border-gray-200 rounded-xl font-medium text-sm text-gray-600 hover:bg-gray-50 transition-colors"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
