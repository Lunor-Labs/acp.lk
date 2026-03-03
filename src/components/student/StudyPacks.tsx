import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { Package, Play, Lock, Check, Filter, Search, Video, X, ChevronRight, FileText, Clock } from 'lucide-react';

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

  const getTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + ' year' + (Math.floor(interval) > 1 ? 's' : '') + ' ago';

    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + ' month' + (Math.floor(interval) > 1 ? 's' : '') + ' ago';

    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + ' day' + (Math.floor(interval) > 1 ? 's' : '') + ' ago';

    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + ' hour' + (Math.floor(interval) > 1 ? 's' : '') + ' ago';

    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + ' minute' + (Math.floor(interval) > 1 ? 's' : '') + ' ago';

    return Math.floor(seconds) + ' second' + (Math.floor(seconds) > 1 ? 's' : '') + ' ago';
  };

  const getTotalDuration = (materials?: VideoLesson[]) => {
    if (!materials || materials.length === 0) return null;
    
    let totalMinutes = 0;
    materials.forEach(material => {
      const match = material.duration.match(/(\d+)/);
      if (match) {
        totalMinutes += parseInt(match[1]);
      }
    });

    if (totalMinutes >= 60) {
      const hours = Math.floor(totalMinutes / 60);
      const mins = totalMinutes % 60;
      return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
    }
    return `${totalMinutes}m`;
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
              aria-label="Filter study packs by type"
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
            const totalDuration = getTotalDuration(pack.materials);

            return (
              <div 
                key={pack.id} 
                className="cursor-pointer group"
                onClick={() => {
                  if (accessible && firstYoutubeLesson?.youtube_url) {
                    setActiveVideo(firstYoutubeLesson.youtube_url);
                  }
                }}
              >
                {/* Thumbnail Container - YouTube Style */}
                <div className="relative aspect-video bg-gray-900 overflow-hidden rounded-lg mb-3">
                  {featuredThumbnail ? (
                    <img
                      src={featuredThumbnail}
                      alt={pack.title}
                      className="w-full h-full object-cover group-hover:brightness-75 transition-all duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-teal-500 to-emerald-600 text-white">
                      <Package className="w-12 h-12 opacity-20 mb-2" />
                    </div>
                  )}

                  {/* Play Button Overlay */}
                  {accessible && featuredThumbnail && (
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <div className="w-16 h-16 bg-white/20 backdrop-blur-xl rounded-full flex items-center justify-center border border-white/30 text-white">
                        <Play className="w-8 h-8 fill-current" />
                      </div>
                    </div>
                  )}

                  {/* Free/Paid Tag - Top Left */}
                  <div className="absolute top-2 left-2 z-10">
                    <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider text-white ${
                      pack.is_free 
                        ? 'bg-green-600' 
                        : 'bg-blue-600'
                    }`}>
                      {pack.is_free ? 'FREE' : 'PAID'}
                    </span>
                  </div>

                  {/* Duration Badge - Bottom Right */}
                  {totalDuration && (
                    <div className="absolute bottom-2 right-2 bg-black/70 text-white px-2 py-1 rounded text-[11px] font-bold flex items-center space-x-1">
                      <Clock className="w-3 h-3" />
                      <span>{totalDuration}</span>
                    </div>
                  )}

                  {/* Lock Icon - if not accessible */}
                  {!accessible && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                      <Lock className="w-12 h-12 text-white/50" />
                    </div>
                  )}
                </div>

                {/* Content - YouTube Style */}
                <div className="space-y-2">
                  {/* Title */}
                  <h3 className="text-sm font-bold text-gray-900 line-clamp-2 group-hover:text-teal-600 transition-colors">
                    {pack.title}
                  </h3>

                  {/* Description/Caption */}
                  <p className="text-xs text-gray-600 line-clamp-2">
                    {pack.description}
                  </p>

                  {/* Meta - Teacher and Time Ago */}
                  <div className="text-xs text-gray-500 space-y-0.5">
                    {/* <p className="font-semibold text-gray-700">
                      {pack.teacher?.profile?.full_name || 'Teacher'}
                    </p> */}
                    <p>{getTimeAgo(pack.created_at)}</p>
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
              aria-label="Close video"
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
