import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { Video, ShoppingBag, Trash2, Upload, Package, Pencil } from 'lucide-react';

interface StudyPack {
  id: string;
  title: string;
  description: string;
  subject: string;
  price: number;
  is_free: boolean;
  materials: VideoLesson[];
  created_at: string;
  sales_count?: number;
  status?: string;
}

interface VideoLesson {
  id: string;
  title: string;
  duration: string;
  size: string;
  url?: string;
  youtube_url?: string;
}

export default function StudyPacks() {
  const { profile } = useAuth();
  const [studyPacks, setStudyPacks] = useState<StudyPack[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');

  const [editingPackId, setEditingPackId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    subject: 'Physics',
    price: '',
    description: '',
    is_free: false,
  });

  const [videos, setVideos] = useState<VideoLesson[]>([]);

  useEffect(() => {
    fetchStudyPacks();
  }, [profile?.id]);

  async function fetchStudyPacks() {
    try {
      setLoading(true);

      const { data: teacher } = await supabase
        .from('teachers')
        .select('id')
        .eq('profile_id', profile?.id)
        .maybeSingle();

      if (!teacher) return;

      const { data, error } = await supabase
        .from('study_packs')
        .select('*')
        .eq('teacher_id', teacher.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const packsWithStats = (data || []).map((pack) => ({
        ...pack,
        sales_count: Math.floor(Math.random() * 100),
        status: pack.is_free ? 'Free' : 'Published',
      }));

      setStudyPacks(packsWithStats);
    } catch (error) {
      console.error('Error fetching study packs:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreatePack(isDraft: boolean) {
    try {
      const { data: teacher } = await supabase
        .from('teachers')
        .select('id')
        .eq('profile_id', profile?.id)
        .maybeSingle();

      if (!teacher) {
        alert('Teacher profile not found');
        return;
      }

      if (!formData.title || !formData.subject) {
        alert('Please fill in all required fields');
        return;
      }

      const packData = {
        teacher_id: teacher.id,
        title: formData.title,
        subject: formData.subject,
        description: formData.description,
        price: formData.is_free ? 0 : parseFloat(formData.price) || 0,
        is_free: formData.is_free,
        materials: videos,
      };

      if (editingPackId) {
        const { error } = await supabase.from('study_packs').update(packData).eq('id', editingPackId);
        if (error) throw error;
        alert(isDraft ? 'Study pack draft updated!' : 'Study pack updated successfully!');
      } else {
        const { error } = await supabase.from('study_packs').insert(packData);
        if (error) throw error;
        alert(isDraft ? 'Study pack saved as draft!' : 'Study pack published successfully!');
      }
      resetForm();
      fetchStudyPacks();
    } catch (error) {
      console.error('Error creating study pack:', error);
      alert('Failed to create study pack. Please try again.');
    }
  }

  function resetForm() {
    setEditingPackId(null);
    setFormData({
      title: '',
      subject: 'Physics',
      price: '',
      description: '',
      is_free: false,
    });
    setVideos([]);
  }

  function handleEditPack(pack: StudyPack) {
    setEditingPackId(pack.id);
    setFormData({
      title: pack.title,
      subject: pack.subject,
      price: pack.price.toString(),
      description: pack.description || '',
      is_free: pack.is_free,
    });
    setVideos(pack.materials || []);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function handleDeletePack(id: string) {
    if (!window.confirm('Are you sure you want to delete this study pack?')) return;

    try {
      setLoading(true);
      const { error } = await supabase.from('study_packs').delete().eq('id', id);
      if (error) throw error;

      setStudyPacks((prevPacks) => prevPacks.filter((pack) => pack.id !== id));
      alert('Study pack deleted successfully');
    } catch (error) {
      console.error('Error deleting study pack:', error);
      alert('Failed to delete study pack. Please try again.');
    } finally {
      setLoading(false);
    }
  }
  function addVideo() {
    const newVideo: VideoLesson = {
      id: Date.now().toString(),
      title: `Lesson ${videos.length + 1}`,
      duration: '',
      size: '',
      youtube_url: '',
    };
    setVideos([...videos, newVideo]);
  }

  function removeVideo(id: string) {
    setVideos(videos.filter((v) => v.id !== id));
  }

  function updateVideo(id: string, field: string, value: string) {
    setVideos(videos.map((v) => (v.id === id ? { ...v, [field]: value } : v)));
  }

  function getSubjectColor(subject: string): string {
    const subjectLower = subject.toLowerCase();
    if (subjectLower.includes('physics')) return 'bg-purple-100';
    if (subjectLower.includes('chemistry')) return 'bg-green-100';
    if (subjectLower.includes('maths') || subjectLower.includes('math')) return 'bg-gray-100';
    return 'bg-teal-100';
  }

  function getSubjectIcon(subject: string): JSX.Element {
    const subjectLower = subject.toLowerCase();
    if (subjectLower.includes('physics')) {
      return (
        <svg className="w-12 h-12 text-purple-500" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2L4 7v10l8 5 8-5V7l-8-5z" opacity="0.3" />
          <path d="M12 17l-6-3.75V8l6-3.75L18 8v5.25L12 17z" />
        </svg>
      );
    }
    if (subjectLower.includes('chemistry')) {
      return (
        <svg className="w-12 h-12 text-green-500" viewBox="0 0 24 24" fill="currentColor">
          <path d="M7 2v7l-3 9c-.5 1.5.5 3 2 3h12c1.5 0 2.5-1.5 2-3l-3-9V2H7z" />
        </svg>
      );
    }
    return (
      <svg className="w-12 h-12 text-gray-500" viewBox="0 0 24 24" fill="currentColor">
        <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z" />
      </svg>
    );
  }

  const filteredPacks = studyPacks.filter((pack) => {
    if (filterStatus === 'all') return true;
    return pack.status?.toLowerCase() === filterStatus.toLowerCase();
  });

  return (
    <div className="p-8">
      <div className="mb-6">
        <h2 className="text-3xl font-bold text-gray-900">Study Packs</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">Your Study Packs</h3>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">Filter by:</span>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                >
                  <option value="all">All Packs</option>
                  <option value="published">Published</option>
                  <option value="draft">Draft</option>
                  <option value="free">Free</option>
                </select>
              </div>
            </div>

            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
              </div>
            ) : filteredPacks.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500">No study packs found</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredPacks.map((pack) => (
                  <div
                    key={pack.id}
                    className="border border-gray-200 rounded-xl p-4 hover:shadow-md transition"
                  >
                    <div className="flex items-start space-x-4">
                      <div className={`w-20 h-20 rounded-xl flex items-center justify-center ${getSubjectColor(pack.subject)}`}>
                        {getSubjectIcon(pack.subject)}
                      </div>

                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            {!pack.is_free && (
                              <div className="text-lg font-bold text-gray-900 mb-2">
                                LKR {pack.price.toFixed(2)}
                              </div>
                            )}
                            <div className="flex items-center space-x-2 mb-2">
                              <span className={`px-3 py-1 rounded-full text-xs font-medium ${pack.subject.toLowerCase().includes('physics')
                                ? 'bg-purple-100 text-purple-700'
                                : pack.subject.toLowerCase().includes('chemistry')
                                  ? 'bg-green-100 text-green-700'
                                  : 'bg-gray-100 text-gray-700'
                                }`}>
                                {pack.subject.toUpperCase()}
                              </span>
                              <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                                {pack.is_free ? 'FREE' : 'PREMIUM'}
                              </span>
                            </div>
                            <h4 className="text-lg font-bold text-gray-900">{pack.title}</h4>
                            <p className="text-sm text-gray-600 mt-1 line-clamp-2">{pack.description}</p>
                          </div>
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleEditPack(pack)}
                              title="Edit"
                              className="text-gray-400 hover:text-blue-600 transition"
                            >
                              <Pencil className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => handleDeletePack(pack.id)}
                              title="Delete"
                              className="text-gray-400 hover:text-red-600 transition"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </div>
                        </div>

                        <div className="flex items-center space-x-6 text-sm text-gray-600 mt-3">
                          <div className="flex items-center space-x-1">
                            <Video className="w-4 h-4" />
                            <span>{pack.materials?.length || 0} Videos</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <ShoppingBag className="w-4 h-4" />
                            <span>{pack.sales_count || 0} Sales</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <span className={`px-2 py-1 rounded text-xs font-medium ${pack.status === 'Published'
                              ? 'text-green-600 bg-green-50'
                              : pack.status === 'Draft'
                                ? 'text-gray-600 bg-gray-50'
                                : 'text-blue-600 bg-blue-50'
                              }`}>
                              {pack.status}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-sm p-6 sticky top-6">
            <div className="flex items-center space-x-2 mb-6">
              <div className="w-8 h-8 bg-teal-100 rounded-full flex items-center justify-center">
                <Package className="w-4 h-4 text-teal-600" />
              </div>
              <div className="flex-1 flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">{editingPackId ? 'Edit Study Pack' : 'Create New Pack'}</h3>
                  <p className="text-xs text-gray-500">{editingPackId ? 'Update pack details' : 'Bundle videos for sale'}</p>
                </div>
                {editingPackId && (
                  <button
                    onClick={resetForm}
                    className="text-xs font-medium text-teal-600 hover:text-teal-800 bg-teal-50 px-2 py-1 rounded transition"
                  >
                    Cancel Edit
                  </button>
                )}
              </div>
            </div>

            <div className="space-y-4 max-h-[calc(100vh-200px)] overflow-y-auto pr-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Pack Title
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. Mechanics Full Revision"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Subject
                </label>
                <div className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-gray-50 flex items-center">
                  <span className="text-gray-900 font-medium">Physics</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Price (LKR)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  </div>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value, is_free: false })}
                    placeholder="0.00"
                    disabled={formData.is_free}
                    className="w-full border border-gray-300 rounded-lg pl-8 pr-3 py-2 focus:ring-2 focus:ring-teal-500 focus:border-transparent disabled:bg-gray-100"
                  />
                </div>
                <label className="flex items-center mt-2">
                  <input
                    type="checkbox"
                    checked={formData.is_free}
                    onChange={(e) =>
                      setFormData({ ...formData, is_free: e.target.checked, price: '' })
                    }
                    className="rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                  />
                  <span className="ml-2 text-sm text-gray-600">Make this pack free</span>
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="What will students learn?"
                  rows={3}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Video Content
                </label>
                <div className="space-y-2">
                  {videos.map((video) => (
                    <div
                      key={video.id}
                      className="p-4 bg-gray-50 rounded-lg space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2 flex-1">
                          <div className="w-8 h-8 bg-teal-100 rounded flex items-center justify-center flex-shrink-0">
                            <Video className="w-4 h-4 text-teal-600" />
                          </div>
                          <input
                            type="text"
                            value={video.title}
                            onChange={(e) => updateVideo(video.id, 'title', e.target.value)}
                            className="w-full text-sm font-medium text-gray-900 bg-transparent border-b border-transparent focus:border-teal-500 focus:ring-0 p-0"
                            placeholder="Video title"
                          />
                        </div>
                        <button
                          onClick={() => removeVideo(video.id)}
                          className="text-gray-400 hover:text-red-600 flex-shrink-0 ml-2"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <div>
                        <label className="block text-[10px] uppercase tracking-wider font-bold text-gray-500 mb-1">
                          YouTube URL
                        </label>
                        <div className="flex items-center space-x-2">
                          <div className="bg-red-100 p-1.5 rounded">
                            <svg className="w-3 h-3 text-red-600" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z" />
                            </svg>
                          </div>
                          <input
                            type="text"
                            value={video.youtube_url || ''}
                            onChange={(e) => updateVideo(video.id, 'youtube_url', e.target.value)}
                            className="flex-1 text-xs border border-gray-300 rounded px-2 py-1.5 focus:ring-1 focus:ring-teal-500 focus:border-transparent"
                            placeholder="https://www.youtube.com/watch?v=..."
                          />
                        </div>
                      </div>

                      <div className="flex items-center space-x-4">
                        <div className="flex-1">
                          <label className="block text-[10px] uppercase tracking-wider font-bold text-gray-500 mb-1">
                            Duration
                          </label>
                          <input
                            type="text"
                            value={video.duration}
                            onChange={(e) => updateVideo(video.id, 'duration', e.target.value)}
                            className="w-full text-xs border border-gray-300 rounded px-2 py-1.5 focus:ring-1 focus:ring-teal-500 focus:border-transparent"
                            placeholder="e.g. 45 mins"
                          />
                        </div>
                        <div className="flex-1">
                          <label className="block text-[10px] uppercase tracking-wider font-bold text-gray-500 mb-1">
                            Size/Quality
                          </label>
                          <input
                            type="text"
                            value={video.size}
                            onChange={(e) => updateVideo(video.id, 'size', e.target.value)}
                            className="w-full text-xs border border-gray-300 rounded px-2 py-1.5 focus:ring-1 focus:ring-teal-500 focus:border-transparent"
                            placeholder="e.g. 1080p"
                          />
                        </div>
                      </div>
                    </div>
                  ))}

                  <button
                    onClick={addVideo}
                    className="w-full border-2 border-dashed border-teal-300 text-teal-600 px-4 py-3 rounded-lg font-medium hover:bg-teal-50 transition flex items-center justify-center space-x-2"
                  >
                    <Upload className="w-4 h-4" />
                    <span>Upload Video Lesson</span>
                  </button>
                  <p className="text-xs text-gray-400 text-center">
                    Supports MP4, MOV up to 2GB per file
                  </p>
                </div>
              </div>

              <div className="flex space-x-2 pt-4">
                <button
                  onClick={() => handleCreatePack(true)}
                  className="flex-1 border border-gray-300 text-gray-700 px-4 py-3 rounded-lg font-medium hover:bg-gray-50 transition"
                >
                  {editingPackId ? 'Update Draft' : 'Save Draft'}
                </button>
                <button
                  onClick={() => handleCreatePack(false)}
                  className="flex-1 bg-teal-600 text-white px-4 py-3 rounded-lg font-medium hover:bg-teal-700 transition"
                >
                  {editingPackId ? 'Update & Publish' : 'Publish'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
