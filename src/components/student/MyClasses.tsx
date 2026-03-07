import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../lib/database';
import { payHereService } from '../../lib/payhere';
import {
  Search,
  Filter,
  BookOpen,
  Clock,
  Video,
  FileText,
  Lock,
  CheckCircle,
  X,
  Download,
  Play,
  Calendar,
  User
} from 'lucide-react';

interface Class {
  id: string;
  title: string;
  description: string;
  subject: string;
  schedule: string;
  price: number;
  is_free: boolean;
  status: 'active' | 'completed';
  zoom_link: string;
  next_session_date: string;
  materials: Material[];
  teacher: {
    id: string;
    profile: {
      full_name: string;
    };
  };
  is_enrolled?: boolean;
  payment_status?: 'paid' | 'unpaid';
}

interface Material {
  id: string;
  week: string;
  topic: string;
  type: 'pdf' | 'video';
  url: string;
  name: string;
}

interface Teacher {
  id: string;
  name: string;
}

export default function MyClasses() {
  const { profile } = useAuth();
  const [classes, setClasses] = useState<Class[]>([]);
  const [filteredClasses, setFilteredClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTeacher, setSelectedTeacher] = useState('all');
  const [selectedPrice, setSelectedPrice] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [showMaterials, setShowMaterials] = useState<string | null>(null);
  const [processingPayment, setProcessingPayment] = useState<string | null>(null);

  useEffect(() => {
    fetchClasses();
  }, [profile?.id]);

  useEffect(() => {
    applyFilters();
  }, [classes, searchQuery, selectedTeacher, selectedPrice, selectedStatus]);

  async function fetchClasses() {
    try {
      setLoading(true);

      const { data: allClasses, error } = await db
        .from<any>('classes')
        .select(`
          id,
          title,
          description,
          subject,
          schedule,
          price,
          is_free,
          status,
          zoom_link,
          next_session_date,
          materials,
          teacher:teachers(
            id,
            profile:profiles(
              full_name
            )
          )
        `)
        .eq('is_active', true)
        .order('next_session_date', { ascending: true })
        .execute();

      if (error) throw error;

      const { data: enrollments } = await db
        .from<any>('enrollments')
        .select('class_id')
        .eq('student_id', profile?.id)
        .eq('is_active', true)
        .execute();

      const enrolledClassIds = new Set(enrollments?.map(e => e.class_id) || []);

      const { data: payments } = await db
        .from<any>('class_payments')
        .select('class_id, payment_status')
        .eq('student_id', profile?.id)
        .eq('payment_status', 'completed')
        .execute();

      const paidClassIds = new Set(payments?.map(p => p.class_id) || []);

      const classesWithStatus = allClasses?.map(cls => ({
        ...cls,
        is_enrolled: enrolledClassIds.has(cls.id),
        payment_status: cls.is_free ? 'paid' : (paidClassIds.has(cls.id) ? 'paid' : 'unpaid') as 'paid' | 'unpaid',
      })) || [];

      setClasses(classesWithStatus);

      const uniqueTeachers = Array.from(
        new Map(
          allClasses
            ?.filter(cls => cls.teacher?.profile?.full_name)
            .map(cls => [
              cls.teacher.id,
              { id: cls.teacher.id, name: cls.teacher.profile.full_name }
            ])
        ).values()
      ).sort((a, b) => a.name.localeCompare(b.name));

      setTeachers(uniqueTeachers);
    } catch (error) {
      console.error('Error fetching classes:', error);
    } finally {
      setLoading(false);
    }
  }

  function applyFilters() {
    let filtered = classes.filter(cls => cls.is_enrolled);

    if (searchQuery) {
      filtered = filtered.filter(cls =>
        cls.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cls.subject.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (selectedTeacher !== 'all') {
      filtered = filtered.filter(cls => cls.teacher?.id === selectedTeacher);
    }

    if (selectedPrice === 'free') {
      filtered = filtered.filter(cls => cls.is_free);
    } else if (selectedPrice === 'paid') {
      filtered = filtered.filter(cls => !cls.is_free);
    }

    if (selectedStatus !== 'all') {
      filtered = filtered.filter(cls => cls.status === selectedStatus);
    }

    setFilteredClasses(filtered);
  }

  async function handlePayment(classItem: Class) {
    setProcessingPayment(classItem.id);

    try {
      const { data: dbPaymentData, error: paymentError } = await db
        .from<any>('class_payments')
        .insert({
          student_id: profile?.id,
          class_id: classItem.id,
          amount: classItem.price,
          payment_status: 'pending',
          payment_method: 'payhere',
        })
        .select()
        .execute();

      const payment = dbPaymentData?.[0];

      if (paymentError || !payment) throw paymentError || new Error('Failed to create payment');

      if (!payHereService.isPayHereLoaded()) {
        alert('Payment gateway is loading. Please try again in a moment.');
        setProcessingPayment(null);
        return;
      }

      const nameParts = profile?.full_name?.split(' ') || ['Student'];
      const firstName = nameParts[0] || 'Student';
      const lastName = nameParts.slice(1).join(' ') || '';

      const paymentData = payHereService.createPaymentData({
        orderId: payment.id,
        items: classItem.title,
        amount: classItem.price,
        firstName,
        lastName,
        email: profile?.email || '',
        phone: profile?.phone || '',
        city: 'Colombo',
        country: 'Sri Lanka',
        address: '',
      });

      await payHereService.initiatePayment(paymentData, {
        onCompleted: async (orderId: string) => {
          await db
            .from<any>('class_payments')
            .update({
              payment_status: 'completed',
              payment_reference: orderId,
              paid_at: new Date().toISOString(),
            })
            .eq('id', payment.id)
            .execute();

          await fetchClasses();
          setProcessingPayment(null);
        },
        onDismissed: () => {
          setProcessingPayment(null);
        },
        onError: async (error: any) => {
          console.error('Payment error:', error);
          await db
            .from<any>('class_payments')
            .update({ payment_status: 'failed' })
            .eq('id', payment.id)
            .execute();

          setProcessingPayment(null);
        },
      });
    } catch (error) {
      console.error('Error initiating payment:', error);
      alert('Failed to initiate payment. Please try again.');
      setProcessingPayment(null);
    }
  }

  function formatDate(dateString: string) {
    if (!dateString) return 'Not scheduled';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  const canAccessClass = (classItem: Class) => {
    return classItem.is_free || classItem.payment_status === 'paid';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-green-50">
      <div className="max-w-7xl mx-auto p-6 md:p-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">My Classes</h1>
          <p className="text-gray-600">Manage and access your enrolled classes</p>
        </div>

        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-100 p-6 mb-6 sticky top-6 z-10">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by class name or subject..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-white transition"
              />
            </div>

            <div className="flex flex-wrap gap-3">
              <div className="relative min-w-[160px]">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                <select
                  value={selectedTeacher}
                  onChange={(e) => setSelectedTeacher(e.target.value)}
                  className="w-full pl-9 pr-10 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent appearance-none bg-white cursor-pointer transition"
                >
                  <option value="all">All Teachers</option>
                  {teachers.map(teacher => (
                    <option key={teacher.id} value={teacher.id}>{teacher.name}</option>
                  ))}
                </select>
              </div>

              <div className="relative min-w-[140px]">
                <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                <select
                  value={selectedPrice}
                  onChange={(e) => setSelectedPrice(e.target.value)}
                  className="w-full pl-9 pr-10 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent appearance-none bg-white cursor-pointer transition"
                >
                  <option value="all">All Prices</option>
                  <option value="free">Free</option>
                  <option value="paid">Paid</option>
                </select>
              </div>

              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent appearance-none bg-white cursor-pointer transition min-w-[140px]"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="completed">Completed</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <span className="text-gray-600">Active</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-gray-400"></div>
                <span className="text-gray-600">Completed</span>
              </div>
            </div>
            <span className="text-sm font-medium text-gray-700">
              {filteredClasses.length} {filteredClasses.length === 1 ? 'class' : 'classes'}
            </span>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-96">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#eb1b23] border-t-transparent"></div>
          </div>
        ) : filteredClasses.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm p-16 text-center border border-gray-100">
            <BookOpen className="w-20 h-20 text-gray-300 mx-auto mb-6" />
            <h3 className="text-2xl font-semibold text-gray-900 mb-2">No classes found</h3>
            <p className="text-gray-600">Try adjusting your filters or enroll in more classes</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredClasses.map(cls => (
              <div
                key={cls.id}
                className="bg-white rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden border border-gray-100 group"
              >
                <div className={`h-1.5 ${cls.status === 'active' ? 'bg-gradient-to-r from-green-400 to-green-600' : 'bg-gray-400'}`}></div>

                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="px-3 py-1 bg-teal-50 text-teal-700 text-xs font-semibold rounded-full">
                          {cls.subject}
                        </span>
                        <span className={`px-3 py-1 text-xs font-semibold rounded-full ${cls.status === 'active'
                          ? 'bg-green-50 text-green-700'
                          : 'bg-gray-100 text-gray-600'
                          }`}>
                          {cls.status === 'active' ? 'Active' : 'Completed'}
                        </span>
                      </div>
                    </div>
                    {cls.is_free ? (
                      <span className="px-3 py-1 bg-green-50 text-green-700 text-sm font-bold rounded-full">
                        Free
                      </span>
                    ) : (
                      <span className="px-3 py-1 bg-blue-50 text-blue-700 text-sm font-bold rounded-full">
                        LKR {cls.price}
                      </span>
                    )}
                  </div>

                  <h3 className="text-xl font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-[#eb1b23] transition">
                    {cls.title}
                  </h3>

                  <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                    {cls.description || 'Enhance your knowledge and skills with this comprehensive course'}
                  </p>

                  <div className="space-y-3 mb-6">
                    <div className="flex items-center text-sm text-gray-600">
                      <User className="w-4 h-4 mr-2 text-gray-400" />
                      <span className="font-medium">{cls.teacher?.profile?.full_name || 'Teacher'}</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                      <span>{formatDate(cls.next_session_date)}</span>
                    </div>
                    {cls.schedule && (
                      <div className="flex items-center text-sm text-gray-600">
                        <Clock className="w-4 h-4 mr-2 text-gray-400" />
                        <span>{cls.schedule}</span>
                      </div>
                    )}
                  </div>

                  {!canAccessClass(cls) ? (
                    <div className="space-y-3">
                      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center gap-3">
                        <Lock className="w-5 h-5 text-amber-600 flex-shrink-0" />
                        <p className="text-sm text-amber-800">
                          Complete payment to access class materials and sessions
                        </p>
                      </div>
                      <button
                        onClick={() => handlePayment(cls)}
                        disabled={processingPayment === cls.id}
                        className="w-full px-4 py-3 bg-gradient-to-r from-[#eb1b23] to-red-600 text-white font-semibold rounded-xl hover:from-red-700 hover:to-red-700 transition-all duration-300 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      >
                        {processingPayment === cls.id ? (
                          <>
                            <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                            Processing...
                          </>
                        ) : (
                          <>
                            <CheckCircle className="w-5 h-5" />
                            Pay & Unlock - LKR {cls.price}
                          </>
                        )}
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-3">
                      <a
                        href={cls.zoom_link || '#'}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-semibold transition-all duration-300 ${cls.zoom_link
                          ? 'bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200'
                          : 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200'
                          }`}
                        onClick={(e) => {
                          if (!cls.zoom_link) e.preventDefault();
                        }}
                      >
                        <Video className="w-4 h-4" />
                        Join Zoom
                      </a>
                      <button
                        onClick={() => setShowMaterials(cls.id)}
                        className="flex items-center justify-center gap-2 px-4 py-3 bg-teal-50 text-teal-700 hover:bg-teal-100 rounded-xl font-semibold transition-all duration-300 border border-teal-200"
                      >
                        <FileText className="w-4 h-4" />
                        Materials
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {showMaterials && (
          <MaterialsModal
            classItem={filteredClasses.find(c => c.id === showMaterials)!}
            onClose={() => setShowMaterials(null)}
          />
        )}
      </div>
    </div>
  );
}

function MaterialsModal({ classItem, onClose }: { classItem: Class; onClose: () => void }) {
  const materials = classItem.materials || [];

  const groupedMaterials = materials.reduce((acc, material) => {
    if (!acc[material.week]) {
      acc[material.week] = [];
    }
    acc[material.week].push(material);
    return acc;
  }, {} as Record<string, Material[]>);

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[80vh] overflow-hidden">
        <div className="bg-gradient-to-r from-[#eb1b23] to-red-600 p-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white mb-1">{classItem.title}</h2>
            <p className="text-teal-50">Course Materials</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-lg transition"
          >
            <X className="w-6 h-6 text-white" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(80vh-120px)]">
          {materials.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600">No materials available yet</p>
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(groupedMaterials).map(([week, weekMaterials]) => (
                <div key={week} className="bg-gray-50 rounded-xl p-5 border border-gray-200">
                  <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-[#eb1b23]" />
                    {week}
                  </h3>
                  <div className="space-y-3">
                    {weekMaterials.map((material) => (
                      <div
                        key={material.id}
                        className="bg-white rounded-lg p-4 flex items-center justify-between hover:shadow-md transition group"
                      >
                        <div className="flex items-center gap-3 flex-1">
                          {material.type === 'pdf' ? (
                            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                              <FileText className="w-5 h-5 text-red-600" />
                            </div>
                          ) : (
                            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                              <Play className="w-5 h-5 text-blue-600" />
                            </div>
                          )}
                          <div>
                            <p className="font-semibold text-gray-900 group-hover:text-[#eb1b23] transition">
                              {material.topic}
                            </p>
                            <p className="text-sm text-gray-500 capitalize">{material.type}</p>
                          </div>
                        </div>
                        <a
                          href={material.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 px-4 py-2 bg-[#eb1b23] text-white rounded-lg hover:bg-red-700 transition font-medium"
                        >
                          {material.type === 'pdf' ? (
                            <>
                              <Download className="w-4 h-4" />
                              Download
                            </>
                          ) : (
                            <>
                              <Play className="w-4 h-4" />
                              Watch
                            </>
                          )}
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
