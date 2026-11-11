import { BaseRepository } from './BaseRepository';
import { supabase } from '../lib/supabase';

export interface TestResult {
    id: string;
    teacher_id: string;
    test_name: string;
    test_date: string;
    student_name: string;
    school: string | null;
    marks: number;
    rank: number | null;
    student_image_url: string | null;
    year_label: string; // e.g. "2026 A/L Physics"
    created_at: string;
}

export interface TestResultCSVRow {
    student_name: string;
    school?: string;
    marks: number;
    student_image_url?: string;
}

export interface TopStudent {
    rank: number;
    name: string;
    school: string;
    marks: number;
    image: string;
    year: string;
}

/**
 * Test Result Repository
 * 
 * Manages student test results uploaded via CSV.
 * Computes rankings and exposes top-10 students per label for the landing page.
 */
export class TestResultRepository extends BaseRepository<TestResult> {
    constructor() {
        super('test_results');
    }

    /**
     * Upload test results from CSV rows for a specific test
     * Replaces all existing results for the same (teacher_id, year_label, test_name, test_date) combination
     */
    async uploadFromCSV(
        teacherId: string,
        testName: string,
        testDate: string,
        yearLabel: string,
        rows: TestResultCSVRow[]
    ): Promise<TestResult[]> {
        // Delete existing results for this test
        await supabase
            .from('test_results')
            .delete()
            .eq('teacher_id', teacherId)
            .eq('year_label', yearLabel)
            .eq('test_name', testName)
            .eq('test_date', testDate);

        // Sort by marks DESC and compute rank
        const sorted = [...rows].sort((a, b) => b.marks - a.marks);
        const records = sorted.map((row, idx) => ({
            teacher_id: teacherId,
            test_name: testName,
            test_date: testDate,
            year_label: yearLabel,
            student_name: row.student_name,
            school: row.school || null,
            marks: Number(row.marks),
            rank: idx + 1,
            student_image_url: row.student_image_url || null,
        }));

        const { data, error } = await supabase
            .from('test_results')
            .insert(records)
            .select();

        if (error) throw error;
        return data || [];
    }

    /**
     * Get distinct year labels for available test results
     */
    async getYearLabels(): Promise<string[]> {
        const { data, error } = await supabase
            .from('test_results')
            .select('year_label')
            .order('year_label', { ascending: false });

        if (error) throw error;

        const unique = [...new Set((data || []).map((r) => r.year_label))];
        return unique;
    }

    /**
     * Get top 10 students for a specific year_label
     * Aggregates across test results by taking best marks per student
     */
    async getTop10ByYearLabel(yearLabel: string): Promise<TopStudent[]> {
        const { data, error } = await supabase
            .from('test_results')
            .select('*')
            .eq('year_label', yearLabel)
            .order('marks', { ascending: false });

        if (error) throw error;

        const results = data || [];

        // Deduplicate: keep the highest marks per student
        const seen = new Map<string, TestResult>();
        for (const r of results) {
            const key = r.student_name.toLowerCase().trim();
            if (!seen.has(key) || seen.get(key)!.marks < r.marks) {
                seen.set(key, r);
            }
        }

        // Sort by marks and take top 10
        const top10 = [...seen.values()]
            .sort((a, b) => b.marks - a.marks)
            .slice(0, 10)
            .map((r, idx) => ({
                rank: idx + 1,
                name: r.student_name,
                school: r.school || '',
                marks: r.marks,
                image: r.student_image_url || '',
                year: r.year_label,
            }));

        return top10;
    }

    /**
     * Get all distinct (year_label, test_name) pairs for a teacher
     */
    async getTestsByTeacher(teacherId: string): Promise<{ year_label: string; test_name: string; test_date: string; count: number }[]> {
        const { data, error } = await supabase
            .from('test_results')
            .select('year_label, test_name, test_date')
            .eq('teacher_id', teacherId)
            .order('test_date', { ascending: false });

        if (error) throw error;

        // Group and count
        const grouped = new Map<string, { year_label: string; test_name: string; test_date: string; count: number }>();
        for (const r of data || []) {
            const key = `${r.year_label}|${r.test_name}|${r.test_date}`;
            if (grouped.has(key)) {
                grouped.get(key)!.count++;
            } else {
                grouped.set(key, { ...r, count: 1 });
            }
        }

        return [...grouped.values()];
    }

    /**
     * Delete all results for a specific test
     */
    async deleteTest(teacherId: string, testName: string, testDate: string, yearLabel: string): Promise<void> {
        const { error } = await supabase
            .from('test_results')
            .delete()
            .eq('teacher_id', teacherId)
            .eq('test_name', testName)
            .eq('test_date', testDate)
            .eq('year_label', yearLabel);

        if (error) throw error;
    }

    /**
     * Parse a CSV string into TestResultCSVRow[]
     * Expected CSV format: student_name,school,marks[,student_image_url]
     * First row is treated as header and skipped.
     */
    static parseCSV(csvText: string): TestResultCSVRow[] {
        const lines = csvText.split('\n').filter((l) => l.trim());
        if (lines.length < 2) throw new Error('CSV must have a header row and at least one data row');

        const header = lines[0].split(',').map((h) => h.trim().toLowerCase());
        const nameIdx = header.indexOf('student_name');
        const schoolIdx = header.indexOf('school');
        const marksIdx = header.indexOf('marks');
        const imageIdx = header.indexOf('student_image_url');

        if (nameIdx === -1) throw new Error('CSV must have a "student_name" column');
        if (marksIdx === -1) throw new Error('CSV must have a "marks" column');

        const rows: TestResultCSVRow[] = [];
        for (let i = 1; i < lines.length; i++) {
            const cols = lines[i].split(',').map((c) => c.trim());
            const marks = parseFloat(cols[marksIdx]);
            if (!cols[nameIdx] || isNaN(marks)) continue;

            rows.push({
                student_name: cols[nameIdx],
                school: schoolIdx !== -1 ? cols[schoolIdx] : undefined,
                marks,
                student_image_url: imageIdx !== -1 ? cols[imageIdx] : undefined,
            });
        }

        return rows;
    }
}

export const testResultRepository = new TestResultRepository();
