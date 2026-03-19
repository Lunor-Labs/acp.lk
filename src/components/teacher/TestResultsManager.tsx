import React, { useState, useEffect, useRef } from 'react';
import { Upload, Trash2, FileText, Trophy, AlertCircle, CheckCircle } from 'lucide-react';
import { testResultRepository } from '../../repositories/TestResultRepository';
import { TestResultRepository } from '../../repositories/TestResultRepository';
import type { TopStudent } from '../../repositories/TestResultRepository';

interface TestResultsManagerProps {
    teacherId: string;
}

interface UploadedTest {
    year_label: string;
    test_name: string;
    test_date: string;
    count: number;
}

export default function TestResultsManager({ teacherId }: TestResultsManagerProps) {
    const [tests, setTests] = useState<UploadedTest[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [preview, setPreview] = useState<TopStudent[]>([]);
    const [previewLabel, setPreviewLabel] = useState<string>('');
    const [yearLabels, setYearLabels] = useState<string[]>([]);

    // Form state
    const [testName, setTestName] = useState('');
    const [testDate, setTestDate] = useState(new Date().toISOString().split('T')[0]);
    const [yearLabel, setYearLabel] = useState('');
    const [customLabel, setCustomLabel] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        loadData();
    }, [teacherId]);

    async function loadData() {
        try {
            setLoading(true);
            const [testsData, labels] = await Promise.all([
                testResultRepository.getTestsByTeacher(teacherId),
                testResultRepository.getYearLabels(),
            ]);
            setTests(testsData);
            setYearLabels(labels);
        } catch (err: any) {
            showError(err.message || 'Failed to load data');
        } finally {
            setLoading(false);
        }
    }

    function showSuccess(msg: string) {
        setSuccess(msg);
        setTimeout(() => setSuccess(null), 4000);
    }

    function showError(msg: string) {
        setError(msg);
        setTimeout(() => setError(null), 5000);
    }

    async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.name.endsWith('.csv')) {
            showError('Please upload a CSV file');
            return;
        }

        const label = yearLabel === '__custom__' ? customLabel.trim() : yearLabel.trim();

        if (!testName.trim()) {
            showError('Please enter a test name');
            return;
        }
        if (!label) {
            showError('Please select or enter a year label');
            return;
        }
        if (!testDate) {
            showError('Please select a test date');
            return;
        }

        setUploading(true);
        try {
            const text = await file.text();
            const rows = TestResultRepository.parseCSV(text);
            if (rows.length === 0) {
                showError('No valid student rows found in CSV');
                return;
            }

            await testResultRepository.uploadFromCSV(teacherId, testName.trim(), testDate, label, rows);
            await loadData();

            // Show top 10 preview
            const top10 = await testResultRepository.getTop10ByYearLabel(label);
            setPreview(top10);
            setPreviewLabel(label);

            showSuccess(`Uploaded ${rows.length} student results for "${testName}"`);
            setTestName('');
            if (fileInputRef.current) fileInputRef.current.value = '';
        } catch (err: any) {
            showError(err.message || 'Upload failed');
        } finally {
            setUploading(false);
        }
    }

    async function handleDelete(test: UploadedTest) {
        if (!confirm(`Delete all results for "${test.test_name}" (${test.year_label})? This cannot be undone.`)) return;
        try {
            await testResultRepository.deleteTest(teacherId, test.test_name, test.test_date, test.year_label);
            await loadData();
            showSuccess('Test results deleted.');
        } catch (err: any) {
            showError(err.message || 'Failed to delete');
        }
    }

    async function handlePreview(label: string) {
        try {
            const top10 = await testResultRepository.getTop10ByYearLabel(label);
            setPreview(top10);
            setPreviewLabel(label);
        } catch (err: any) {
            showError(err.message || 'Failed to load preview');
        }
    }

    return (
        <div className="p-4 sm:p-6 lg:p-8">
            <div className="mb-8">
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Test Results</h2>
                <p className="text-gray-500">Upload student test results via CSV. Top 10 students per test will appear on the landing page.</p>
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

            {/* CSV Format Info */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
                <h4 className="text-sm font-semibold text-blue-800 mb-1">CSV Format</h4>
                <p className="text-xs text-blue-700 mb-2">Your CSV should have these columns (header row required):</p>
                <code className="text-xs bg-blue-100 text-blue-900 px-3 py-1.5 rounded-lg block font-mono overflow-x-auto">
                    student_name,school,marks,student_image_url
                </code>
                <p className="text-xs text-blue-600 mt-2">
                    Only <strong>student_name</strong> and <strong>marks</strong> are required. Rankings are computed automatically by marks.
                </p>
            </div>

            {/* Upload Form */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-8">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <Upload className="w-5 h-5 text-[#eb1b23]" />
                    Upload New Test Results
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Test Name *</label>
                        <input
                            type="text"
                            value={testName}
                            onChange={(e) => setTestName(e.target.value)}
                            placeholder="e.g. Paper Class Test 01"
                            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#eb1b23]/20 focus:border-[#eb1b23]"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Test Date *</label>
                        <input
                            type="date"
                            value={testDate}
                            onChange={(e) => setTestDate(e.target.value)}
                            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#eb1b23]/20 focus:border-[#eb1b23]"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Year / Category Label *</label>
                        <select
                            value={yearLabel}
                            onChange={(e) => setYearLabel(e.target.value)}
                            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#eb1b23]/20 focus:border-[#eb1b23] bg-white"
                        >
                            <option value="">Select or enter label...</option>
                            {yearLabels.map((label) => (
                                <option key={label} value={label}>{label}</option>
                            ))}
                            <option value="__custom__">+ New label...</option>
                        </select>
                    </div>
                </div>

                {yearLabel === '__custom__' && (
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Custom Label *</label>
                        <input
                            type="text"
                            value={customLabel}
                            onChange={(e) => setCustomLabel(e.target.value)}
                            placeholder="e.g. 2026 A/L Physics"
                            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#eb1b23]/20 focus:border-[#eb1b23]"
                        />
                    </div>
                )}

                <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="flex items-center gap-2 px-6 py-2.5 bg-[#eb1b23] text-white rounded-xl font-medium text-sm hover:bg-red-700 transition-colors disabled:opacity-60"
                >
                    <Upload className="w-4 h-4" />
                    {uploading ? 'Uploading...' : 'Choose CSV File & Upload'}
                </button>
                <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv"
                    className="hidden"
                    onChange={handleFileChange}
                />
            </div>

            {/* Uploaded Tests */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-8">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-[#eb1b23]" />
                    Uploaded Tests ({tests.length})
                </h3>

                {loading ? (
                    <div className="flex justify-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#eb1b23]" />
                    </div>
                ) : tests.length === 0 ? (
                    <div className="text-center py-10 text-gray-400">
                        <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
                        <p>No test results uploaded yet.</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {tests.map((test, idx) => (
                            <div key={idx} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
                                <div>
                                    <p className="font-semibold text-gray-900 text-sm">{test.test_name}</p>
                                    <div className="flex gap-3 mt-0.5">
                                        <span className="text-xs text-[#eb1b23] font-medium">{test.year_label}</span>
                                        <span className="text-xs text-gray-400">{test.test_date}</span>
                                        <span className="text-xs text-gray-500">{test.count} students</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => handlePreview(test.year_label)}
                                        className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                                    >
                                        <Trophy className="w-3 h-3" />
                                        Preview Top 10
                                    </button>
                                    <button
                                        onClick={() => handleDelete(test)}
                                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Top 10 Preview */}
            {preview.length > 0 && (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-1 flex items-center gap-2">
                        <Trophy className="w-5 h-5 text-yellow-500" />
                        Top 10 Preview — {previewLabel}
                    </h3>
                    <p className="text-xs text-gray-400 mb-4">This is how the ranking will appear on the landing page.</p>
                    <div className="space-y-2">
                        {preview.map((student) => (
                            <div key={student.rank} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50">
                                <div
                                    className={`w-8 h-8 flex-shrink-0 rounded-full flex items-center justify-center text-sm font-bold ${student.rank === 1
                                        ? 'bg-yellow-400 text-white'
                                        : student.rank === 2
                                            ? 'bg-gray-400 text-white'
                                            : student.rank === 3
                                                ? 'bg-amber-700 text-white'
                                                : 'bg-gray-200 text-gray-600'
                                        }`}
                                >
                                    {student.rank}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-semibold text-gray-900 text-sm truncate">{student.name}</p>
                                    {student.school && <p className="text-xs text-gray-500 truncate">{student.school}</p>}
                                </div>
                                <div className="text-right">
                                    <p className="text-lg font-bold text-[#eb1b23]">{student.marks}%</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
