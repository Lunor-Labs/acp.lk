import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { TeacherRepository } from '../../repositories/TeacherRepository';
import { Trophy, Users, Calendar, ChevronDown, BarChart2, Medal } from 'lucide-react';

interface Class {
  id: string;
  title: string;
  subject: string;
}

interface StudentMonthlyScore {
  studentId: string;
  studentName: string;
  monthlyScores: Record<string, number>; // key: "YYYY-MM", value: sum of scores
  totalScore: number;
}

interface MonthlyRanking {
  monthKey: string;
  monthLabel: string;
  rankings: { studentId: string; studentName: string; score: number; rank: number }[];
}

const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MARKS_PER_MONTH = 100; // 20 tests × 5 marks

const teacherRepo = new TeacherRepository();

export default function StudentRankings() {
  const { profile } = useAuth();
  const [classes, setClasses] = useState<Class[]>([]);
  const [selectedClassId, setSelectedClassId] = useState('');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [loading, setLoading] = useState(false);
  const [classesLoading, setClassesLoading] = useState(true);
  const [studentData, setStudentData] = useState<StudentMonthlyScore[]>([]);
  const [monthlyRankings, setMonthlyRankings] = useState<MonthlyRanking[]>([]);
  const [activeMonths, setActiveMonths] = useState<string[]>([]);

  // Available years (current year ± 2)
  const currentYear = new Date().getFullYear();
  const years = [currentYear - 2, currentYear - 1, currentYear, currentYear + 1];

  useEffect(() => {
    if (profile?.id) loadClasses();
  }, [profile?.id]);

  useEffect(() => {
    if (selectedClassId) loadRankings();
  }, [selectedClassId, selectedYear]);

  async function loadClasses() {
    try {
      setClassesLoading(true);
      const teacher = await teacherRepo.findByProfileId(profile?.id!);
      if (!teacher) return;
      const { data } = await supabase
        .from('classes')
        .select('id, title, subject')
        .eq('teacher_id', teacher.id)
        .eq('is_active', true)
        .order('title');
      setClasses(data || []);
      if (data && data.length > 0) setSelectedClassId(data[0].id);
    } catch (err) {
      console.error('Error loading classes:', err);
    } finally {
      setClassesLoading(false);
    }
  }

  async function loadRankings() {
    if (!selectedClassId) return;
    try {
      setLoading(true);
      setStudentData([]);
      setMonthlyRankings([]);
      setActiveMonths([]);

      // 1. Get all exams for this class in the selected year
      const startOfYear = new Date(`${selectedYear}-01-01T00:00:00Z`).toISOString();
      const endOfYear = new Date(`${selectedYear + 1}-01-01T00:00:00Z`).toISOString();

      const { data: exams } = await supabase
        .from('exams')
        .select('id, end_time, total_marks')
        .eq('class_id', selectedClassId)
        .gte('end_time', startOfYear)
        .lt('end_time', endOfYear)
        .lt('end_time', new Date().toISOString()); // only past exams

      if (!exams || exams.length === 0) {
        setLoading(false);
        return;
      }

      const examIds = exams.map(e => e.id);

      // 2. Fetch all submitted attempts for these exams + student profile names
      const { data: attempts } = await supabase
        .from('exam_attempts')
        .select(`
          student_id,
          score,
          exam_id,
          exam:exams(end_time)
        `)
        .in('exam_id', examIds)
        .eq('status', 'submitted');

      if (!attempts || attempts.length === 0) {
        setLoading(false);
        return;
      }

      // 3. Get unique student IDs and fetch their names
      const uniqueStudentIds = [...new Set(attempts.map(a => a.student_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name')
        .in('id', uniqueStudentIds);

      const studentNameMap: Record<string, string> = {};
      (profiles || []).forEach(p => { studentNameMap[p.id] = p.full_name || 'Unknown'; });

      // 4. Group by student + month, summing scores
      const studentMonthMap: Record<string, Record<string, number>> = {};

      attempts.forEach(att => {
        const exam = att.exam as any;
        if (!exam?.end_time) return;
        const monthKey = att.exam.end_time.slice(0, 7); // "YYYY-MM"

        if (!studentMonthMap[att.student_id]) {
          studentMonthMap[att.student_id] = {};
        }
        studentMonthMap[att.student_id][monthKey] =
          (studentMonthMap[att.student_id][monthKey] || 0) + att.score;
      });

      // 5. Collect all active months and sort
      const allMonthKeys = [...new Set(attempts.map(att => (att.exam as any)?.end_time?.slice(0, 7)).filter(Boolean))].sort();
      setActiveMonths(allMonthKeys);

      // 6. Build student data rows
      const rows: StudentMonthlyScore[] = uniqueStudentIds.map(sid => {
        const monthlyScores = studentMonthMap[sid] || {};
        const totalScore = Object.values(monthlyScores).reduce((sum, s) => sum + s, 0);
        return {
          studentId: sid,
          studentName: studentNameMap[sid] || 'Unknown',
          monthlyScores,
          totalScore,
        };
      });

      // Sort by total score descending
      rows.sort((a, b) => b.totalScore - a.totalScore);
      setStudentData(rows);

      // 7. Build monthly rankings (rank per month) — tied ranking
      const rankingsByMonth: MonthlyRanking[] = allMonthKeys.map(monthKey => {
        const [y, m] = monthKey.split('-');
        const monthLabel = `${MONTHS_SHORT[parseInt(m) - 1]} ${y}`;

        const scores = rows
          .map(row => ({ studentId: row.studentId, studentName: row.studentName, score: row.monthlyScores[monthKey] || 0 }))
          .filter(s => s.score > 0)
          .sort((a, b) => b.score - a.score);

        // Tied ranking: same score → same rank
        const rankings = scores.map((s, i) => {
          const rank = i === 0 ? 1 : (s.score === scores[i - 1].score
            ? scores.findIndex(x => x.score === s.score) + 1
            : i + 1);
          return { ...s, rank };
        });

        return { monthKey, monthLabel, rankings };
      });

      setMonthlyRankings(rankingsByMonth);
    } catch (err) {
      console.error('Error loading rankings:', err);
    } finally {
      setLoading(false);
    }
  }

  const selectedClass = classes.find(c => c.id === selectedClassId);

  // Compute overall rankings with tied ranking support
  const overallRankings = [...studentData].sort((a, b) => b.totalScore - a.totalScore);
  const overallRankMap: Record<string, number> = {};
  overallRankings.forEach((student, i) => {
    const rank = i === 0 ? 1 : (student.totalScore === overallRankings[i - 1].totalScore
      ? overallRankMap[overallRankings[i - 1].studentId]
      : i + 1);
    overallRankMap[student.studentId] = rank;
  });

  return (
    <div className="h-full min-h-0 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-gray-50/50">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">Student Rankings</h2>
        <p className="text-slate-500 mt-1 text-sm">Monthly marks (out of {MARKS_PER_MONTH}) and rankings per class</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-4 py-2.5 shadow-sm">
          <Users className="w-4 h-4 text-slate-400" />
          {classesLoading ? (
            <span className="text-sm text-slate-400">Loading classes...</span>
          ) : (
            <select
              value={selectedClassId}
              onChange={e => setSelectedClassId(e.target.value)}
              className="bg-transparent border-none outline-none text-sm text-slate-700 pr-6 cursor-pointer min-w-[160px]"
            >
              {classes.length === 0 && <option value="">No classes found</option>}
              {classes.map(c => (
                <option key={c.id} value={c.id}>{c.title}</option>
              ))}
            </select>
          )}
          <ChevronDown className="w-4 h-4 text-slate-400 -ml-4 pointer-events-none" />
        </div>

        <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-4 py-2.5 shadow-sm">
          <Calendar className="w-4 h-4 text-slate-400" />
          <select
            value={selectedYear}
            onChange={e => setSelectedYear(Number(e.target.value))}
            className="bg-transparent border-none outline-none text-sm text-slate-700 pr-6 cursor-pointer"
          >
            {years.map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
          <ChevronDown className="w-4 h-4 text-slate-400 -ml-4 pointer-events-none" />
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-20">
          <div className="relative w-12 h-12">
            <div className="absolute inset-0 rounded-full border-4 border-red-100" />
            <div className="absolute inset-0 rounded-full border-4 border-[#eb1b23] border-t-transparent animate-spin" />
          </div>
        </div>
      )}

      {/* Empty state */}
      {!loading && studentData.length === 0 && selectedClassId && (
        <div className="text-center py-20 bg-white rounded-2xl border border-gray-100 shadow-sm">
          <div className="w-20 h-20 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <BarChart2 className="w-10 h-10 text-slate-300" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 mb-2">No results yet</h3>
          <p className="text-slate-400 text-sm max-w-xs mx-auto">
            No submitted exam attempts found for <strong>{selectedClass?.title}</strong> in {selectedYear}.
          </p>
        </div>
      )}

      {!loading && studentData.length > 0 && (
        <>
          {/* Monthly Rankings Cards */}
          <div className="space-y-6 mb-8">
            {monthlyRankings.map(month => (
              <div key={month.monthKey} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-[#eb1b23]/5 rounded-lg">
                      <Calendar className="w-5 h-5 text-[#eb1b23]" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-slate-900">{month.monthLabel}</h3>
                      <p className="text-xs text-slate-400">{month.rankings.length} students participated</p>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-widest bg-slate-50 px-3 py-1 rounded-full border border-slate-100">
                    Out of {MARKS_PER_MONTH}
                  </span>
                </div>

                <div className="divide-y divide-gray-50">
                  {month.rankings.map((student, i) => {
                    const pct = Math.round((student.score / MARKS_PER_MONTH) * 100);
                    const isTop3 = student.rank <= 3;

                    return (
                      <div
                        key={student.studentId}
                        className={`flex items-center gap-4 px-5 py-3.5 transition-colors ${isTop3 ? 'bg-amber-50/40' : 'hover:bg-gray-50/70'}`}
                      >
                        {/* Rank Badge */}
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center font-black text-sm flex-shrink-0 ${
                          student.rank === 1 ? 'bg-yellow-400 text-white shadow-md shadow-yellow-100' :
                          student.rank === 2 ? 'bg-slate-400 text-white shadow-md shadow-slate-100' :
                          student.rank === 3 ? 'bg-amber-700 text-white shadow-md shadow-amber-100' :
                          'bg-slate-100 text-slate-500'
                        }`}>
                          {student.rank === 1 ? '🥇' : student.rank === 2 ? '🥈' : student.rank === 3 ? '🥉' : student.rank}
                        </div>

                        {/* Name */}
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-bold truncate ${isTop3 ? 'text-slate-900' : 'text-slate-700'}`}>
                            {student.studentName}
                          </p>
                        </div>

                        {/* Score bar */}
                        <div className="flex-1 hidden sm:block">
                          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${
                                pct >= 75 ? 'bg-green-500' : pct >= 50 ? 'bg-amber-400' : 'bg-red-400'
                              }`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>

                        {/* Score */}
                        <div className="text-right flex-shrink-0 w-20">
                          <p className="text-lg font-black text-slate-900">{student.score}</p>
                          <p className="text-[10px] text-slate-400">/ {MARKS_PER_MONTH}</p>
                        </div>

                        {/* Percentage */}
                        <div className={`text-right flex-shrink-0 w-14 text-sm font-bold ${
                          pct >= 75 ? 'text-green-600' : pct >= 50 ? 'text-amber-600' : 'text-red-500'
                        }`}>
                          {pct}%
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Overall Summary Table */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-3">
              <div className="p-2 bg-amber-50 rounded-lg">
                <Trophy className="w-5 h-5 text-amber-500" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">Overall Summary — {selectedYear}</h3>
                <p className="text-xs text-slate-400">
                  {selectedClass?.title} · Total possible: {activeMonths.length * MARKS_PER_MONTH} marks
                </p>
              </div>
            </div>

            {/* Scrollable table */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="text-left px-5 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider sticky left-0 bg-gray-50 z-10 min-w-[200px]">
                      Student
                    </th>
                    {activeMonths.map(mk => {
                      const [y, m] = mk.split('-');
                      return (
                        <th key={mk} className="text-center px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider min-w-[90px]">
                          {MONTHS_SHORT[parseInt(m) - 1]} {y.slice(2)}
                        </th>
                      );
                    })}
                    <th className="text-center px-5 py-3 text-xs font-bold text-[#eb1b23] uppercase tracking-wider min-w-[90px]">
                      Total
                    </th>
                    <th className="text-center px-5 py-3 text-xs font-bold text-amber-600 uppercase tracking-wider min-w-[70px]">
                      Rank
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {overallRankings.map((student) => {
                    const overallRank = overallRankMap[student.studentId] || 1;
                    const totalPossible = activeMonths.length * MARKS_PER_MONTH;
                    const totalPct = totalPossible > 0 ? Math.round((student.totalScore / totalPossible) * 100) : 0;

                    return (
                      <tr
                        key={student.studentId}
                        className={`hover:bg-gray-50/70 transition-colors ${overallRank <= 3 ? 'bg-amber-50/30' : ''}`}
                      >
                        {/* Name */}
                        <td className="px-5 py-3 sticky left-0 bg-white z-10">
                          <div className="flex items-center gap-2.5">
                            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0 ${
                              overallRank === 1 ? 'bg-yellow-400 text-white' :
                              overallRank === 2 ? 'bg-slate-400 text-white' :
                              overallRank === 3 ? 'bg-amber-700 text-white' :
                              'bg-slate-100 text-slate-500'
                            }`}>
                              {overallRank}
                            </div>
                            <span className="font-semibold text-slate-800 truncate">{student.studentName}</span>
                          </div>
                        </td>

                        {/* Monthly scores */}
                        {activeMonths.map(mk => {
                          const score = student.monthlyScores[mk];
                          const hasMark = score !== undefined;
                          const pct = hasMark ? Math.round((score / MARKS_PER_MONTH) * 100) : null;

                          // Get rank for this month
                          const monthRanking = monthlyRankings.find(r => r.monthKey === mk);
                          const monthRankEntry = monthRanking?.rankings.find(r => r.studentId === student.studentId);

                          return (
                            <td key={mk} className="px-4 py-3 text-center">
                              {hasMark ? (
                                <div>
                                  <p className={`font-bold text-sm ${
                                    pct! >= 75 ? 'text-green-700' : pct! >= 50 ? 'text-amber-600' : 'text-red-600'
                                  }`}>
                                    {score}
                                  </p>
                                  {monthRankEntry && (
                                    <p className="text-[10px] text-slate-400 font-medium">
                                      #{monthRankEntry.rank}
                                    </p>
                                  )}
                                </div>
                              ) : (
                                <span className="text-slate-300 font-medium">—</span>
                              )}
                            </td>
                          );
                        })}

                        {/* Total */}
                        <td className="px-5 py-3 text-center">
                          <p className="font-black text-slate-900">{student.totalScore}</p>
                          <p className={`text-[10px] font-bold ${
                            totalPct >= 75 ? 'text-green-600' : totalPct >= 50 ? 'text-amber-600' : 'text-red-500'
                          }`}>{totalPct}%</p>
                        </td>

                        {/* Overall Rank */}
                        <td className="px-5 py-3 text-center">
                          <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-black ${
                            overallRank === 1 ? 'bg-yellow-100 text-yellow-700' :
                            overallRank === 2 ? 'bg-slate-100 text-slate-600' :
                            overallRank === 3 ? 'bg-amber-100 text-amber-700' :
                            'bg-gray-50 text-slate-500'
                          }`}>
                            {overallRank === 1 ? <Medal className="w-4 h-4" /> : overallRank}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
