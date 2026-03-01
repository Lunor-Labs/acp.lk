import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { Package, Play, Lock, Check, Filter, Search, Video, X, ChevronRight, FileText } from 'lucide-react';

interface VideoLesson {
  id: string;
  title: string;
  duration: string;
  size: string;
  url?: string;
  youtube_url?: string;
}

interface StudyPack {
  id: string;
  title: string;
  description: string;
  subject: string;
  price: number;
  is_free: boolean;
  file_urls: string[];
  video_urls: string[];
  materials?: VideoLesson[];
  teacher: {
    profile: {
      full_name: string;
    };
  };
  created_at: string;
}

interface Purchase {
  study_pack_id: string;
}

export default function StudyPacks() {
  const { profile } = useAuth();
  const [studyPacks, setStudyPacks] = useState<StudyPack[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'free' | 'paid' | 'purchased'>('all');
  const [activeVideo, setActiveVideo] = useState<string | null>(null);

  const getYoutubeId = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const getYoutubeThumbnail = (url: string) => {
    const id = getYoutubeId(url);
    return id ? `https://img.youtube.com/vi/${id}/mqdefault.jpg` : null;
  };

  useEffect(() => {
    if (profile?.id) {
      loadData();
    }
  }, [profile?.id]);

  const loadData = async () => {
    try {
      setLoading(true);

      const { data: purchasesData } = await supabase
        .from('purchases')
        .select('study_pack_id')
        .eq('student_id', profile?.id);

      setPurchases(purchasesData || []);

      const { data: packsData, error } = await supabase
        .from('study_packs')
        .select(`
          *,
          teacher:teachers(
            profile:profiles(full_name)
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setStudyPacks(packsData || []);
    } catch (error) {
      console.error('Error loading study packs:', error);
    } finally {
      setLoading(false);
    }
  };

  const hasPurchased = (packId: string) => {
    return purchases.some(p => p.study_pack_id === packId);
  };

  const canAccess = (pack: StudyPack) => {
    return pack.is_free || hasPurchased(pack.id);
  };

  const handlePurchase = (pack: StudyPack) => {
    alert(`Payment integration for "${pack.title}" - LKR ${pack.price}`);
  };

  const filteredPacks = studyPacks.filter(pack => {
    const matchesSearch = pack.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pack.subject.toLowerCase().includes(searchQuery.toLowerCase());

    if (filterType === 'all') return matchesSearch;
    if (filterType === 'free') return matchesSearch && pack.is_free;
    if (filterType === 'paid') return matchesSearch && !pack.is_free;
    if (filterType === 'purchased') return matchesSearch && hasPurchased(pack.id);
    return matchesSearch;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-6">
        <h2 className="text-3xl font-bold text-gray-900">Study Packs</h2>
        <p className="text-gray-600 mt-1">Browse and access learning materials</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0 md:space-x-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search study packs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            />
          </div>

          <div className="flex items-center space-x-2">
            <Filter className="w-5 h-5 text-gray-400" />
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as any)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            >
              <option value="all">All Packs</option>
              <option value="free">Free Only</option>
              <option value="paid">Paid Only</option>
              <option value="purchased">My Purchased</option>
            </select>
          </div>
        </div>
      </div>

      {filteredPacks.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center">
          <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No study packs found</h3>
          <p className="text-gray-600">Try adjusting your search or filter</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPacks.map((pack) => {
            const purchased = hasPurchased(pack.id);
            const accessible = canAccess(pack);

            // Extract featured thumbnail from first YouTube lesson
            const firstYoutubeLesson = pack.materials?.find(m => m.youtube_url);
            const featuredThumbnail = firstYoutubeLesson ? getYoutubeThumbnail(firstYoutubeLesson.youtube_url!) : null;

            return (
              <div key={pack.id} className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-xl transition-shadow duration-300 flex flex-col">
                {/* Pack Visual Aspect */}
                <div className="relative aspect-video bg-gray-900 overflow-hidden group">
                  {featuredThumbnail ? (
                    <img
                      src={featuredThumbnail}
                      alt={pack.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-teal-500 to-emerald-600 text-white">
                      <Package className="w-12 h-12 opacity-20 mb-2" />
                      <span className="text-xs font-medium opacity-80">{pack.subject}</span>
                    </div>
                  )}

                  {/* Status Overlay */}
                  <div className="absolute top-3 left-3 flex gap-2">
                    <span className="px-2 py-0.5 bg-black/50 backdrop-blur-md text-white rounded-full text-[9px] font-bold uppercase tracking-wider">
                      {pack.subject}
                    </span>
                    {pack.is_free && (
                      <span className="px-3 py-1 bg-green-500 text-white rounded-full text-[10px] font-bold uppercase tracking-wider">
                        FREE
                      </span>
                    )}
                  </div>

                  {/* Accessible Overlay */}
                  {accessible && (
                    <div
                      onClick={() => firstYoutubeLesson?.youtube_url && setActiveVideo(firstYoutubeLesson.youtube_url)}
                      className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 cursor-pointer z-10"
                    >
                      <div className="w-16 h-16 bg-white/20 backdrop-blur-xl rounded-full flex items-center justify-center border border-white/30 text-white">
                        <Play className="w-8 h-8 fill-current" />
                      </div>
                    </div>
                  )}

                  {!accessible && !pack.is_free && (
                    <div className="absolute top-3 right-3 bg-amber-500 text-white px-2 py-0.5 rounded-full text-[10px] font-bold shadow-lg">
                      LKR {pack.price}
                    </div>
                  )}
                </div>

                <div className="p-5 flex-1 flex flex-col">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 text-xs text-teal-600 font-semibold mb-2">
                      <span>{pack.teacher?.profile?.full_name || 'Teacher'}</span>
                      <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                      <span className="text-gray-500 font-normal">{new Date(pack.created_at).toLocaleDateString()}</span>
                    </div>

                    <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-teal-600 transition-colors">{pack.title}</h3>
                    <p className="text-xs text-gray-600 mb-4 leading-relaxed line-clamp-2">{pack.description}</p>

                    <div className="grid grid-cols-2 gap-3 mb-5">
                      <div className="bg-gray-50 rounded-lg p-2 flex items-center space-x-2 border border-gray-100">
                        <div className="text-gray-400"><FileText className="w-4 h-4" /></div>
                        <div>
                          <p className="text-[8px] text-gray-500 uppercase font-bold tracking-tight">Materials</p>
                          <p className="text-xs font-bold text-gray-900">{pack.file_urls?.length || 0} Files</p>
                        </div>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-2 flex items-center space-x-2 border border-gray-100">
                        <div className="text-gray-400"><Video className="w-4 h-4" /></div>
                        <div>
                          <p className="text-[8px] text-gray-500 uppercase font-bold tracking-tight">Lessons</p>
                          <p className="text-xs font-bold text-gray-900">{(pack.video_urls?.length || 0) + (pack.materials?.length || 0)} Units</p>
                        </div>
                      </div>
                    </div>

                    {accessible ? (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Curriculum</h4>
                          {purchased && (
                            <span className="flex items-center space-x-1 text-[10px] text-green-600 font-bold">
                              <Check className="w-2.5 h-2.5" />
                              <span>ENROLLED</span>
                            </span>
                          )}
                        </div>

                        <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1.5 custom-scrollbar">
                          {pack.materials?.map((lesson, idx) => (
                            <button
                              key={lesson.id}
                              onClick={() => lesson.youtube_url && setActiveVideo(lesson.youtube_url)}
                              className={`w-full group/lesson flex items-center p-2 rounded-lg border transition-all ${lesson.youtube_url
                                ? 'bg-white border-gray-100 hover:border-teal-500 hover:shadow-sm'
                                : 'bg-gray-50 border-transparent cursor-default'
                                }`}
                            >
                              <div className="w-6 h-6 rounded bg-gray-100 group-hover/lesson:bg-teal-50 flex items-center justify-center flex-shrink-0 text-gray-400 group-hover/lesson:text-teal-600 transition-colors">
                                <span className="text-[10px] font-bold">{idx + 1}</span>
                              </div>
                              <div className="ml-3 flex-1 text-left min-w-0">
                                <div className="flex items-center space-x-1.5 min-w-0">
                                  {lesson.youtube_url ? <Video className="w-3 h-3 text-red-500 flex-shrink-0" /> : <FileText className="w-3 h-3 text-teal-500 flex-shrink-0" />}
                                  <p className="text-[11px] font-semibold text-gray-900 truncate">{lesson.title}</p>
                                </div>
                              </div>
                              {lesson.youtube_url && (
                                <ChevronRight className="w-3.5 h-3.5 text-gray-300 group-hover/lesson:text-teal-500 group-hover/lesson:translate-x-0.5 transition-all" />
                              )}
                            </button>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="mt-auto">
                        <div className="bg-amber-50 rounded-lg p-3 border border-amber-100 mb-4">
                          <div className="flex items-center space-x-2">
                            <div className="bg-amber-100 p-1.5 rounded-md"><Lock className="w-4 h-4 text-amber-600" /></div>
                            <div>
                              <p className="text-[10px] font-bold text-amber-800 uppercase tracking-tight">Locked Case</p>
                              <p className="text-[9px] text-amber-600">Purchase to unlock materials.</p>
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => handlePurchase(pack)}
                          className="w-full bg-gray-900 text-white px-6 py-3 rounded-xl font-bold hover:bg-black transition-all transform hover:-translate-y-0.5 hover:shadow-md flex items-center justify-center space-x-2 text-sm"
                        >
                          <span>Purchase Access</span>
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
      {/* Video Modal */}
      {activeVideo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="relative w-full max-w-4xl bg-black rounded-2xl overflow-hidden shadow-2xl">
            <button
              onClick={() => setActiveVideo(null)}
              className="absolute top-4 right-4 z-10 p-2 bg-black/50 hover:bg-black/80 text-white rounded-full transition"
            >
              <X className="w-6 h-6" />
            </button>
            <div className="aspect-video">
              <iframe
                src={`https://www.youtube.com/embed/${getYoutubeId(activeVideo)}?autoplay=1`}
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                title="Study Session"
              ></iframe>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
