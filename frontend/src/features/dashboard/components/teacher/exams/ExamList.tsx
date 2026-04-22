import { Calendar, Clock, FileText, ChevronRight, Users, Plus, Search } from 'lucide-react';
import type { Exam, Class } from './types';

interface ExamListProps {
  exams: Exam[];
  classes: Class[];
  loading: boolean;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  filterStatus: string;
  setFilterStatus: (s: string) => void;
  onExamClick: (exam: Exam) => void;
  onCreateClick: () => void;
}

export function ExamList({
  exams,
  classes,
  loading,
  searchQuery,
  setSearchQuery,
  filterStatus,
  setFilterStatus,
  onExamClick,
  onCreateClick
}: ExamListProps) {
  
  const filteredExams = exams.filter(exam => {
    if (searchQuery && !exam.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    
    const now = new Date();
    const startTime = new Date(exam.start_time);
    const endTime = new Date(exam.end_time);
    const isUpcoming = startTime > now;
    const isActive = startTime <= now && endTime >= now;
    const isPast = endTime < now;

    if (filterStatus === 'upcoming') return isUpcoming;
    if (filterStatus === 'active') return isActive;
    if (filterStatus === 'past') return isPast;
    
    return true;
  });

  return (
    <div className="h-full min-h-0 overflow-y-auto w-full">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-8 border-b bg-white">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Exams & Assignments</h2>
          <p className="text-gray-500 mt-1">Create and manage your assessments</p>
        </div>
        <button
          onClick={onCreateClick}
          className="flex items-center space-x-2 bg-[#eb1b23] text-white px-4 py-2 rounded-lg hover:bg-red-700 transition"
        >
          <Plus className="w-5 h-5" />
          <span>Create New Exam</span>
        </button>
      </div>

      <div className="p-8">
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search exams..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#eb1b23] focus:border-transparent"
            />
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">Filter:</span>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#eb1b23] focus:border-transparent"
            >
              <option value="all">All Exams</option>
              <option value="upcoming">Upcoming</option>
              <option value="active">Active</option>
              <option value="past">Past</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#eb1b23]"></div>
          </div>
        ) : filteredExams.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-1">No exams found</h3>
            <p className="text-gray-500">Get started by creating your first exam</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredExams.map((exam) => {
              const now = new Date();
              const startTime = new Date(exam.start_time);
              const endTime = new Date(exam.end_time);
              const isUpcoming = startTime > now;
              const isActive = startTime <= now && endTime >= now;

              return (
                <div
                  key={exam.id}
                  onClick={() => onExamClick(exam)}
                  className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition cursor-pointer group"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1 pr-4">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded">
                          {exam.subject}
                        </span>
                        {isActive ? (
                          <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded flex items-center">
                            <span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1.5"></span>
                            Active Now
                          </span>
                        ) : isUpcoming ? (
                          <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded">
                            Upcoming
                          </span>
                        ) : (
                          <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded">
                            Ended
                          </span>
                        )}
                      </div>
                      <h3 className="font-bold text-gray-900 group-hover:text-[#eb1b23] transition line-clamp-1">
                        {exam.title}
                      </h3>
                      {exam.class_title && (
                        <p className="text-sm text-gray-500 mt-1 line-clamp-1">{exam.class_title}</p>
                      )}
                    </div>
                    <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center flex-shrink-0">
                      <FileText className="w-5 h-5 text-[#eb1b23]" />
                    </div>
                  </div>

                  <div className="space-y-3 mb-6">
                    <div className="flex items-center text-sm text-gray-600">
                      <Calendar className="w-4 h-4 mr-2" />
                      {new Date(exam.start_time).toLocaleDateString()}
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <Clock className="w-4 h-4 mr-2" />
                      {exam.duration_minutes} Minutes
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <Users className="w-4 h-4 mr-2" />
                      {exam.submission_count || 0} Submissions
                    </div>
                  </div>

                  <div className="pt-4 border-t border-gray-100 flex items-center justify-between text-sm">
                    <span className="font-medium text-gray-900">{exam.total_marks} Marks Total</span>
                    <span className="text-[#eb1b23] font-medium flex items-center group-hover:translate-x-1 transition-transform">
                      View Details
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
