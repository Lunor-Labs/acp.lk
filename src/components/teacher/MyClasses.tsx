import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { ClassRepository, EnrollmentRepository, TeacherRepository } from '../../repositories';
import { supabase } from '../../lib/supabase';
import {
  Plus,
  Edit2,
  Users,
  Clock,
  Search,
  AlertTriangle,
  Check,
  Beaker,
  Microscope,
  Calculator,
  BookOpen,
  Atom,
  Video,
  FileText as FileIcon,
  Trash2,
  Calendar,
  PlayCircle,
  AlertCircle
} from 'lucide-react';

interface Class {
  id: string;
  title: string;
  description: string;
  subject: string;
  price: number;
  is_free: boolean;
  is_active: boolean;
  materials: Material[];
  weeks: Week[];
  created_at: string;
}

interface Week {
  id: string;
  title: string;
  description?: string;
  schedule_time?: string;
  zoom_link?: string;
  recordings: string[];
  materials: Material[];
}

interface Material {
  name: string;
  url: string;
  type: 'pdf' | 'video' | 'other';
}

interface Material {
  name: string;
  url: string;
  type: 'pdf' | 'video' | 'other';
}

const getClassIcon = (subject: string) => {
  const subjectLower = subject.toLowerCase();
  if (subjectLower.includes('physics')) return Atom;
  if (subjectLower.includes('chemistry')) return Beaker;
  if (subjectLower.includes('biology')) return Microscope;
  if (subjectLower.includes('math')) return Calculator;
  return BookOpen;
};

const getClassColor = (index: number) => {
  const colors = [
    { bg: 'bg-red-50', icon: 'text-[#eb1b23]', badge: 'bg-red-100 text-red-700' },
    { bg: 'bg-blue-50', icon: 'text-blue-600', badge: 'bg-blue-100 text-blue-700' },
    { bg: 'bg-emerald-50', icon: 'text-emerald-600', badge: 'bg-emerald-100 text-emerald-700' },
    { bg: 'bg-amber-50', icon: 'text-amber-600', badge: 'bg-amber-100 text-amber-700' },
    { bg: 'bg-purple-50', icon: 'text-purple-600', badge: 'bg-purple-100 text-purple-700' },
  ];
  return colors[index % colors.length];
};

export default function MyClasses() {
  const { profile } = useAuth();
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [teacherId, setTeacherId] = useState<string | null>(null);
  const [enrollmentCounts, setEnrollmentCounts] = useState<Record<string, number>>({});

  const classRepo = new ClassRepository();
  const enrollmentRepo = new EnrollmentRepository();
  const teacherRepo = new TeacherRepository();

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    subject: 'Physics',
    price: 0,
    is_free: true,
    materials: [] as Material[],
    weeks: [] as Week[],
  });

  const [editingClassId, setEditingClassId] = useState<string | null>(null);
  const [activeRecordingInput, setActiveRecordingInput] = useState<string | null>(null);
  const [recordingUrlInput, setRecordingUrlInput] = useState('');
  const [isUploading, setIsUploading] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    if (profile?.id) {
      loadTeacherAndClasses();
    }
  }, [profile]);

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const loadTeacherAndClasses = async () => {
    try {
      const teacherData = await teacherRepo.findByProfileId(profile?.id!);

      if (teacherData) {
        setTeacherId(teacherData.id);
        await loadClasses(teacherData.id);
      } else {
        // No teacher record found — stop loading so UI shows an empty state
        setLoading(false);
      }
    } catch (error) {
      console.error('Error loading teacher data:', error);
      setLoading(false);
    }
  };

  const loadClasses = async (tId: string) => {
    try {
      setLoading(true);
      const data = await classRepo.findByTeacherId(tId);
      const classesWithWeeks = data.map(cls => ({
        ...cls,
        weeks: cls.weeks || []
      })) as Class[];
      setClasses(classesWithWeeks);

      for (const cls of classesWithWeeks) {
        loadEnrollmentCount(cls.id);
      }
    } catch (error) {
      console.error('Error loading classes:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadEnrollmentCount = async (classId: string) => {
    try {
      const count = await enrollmentRepo.getEnrollmentCount(classId);
      setEnrollmentCounts(prev => ({ ...prev, [classId]: count }));
    } catch (error) {
      console.error('Error loading enrollment count:', error);
    }
  };

  const handleCreateClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teacherId) return;

    try {
      const classData = {
        teacher_id: teacherId,
        title: formData.title,
        description: formData.description,
        subject: formData.subject,
        price: formData.is_free ? 0 : formData.price,
        is_free: formData.is_free,
        materials: formData.materials,
        weeks: formData.weeks,
        is_active: true,
      };

      if (editingClassId) {
        await classRepo.update(editingClassId, classData as any);
        setNotification({ message: 'Class updated successfully!', type: 'success' });
      } else {
        await classRepo.create(classData as any);
        setNotification({ message: 'Class published successfully!', type: 'success' });
      }

      await loadClasses(teacherId);
      resetForm();
    } catch (error) {
      console.error('Error saving class:', error);
      setNotification({ message: 'Failed to save class. Please try again.', type: 'error' });
    }
  };

  const handleToggleActive = async (classId: string, currentStatus: boolean) => {
    try {
      await classRepo.toggleActive(classId, !currentStatus);
      if (teacherId) await loadClasses(teacherId);
    } catch (error) {
      console.error('Error toggling class status:', error);
    }
  };

  const addWeek = () => {
    const newWeek: Week = {
      id: Math.random().toString(36).substr(2, 9),
      title: `Week ${formData.weeks.length + 1}`,
      description: '',
      schedule_time: '',
      zoom_link: '',
      recordings: [],
      materials: [],
    };
    setFormData({ ...formData, weeks: [...formData.weeks, newWeek] });
  };

  const updateWeek = (weekId: string, updates: Partial<Week>) => {
    setFormData({
      ...formData,
      weeks: formData.weeks.map(w => w.id === weekId ? { ...w, ...updates } : w)
    });
  };

  const removeWeek = (weekId: string) => {
    setFormData({
      ...formData,
      weeks: formData.weeks.filter(w => w.id !== weekId)
    });
  };

  const addRecordingToWeek = (weekId: string, url: string) => {
    if (!url.trim()) return;
    setFormData({
      ...formData,
      weeks: formData.weeks.map(w =>
        w.id === weekId ? { ...w, recordings: [...(w.recordings || []), url] } : w
      )
    });
    setActiveRecordingInput(null);
    setRecordingUrlInput('');
  };

  const removeRecordingFromWeek = (weekId: string, index: number) => {
    setFormData({
      ...formData,
      weeks: formData.weeks.map(w =>
        w.id === weekId ? { ...w, recordings: w.recordings.filter((_, i) => i !== index) } : w
      )
    });
  };

  const handleFileUpload = async (weekId: string, file: File) => {
    try {
      setIsUploading(weekId);
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `materials/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('acp')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('acp')
        .getPublicUrl(filePath);

      addMaterialToWeek(weekId, {
        name: file.name,
        url: publicUrl,
        type: 'pdf'
      });
    } catch (error) {
      console.error('Error uploading file:', error);
      setNotification({ message: 'Failed to upload file', type: 'error' });
    } finally {
      setIsUploading(null);
    }
  };

  const addMaterialToWeek = (weekId: string, material: Material) => {
    setFormData({
      ...formData,
      weeks: formData.weeks.map(w =>
        w.id === weekId ? { ...w, materials: [...w.materials, material] } : w
      )
    });
  };

  const handleEdit = (cls: Class) => {
    setFormData({
      title: cls.title,
      description: cls.description,
      subject: cls.subject,
      price: cls.price,
      is_free: cls.is_free,
      materials: cls.materials || [],
      weeks: cls.weeks || [],
    });
    setEditingClassId(cls.id);
    // Scroll to form
    const formElement = document.querySelector('form');
    formElement?.scrollIntoView({ behavior: 'smooth' });
  };

  const removeMaterialFromWeek = (weekId: string, index: number) => {
    setFormData({
      ...formData,
      weeks: formData.weeks.map(w =>
        w.id === weekId ? { ...w, materials: w.materials.filter((_, i) => i !== index) } : w
      )
    });
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      subject: 'Physics',
      price: 0,
      is_free: true,
      materials: [],
      weeks: [],
    });
    setEditingClassId(null);
  };

  const filteredClasses = classes.filter(cls =>
    cls.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    cls.subject.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="h-full min-h-0 overflow-y-auto p-4 sm:p-6 lg:p-8">
      <div className="mb-4 sm:mb-6">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">My Classes</h2>
      </div>

      {notification && (
        <div className={`mb-4 sm:mb-6 p-3 sm:p-4 rounded-xl flex items-center gap-2 sm:gap-3 transition-all duration-300 animate-in fade-in slide-in-from-top-4 ${notification.type === 'success' ? 'bg-emerald-50 border border-emerald-100 text-emerald-700' : 'bg-red-50 border border-red-100 text-red-700'}`}>
          {notification.type === 'success' ? <Check className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" /> : <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />}
          <p className="text-xs sm:text-sm font-bold">{notification.message}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mb-4 sm:mb-6">
              <h3 className="text-lg sm:text-xl font-bold text-gray-900">Active Classes</h3>
              <div className="relative w-full sm:w-auto">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5" />
                <input
                  type="text"
                  placeholder="Search class..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#eb1b23] focus:border-transparent w-full sm:w-64"
                />
              </div>
            </div>

            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#eb1b23]"></div>
              </div>
            ) : !teacherId ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertTriangle className="w-8 h-8 text-amber-500" />
                </div>
                <h4 className="text-lg font-semibold text-gray-800 mb-2">Teacher profile not set up</h4>
                <p className="text-sm text-gray-500 max-w-sm mx-auto">
                  Your account role is set to Teacher, but no teacher record was found in the database.
                  Please contact an administrator to complete your teacher profile setup.
                </p>
              </div>
            ) : filteredClasses.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500">No classes found. Create your first class using the form →</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredClasses.map((cls) => {
                  const IconComponent = getClassIcon(cls.subject);
                  const colors = getClassColor(0); // Default to first color

                  return (
                    <div key={cls.id} className="border border-gray-200 rounded-xl p-3 sm:p-4 hover:shadow-md transition">
                      <div className="flex flex-col sm:flex-row sm:items-start gap-4 sm:space-x-4">
                        {/* Icon - smaller on mobile */}
                        <div className={`${colors.bg} rounded-2xl p-3 sm:p-4 flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 flex-shrink-0`}>
                          <IconComponent className={`w-8 h-8 sm:w-12 sm:h-12 ${colors.icon}`} />
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          {/* Title and metadata - stack on mobile */}
                          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-0 mb-3">
                            <div className="min-w-0">
                              {/* Subject badge and date */}
                              <div className="flex flex-wrap items-center gap-2 mb-2">
                                <span className={`px-2 sm:px-3 py-1 rounded-full text-xs font-semibold uppercase whitespace-nowrap ${colors.badge}`}>
                                  {cls.subject}
                                </span>
                                <span className="text-xs text-gray-500 whitespace-nowrap">
                                  {new Date(cls.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                </span>
                              </div>
                              {/* Title - truncate properly on mobile */}
                              <h4 className="text-base sm:text-lg font-bold text-gray-900 line-clamp-2">{cls.title}</h4>
                              {/* Description - truncate on mobile */}
                              <p className="text-xs sm:text-sm text-gray-600 mt-1 line-clamp-2">{cls.description}</p>
                            </div>
                            {/* Action buttons - stack vertically on mobile */}
                            <div className="flex items-center gap-2 flex-shrink-0">
                              <button
                                onClick={() => handleToggleActive(cls.id, cls.is_active)}
                                className={`text-xs font-medium px-2 py-1 rounded transition whitespace-nowrap ${cls.is_active ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                              >
                                {cls.is_active ? 'Active' : 'Paused'}
                              </button>
                              <button
                                onClick={() => handleEdit(cls)}
                                className="text-[#eb1b23] hover:text-red-700 bg-red-50 p-2 rounded-lg transition-colors group flex-shrink-0"
                                title="Edit Class"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>

                          {/* Stats - responsive layout */}
                          <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-xs sm:text-sm text-gray-600 mt-3">
                            <div className="flex items-center gap-1 whitespace-nowrap">
                              <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                              <span>{enrollmentCounts[cls.id] || 0} Students</span>
                            </div>
                            <div className="flex items-center gap-1 whitespace-nowrap">
                              <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                              <span>{cls.weeks?.length || 0} Weeks</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Weeks Display - responsive grid */}
                      {cls.weeks && cls.weeks.length > 0 && (
                        <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-gray-100 grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                          {cls.weeks.map((week, idx) => (
                            <div key={week.id || idx} className="bg-gray-50 rounded-lg p-2 sm:p-3 text-xs flex items-center justify-between group overflow-hidden">
                              <div className="flex items-center gap-2 min-w-0">
                                <div className="w-5 h-5 sm:w-6 sm:h-6 rounded bg-white flex items-center justify-center font-bold text-gray-500 flex-shrink-0 text-xs">
                                  {idx + 1}
                                </div>
                                <span className="font-semibold text-gray-700 truncate text-xs">{week.title}</span>
                              </div>
                              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                                {week.zoom_link && <Video className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-blue-500" />}
                                {week.recordings?.length > 0 && <PlayCircle className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-[#eb1b23]" />}
                                {week.materials?.length > 0 && <FileIcon className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-gray-400" />}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 sticky top-6 border-t-4 border-[#eb1b23] flex flex-col max-h-[calc(100vh-100px)]">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-4 sm:mb-6 flex-shrink-0">
              <div className="flex-1 min-w-0">
                <h3 className="text-base sm:text-lg font-bold text-slate-900 leading-tight">
                  {editingClassId ? 'Edit Class Details' : 'Create New Class'}
                </h3>
                <p className="text-[9px] sm:text-[10px] text-slate-500 uppercase font-bold tracking-wider">
                  {editingClassId ? 'Update existing configuration' : 'Module-based setup'}
                </p>
              </div>
              {editingClassId && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-2 sm:px-3 py-1 bg-gray-100 text-gray-500 rounded text-xs font-bold hover:bg-gray-200 whitespace-nowrap flex-shrink-0"
                >
                  Cancel
                </button>
              )}
            </div>

            <form onSubmit={handleCreateClass} className="space-y-4 sm:space-y-6 overflow-y-auto pr-2 flex-1 pb-4">
              <div className="space-y-3 sm:space-y-4">
                <div>
                  <label className="block text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase mb-1">Class Title</label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#eb1b23] focus:border-transparent text-sm font-semibold"
                    placeholder="e.g. 2027 Physics Theory - March"
                  />
                </div>

                {/* Subject field hidden as it's currently only for Physics */}
                {/* <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Subject</label>
                  <input
                    type="text"
                    required
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#eb1b23] focus:border-transparent text-sm"
                    placeholder="e.g. Physics"
                  />
                </div> */}

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Overview Description</label>
                  <textarea
                    rows={2}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#eb1b23] focus:border-transparent text-sm resize-none"
                    placeholder="Briefly describe the class scope..."
                  />
                </div>
              </div>

              {/* Weekly Sub-classes Section */}
              <div className="pt-4 border-t border-gray-100">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-widest">Class Modules</h4>
                  <button
                    type="button"
                    onClick={addWeek}
                    className="flex items-center space-x-1 text-[10px] font-bold text-[#eb1b23] hover:underline"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Add Module</span>
                  </button>
                </div>

                <div className="space-y-6">
                  {formData.weeks.map((week) => (
                    <div key={week.id} className="bg-slate-50 rounded-xl p-4 border border-slate-200 relative group/week">
                      <button
                        type="button"
                        onClick={() => removeWeek(week.id)}
                        className="absolute top-2 right-2 text-slate-400 hover:text-red-500 opacity-0 group-hover/week:opacity-100 transition-opacity"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>

                      <div className="grid grid-cols-1 gap-4">
                        <div className="grid grid-cols-1 gap-3">
                          <div>
                            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Title</label>
                            <input
                              type="text"
                              value={week.title}
                              onChange={(e) => updateWeek(week.id, { title: e.target.value })}
                              className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs focus:ring-1 focus:ring-[#eb1b23] focus:border-transparent font-semibold"
                              placeholder="Week Title..."
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Schedule</label>
                            <div className="flex items-center bg-white border border-slate-200 rounded-lg px-2">
                              <Clock className="w-3 h-3 text-slate-400 mr-2" />
                              <input
                                type="text"
                                value={week.schedule_time || ''}
                                onChange={(e) => updateWeek(week.id, { schedule_time: e.target.value })}
                                placeholder="eg: Mon 6PM"
                                className="w-full border-none p-2 focus:ring-0 text-[10px]"
                              />
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 gap-3">
                          <div>
                            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Live Class Link</label>
                            <div className="flex items-center bg-white border border-slate-200 rounded-lg px-2">
                              <Video className="w-3 h-3 text-blue-400 mr-2" />
                              <input
                                type="text"
                                value={week.zoom_link || ''}
                                onChange={(e) => updateWeek(week.id, { zoom_link: e.target.value })}
                                placeholder="https://..."
                                className="w-full border-none p-2 focus:ring-0 text-[10px]"
                              />
                            </div>
                          </div>

                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <label className="block text-[10px] font-bold text-slate-400 uppercase">Recordings</label>
                              {activeRecordingInput !== week.id && (
                                <button
                                  type="button"
                                  onClick={() => setActiveRecordingInput(week.id)}
                                  className="text-[10px] font-bold text-[#eb1b23] hover:underline"
                                >
                                  + Add Link
                                </button>
                              )}
                            </div>

                            {activeRecordingInput === week.id && (
                              <div className="flex gap-1">
                                <input
                                  type="text"
                                  autoFocus
                                  placeholder="Paste link and press enter"
                                  value={recordingUrlInput}
                                  onChange={(e) => setRecordingUrlInput(e.target.value)}
                                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addRecordingToWeek(week.id, recordingUrlInput))}
                                  className="flex-1 text-[10px] p-1.5 border border-red-200 rounded focus:ring-1 focus:ring-red-500 outline-none"
                                />
                                <button
                                  type="button"
                                  onClick={() => addRecordingToWeek(week.id, recordingUrlInput)}
                                  className="px-2 py-1 bg-red-500 text-white text-[10px] font-bold rounded"
                                >
                                  Add
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setActiveRecordingInput(null)}
                                  className="px-1 text-slate-400"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            )}

                            <div className="space-y-1.5">
                              {week.recordings?.map((rec, rIdx) => (
                                <div key={rIdx} className="flex items-center bg-white border border-slate-100 rounded-lg px-2 py-1 shadow-sm">
                                  <PlayCircle className="w-3 h-3 text-red-500 mr-2" />
                                  <span className="flex-1 text-[9px] text-slate-600 truncate">{rec}</span>
                                  <button
                                    type="button"
                                    onClick={() => removeRecordingFromWeek(week.id, rIdx)}
                                    className="p-1 text-slate-400 hover:text-red-500"
                                  >
                                    <Trash2 className="w-2.5 h-2.5" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>

                        <div className="pt-3 border-t border-slate-100">
                          <div className="flex items-center justify-between mb-2">
                            <label className="block text-[10px] font-bold text-slate-400 uppercase">Study Materials</label>
                            <label className={`text-[10px] font-bold text-teal-600 hover:underline cursor-pointer ${isUploading === week.id ? 'opacity-50 pointer-events-none' : ''}`}>
                              {isUploading === week.id ? 'Uploading...' : '+ Upload PDF'}
                              <input
                                type="file"
                                accept=".pdf"
                                className="hidden"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) handleFileUpload(week.id, file);
                                }}
                              />
                            </label>
                          </div>
                          <div className="space-y-1.5">
                            {week.materials?.map((mat, mIdx) => (
                              <div key={mIdx} className="flex items-center bg-white border border-slate-100 rounded-lg px-2 py-1 shadow-sm">
                                <FileIcon className="w-3 h-3 text-teal-500 mr-2" />
                                <span className="flex-1 text-[9px] text-slate-600 truncate">{mat.name}</span>
                                <button
                                  type="button"
                                  onClick={() => removeMaterialFromWeek(week.id, mIdx)}
                                  className="p-1 text-slate-400 hover:text-red-500"
                                >
                                  <Trash2 className="w-2.5 h-2.5" />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}

                  {formData.weeks.length === 0 && (
                    <div className="text-center py-8 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                      <Calendar className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                      <p className="text-[10px] text-slate-400 font-medium px-4">Create modules to add live links, recordings and course materials for students.</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-4 border-t border-gray-100 space-y-4">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">Access & Pricing</label>

                <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-4">
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.is_free}
                      onChange={(e) => setFormData({ ...formData, is_free: e.target.checked })}
                      className="w-5 h-5 text-[#eb1b23] border-gray-300 rounded focus:ring-[#eb1b23]"
                    />
                    <div className="flex-1">
                      <span className="block text-sm font-bold text-gray-900">Free Access</span>
                      <span className="block text-[10px] text-gray-500">Available to all students for free</span>
                    </div>
                  </label>

                  {!formData.is_free && (
                    <div className="pt-3 border-t border-slate-200">
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-2">Monthly Batch Fee (LKR)</label>
                      <div className="relative">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-sm">LKR</div>
                        <input
                          type="number"
                          min="0"
                          value={formData.price}
                          onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                          className="w-full pl-12 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#eb1b23] focus:border-transparent text-sm font-bold"
                          placeholder="0.00"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {!formData.is_free && (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex space-x-2">
                    <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                    <p className="text-[10px] text-amber-900 leading-tight">
                      <span className="font-bold">Paid Class:</span> Students must complete payment to access recordings and documents in this course.
                    </p>
                  </div>
                )}
              </div>

              <button
                type="submit"
                className={`w-full ${editingClassId ? 'bg-orange-600 hover:bg-orange-700' : 'bg-[#eb1b23] hover:bg-red-700'} text-white py-4 rounded-xl transition-all duration-200 hover:shadow-xl flex items-center justify-center space-x-2 font-bold shadow-lg flex-shrink-0 mb-4`}
              >
                <Check className="w-5 h-5" />
                <span>{editingClassId ? 'Update Class Details' : 'Publish Class'}</span>
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
