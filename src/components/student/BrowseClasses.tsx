import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../lib/database';
import { payHereService } from '../../lib/payhere';
import {
  Search,
  Filter,
  BookOpen,
  Clock,
  DollarSign,
  User,
  Plus,
  Loader,
  AlertCircle,
  CheckCircle
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

export default function BrowseClasses() {
  const { profile } = useAuth();
  const [classes, setClasses] = useState<Class[]>([]);
  const [filteredClasses, setFilteredClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTeacher, setSelectedTeacher] = useState('all');
  const [selectedPrice, setSelectedPrice] = useState('all');
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [enrollingClassId, setEnrollingClassId] = useState<string | null>(null);
  const [processingPayment, setProcessingPayment] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    fetchClasses();
  }, [profile?.id]);

  useEffect(() => {
    applyFilters();
  }, [classes, searchQuery, selectedTeacher, selectedPrice]);

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

      const classesWithStatus = allClasses?.map(cls => ({
        ...cls,
        is_enrolled: enrolledClassIds.has(cls.id)
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
      setErrorMessage('Failed to load classes');
    } finally {
      setLoading(false);
    }
  }

  function applyFilters() {
    // Show only non-enrolled classes
    let filtered = classes.filter(cls => !cls.is_enrolled && cls.status === 'active');

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

    setFilteredClasses(filtered);
  }

  async function handleEnrollFree(classItem: Class) {
    setEnrollingClassId(classItem.id);
    try {
      // Directly enroll in free class
      const { error } = await db
        .from<any>('enrollments')
        .insert({
          student_id: profile?.id,
          class_id: classItem.id,
          is_active: true
        })
        .execute();

      if (error) throw error;

      setSuccessMessage(`Successfully enrolled in "${classItem.title}"!`);
      await fetchClasses();
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error) {
      console.error('Error enrolling in class:', error);
      setErrorMessage('Failed to enroll. Please try again.');
      setTimeout(() => setErrorMessage(null), 3000);
    } finally {
      setEnrollingClassId(null);
    }
  }

  async function handleEnrollPaid(classItem: Class) {
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

          // Automatically enroll after successful payment
          await db
            .from<any>('enrollments')
            .insert({
              student_id: profile?.id,
              class_id: classItem.id,
              is_active: true
            })
            .execute();

          setSuccessMessage(`Payment successful! Enrolled in "${classItem.title}"`);
          await fetchClasses();
          setTimeout(() => setSuccessMessage(null), 3000);
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

          setErrorMessage('Payment failed. Please try again.');
          setTimeout(() => setErrorMessage(null), 3000);
          setProcessingPayment(null);
        },
      });
    } catch (error) {
      console.error('Error initiating payment:', error);
      setErrorMessage('Failed to process enrollment. Please try again.');
      setTimeout(() => setErrorMessage(null), 3000);
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-green-50">
      <div className="max-w-7xl mx-auto p-6 md:p-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Browse Classes</h1>
          <p className="text-gray-600">Discover and enroll in new classes</p>
        </div>

        {/* Alert Messages */}
        {successMessage && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <p className="text-green-800">{successMessage}</p>
          </div>
        )}

        {errorMessage && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <p className="text-red-800">{errorMessage}</p>
          </div>
        )}

        {/* Filter Bar */}
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
            </div>
          </div>

          <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
            <span className="text-sm font-medium text-gray-700">
              {filteredClasses.length} {filteredClasses.length === 1 ? 'class available' : 'classes available'}
            </span>
          </div>
        </div>

        {/* Classes Grid */}
        {loading ? (
          <div className="flex items-center justify-center h-96">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#eb1b23] border-t-transparent"></div>
          </div>
        ) : filteredClasses.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm p-16 text-center border border-gray-100">
            <BookOpen className="w-20 h-20 text-gray-300 mx-auto mb-6" />
            <h3 className="text-2xl font-semibold text-gray-900 mb-2">No classes available</h3>
            <p className="text-gray-600">Try adjusting your filters to find more classes</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredClasses.map((classItem) => (
              <div
                key={classItem.id}
                className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1 flex flex-col"
              >
                {/* Header with status */}
                <div className="bg-gradient-to-r from-teal-500 to-green-500 p-4 text-white">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="text-lg font-bold">{classItem.title}</h3>
                    {classItem.is_free && (
                      <span className="bg-white/20 backdrop-blur-sm text-white px-3 py-1 rounded-full text-xs font-semibold">
                        FREE
                      </span>
                    )}
                  </div>
                </div>

                {/* Content */}
                <div className="p-6 flex-1 flex flex-col">
                  {/* Subject */}
                  <p className="text-sm text-gray-500 font-medium mb-3">{classItem.subject}</p>

                  {/* Description */}
                  <p className="text-gray-700 text-sm mb-4 line-clamp-2">{classItem.description}</p>

                  {/* Info Grid */}
                  <div className="space-y-3 mb-4 mt-auto">
                    {/* Teacher */}
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <User className="w-4 h-4 text-teal-600" />
                      <span>{classItem.teacher?.profile?.full_name || 'Unknown'}</span>
                    </div>

                    {/* Schedule */}
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Clock className="w-4 h-4 text-teal-600" />
                      <span>{formatDate(classItem.next_session_date)}</span>
                    </div>

                    {/* Price */}
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <DollarSign className="w-4 h-4 text-teal-600" />
                      <span>
                        {classItem.is_free ? 'Free' : `LKR ${classItem.price.toLocaleString()}`}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Enroll Button */}
                <div className="p-6 pt-4 border-t border-gray-100">
                  <button
                    onClick={() =>
                      classItem.is_free
                        ? handleEnrollFree(classItem)
                        : handleEnrollPaid(classItem)
                    }
                    disabled={enrollingClassId === classItem.id || processingPayment === classItem.id}
                    className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold transition-all duration-200 ${
                      enrollingClassId === classItem.id || processingPayment === classItem.id
                        ? 'bg-gray-100 text-gray-600 cursor-not-allowed'
                        : 'bg-gradient-to-r from-teal-500 to-green-500 text-white hover:shadow-lg hover:-translate-y-1'
                    }`}
                  >
                    {enrollingClassId === classItem.id || processingPayment === classItem.id ? (
                      <>
                        <Loader className="w-4 h-4 animate-spin" />
                        <span>{processingPayment === classItem.id ? 'Processing...' : 'Enrolling...'}</span>
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4" />
                        <span>Enroll Now</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
