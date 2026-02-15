import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { ClassRepository, EnrollmentRepository, TeacherRepository } from '../../repositories';
import { Plus, Users, Clock, MoreVertical, Search, ChevronDown, Upload, AlertTriangle, Check, Beaker, Microscope, Calculator, BookOpen, FlaskConical, Atom } from 'lucide-react';

interface Class {
  id: string;
  title: string;
  description: string;
  subject: string;
  schedule: string;
  zoom_link: string;
  price: number;
  is_free: boolean;
  is_active: boolean;
  materials: Material[];
  created_at: string;
}

interface Material {
  name: string;
  url: string;
  type: 'pdf' | 'video' | 'other';
}

interface Enrollment {
  id: string;
  enrolled_at: string;
  is_active: boolean;
  student: {
    id: string;
    full_name: string;
    email: string;
    student_number: number;
  };
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
    { bg: 'bg-purple-100', icon: 'text-purple-600', badge: 'bg-purple-50 text-purple-700' },
    { bg: 'bg-blue-100', icon: 'text-blue-600', badge: 'bg-blue-50 text-blue-700' },
    { bg: 'bg-gray-100', icon: 'text-gray-600', badge: 'bg-gray-50 text-gray-700' },
    { bg: 'bg-teal-100', icon: 'text-teal-600', badge: 'bg-teal-50 text-teal-700' },
    { bg: 'bg-orange-100', icon: 'text-orange-600', badge: 'bg-orange-50 text-orange-700' },
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
    subject: '',
    schedule: '',
    zoom_link: '',
    price: 0,
    is_free: true,
    materials: [] as Material[],
  });

  const [materialForm, setMaterialForm] = useState({
    name: '',
    url: '',
    type: 'pdf' as 'pdf' | 'video' | 'other',
  });

  useEffect(() => {
    if (profile?.id) {
      loadTeacherAndClasses();
    }
  }, [profile]);

  const loadTeacherAndClasses = async () => {
    try {
      const teacherData = await teacherRepo.findByProfileId(profile?.id!);

      if (teacherData) {
        setTeacherId(teacherData.id);
        await loadClasses(teacherData.id);
      }
    } catch (error) {
      console.error('Error loading teacher data:', error);
    }
  };

  const loadClasses = async (tId: string) => {
    try {
      setLoading(true);
      const data = await classRepo.findByTeacherId(tId);
      setClasses(data);

      for (const cls of data) {
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
      await classRepo.create({
        teacher_id: teacherId,
        title: formData.title,
        description: formData.description,
        subject: formData.subject,
        schedule: formData.schedule,
        zoom_link: formData.zoom_link,
        price: formData.is_free ? 0 : formData.price,
        is_free: formData.is_free,
        materials: formData.materials,
        is_active: true,
      });

      await loadClasses(teacherId);
      resetForm();
    } catch (error) {
      console.error('Error creating class:', error);
      alert('Failed to create class. Please try again.');
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

  const addMaterial = () => {
    if (!materialForm.name || !materialForm.url) return;

    setFormData({
      ...formData,
      materials: [...formData.materials, { ...materialForm }],
    });

    setMaterialForm({ name: '', url: '', type: 'pdf' });
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      subject: '',
      schedule: '',
      zoom_link: '',
      price: 0,
      is_free: true,
      materials: [],
    });
  };

  const filteredClasses = classes.filter(cls =>
    cls.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    cls.subject.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-8">
      <div className="mb-6">
        <h2 className="text-3xl font-bold text-gray-900">My Classes</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">Active Classes</h3>
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Search class..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent w-64"
                  />
                </div>
              </div>
            </div>

            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
              </div>
            ) : filteredClasses.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500">No classes found</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredClasses.map((cls, index) => {
                  const IconComponent = getClassIcon(cls.subject);
                  const colors = getClassColor(index);

                  return (
                    <div key={cls.id} className="border border-gray-200 rounded-xl p-4 hover:shadow-md transition">
                      <div className="flex items-start space-x-4">
                        <div className={`${colors.bg} rounded-2xl p-4 flex items-center justify-center w-20 h-20`}>
                          <IconComponent className={`w-12 h-12 ${colors.icon}`} />
                        </div>

                        <div className="flex-1">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <div className="flex items-center space-x-2 mb-2">
                                <span className={`px-3 py-1 rounded-full text-xs font-semibold uppercase ${colors.badge}`}>
                                  {cls.subject}
                                </span>
                                <span className="text-xs text-gray-500">
                                  {new Date(cls.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                </span>
                              </div>
                              <h4 className="text-lg font-bold text-gray-900">{cls.title}</h4>
                              <p className="text-sm text-gray-600 mt-1 line-clamp-2">{cls.description}</p>
                            </div>
                            <button className="text-gray-400 hover:text-gray-600">
                              <MoreVertical className="w-5 h-5" />
                            </button>
                          </div>

                          <div className="flex items-center space-x-6 text-sm text-gray-600 mt-3">
                            <div className="flex items-center space-x-1">
                              <Users className="w-4 h-4" />
                              <span>{enrollmentCounts[cls.id] || 0} Students</span>
                            </div>
                            {cls.schedule && (
                              <div className="flex items-center space-x-1">
                                <Clock className="w-4 h-4" />
                                <span>{cls.schedule}</span>
                              </div>
                            )}
                            <div className="flex items-center space-x-1">
                              <span className={`px-2 py-1 rounded text-xs font-medium ${cls.is_active
                                  ? 'bg-emerald-50 text-emerald-700'
                                  : 'bg-gray-100 text-gray-600'
                                }`}>
                                {cls.is_active ? 'Active' : 'Paused'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-sm p-6 sticky top-6">
            <div className="flex items-center space-x-2 mb-6">
              <div className="w-8 h-8 bg-teal-100 rounded-full flex items-center justify-center">
                <Plus className="w-4 h-4 text-teal-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Create New Class</h3>
                <p className="text-xs text-gray-500">Setup a new course for students</p>
              </div>
            </div>

            <form onSubmit={handleCreateClass} className="space-y-4 max-h-[calc(100vh-200px)] overflow-y-auto pr-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Class Name
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm"
                  placeholder="e.g. 2027 Biology Theory"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Subject
                </label>
                <input
                  type="text"
                  required
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm"
                  placeholder="e.g. Biology"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm resize-none"
                  placeholder="Briefly describe the curriculum..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Schedule
                </label>
                <input
                  type="text"
                  value={formData.schedule}
                  onChange={(e) => setFormData({ ...formData, schedule: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm"
                  placeholder="e.g. Mon, Wed 6:00 PM"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Zoom Link
                </label>
                <div className="relative">
                  <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  <input
                    type="url"
                    value={formData.zoom_link}
                    onChange={(e) => setFormData({ ...formData, zoom_link: e.target.value })}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm"
                    placeholder="https://zoom.us/j/..."
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Course Materials (PDF/Zip)
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-teal-400 transition">
                  <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <button
                    type="button"
                    className="text-teal-600 text-sm font-medium hover:underline"
                  >
                    click to upload
                  </button>
                  <span className="text-xs text-gray-500"> or drag and drop</span>
                </div>
              </div>

              <div>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={formData.is_free}
                    onChange={(e) => setFormData({ ...formData, is_free: e.target.checked })}
                    className="w-4 h-4 text-teal-600 border-gray-300 rounded focus:ring-teal-500"
                  />
                  <span className="text-sm text-gray-700">Free Class</span>
                </label>

                {!formData.is_free && (
                  <div className="mt-3">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Price (LKR)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm"
                      placeholder="0"
                    />
                  </div>
                )}
              </div>

              {!formData.is_free && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex space-x-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-800">
                    <span className="font-semibold">Access Control:</span> Students must purchase this class to access the Zoom link and downloaded materials.
                  </p>
                </div>
              )}

              <button
                type="submit"
                className="w-full bg-teal-600 text-white py-3 rounded-lg hover:bg-teal-700 transition flex items-center justify-center space-x-2 font-medium"
              >
                <Check className="w-5 h-5" />
                <span>Publish Class</span>
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
