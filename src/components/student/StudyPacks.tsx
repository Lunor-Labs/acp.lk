import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { Package, Download, Play, Lock, Check, Filter, Search } from 'lucide-react';

interface StudyPack {
  id: string;
  title: string;
  description: string;
  subject: string;
  price: number;
  is_free: boolean;
  file_urls: string[];
  video_urls: string[];
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

            return (
              <div key={pack.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition">
                <div className="p-6">
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-12 h-12 bg-teal-100 rounded-xl flex items-center justify-center">
                      <Package className="w-6 h-6 text-teal-600" />
                    </div>
                    {pack.is_free ? (
                      <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">
                        FREE
                      </span>
                    ) : purchased ? (
                      <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold flex items-center space-x-1">
                        <Check className="w-3 h-3" />
                        <span>OWNED</span>
                      </span>
                    ) : (
                      <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-semibold">
                        LKR {pack.price}
                      </span>
                    )}
                  </div>

                  <h3 className="text-lg font-bold text-gray-900 mb-2">{pack.title}</h3>
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">{pack.description}</p>

                  <div className="flex items-center space-x-4 text-xs text-gray-500 mb-4">
                    <span className="px-2 py-1 bg-gray-100 rounded">{pack.subject}</span>
                    <span>by {pack.teacher?.profile?.full_name || 'Teacher'}</span>
                  </div>

                  <div className="flex items-center justify-between text-sm text-gray-600 mb-4">
                    {pack.file_urls?.length > 0 && (
                      <div className="flex items-center space-x-1">
                        <Download className="w-4 h-4" />
                        <span>{pack.file_urls.length} files</span>
                      </div>
                    )}
                    {pack.video_urls?.length > 0 && (
                      <div className="flex items-center space-x-1">
                        <Play className="w-4 h-4" />
                        <span>{pack.video_urls.length} videos</span>
                      </div>
                    )}
                  </div>

                  {accessible ? (
                    <div className="space-y-2">
                      {pack.file_urls?.length > 0 && (
                        <button className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition">
                          <Download className="w-4 h-4" />
                          <span>Download Materials</span>
                        </button>
                      )}
                      {pack.video_urls?.length > 0 && (
                        <button className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
                          <Play className="w-4 h-4" />
                          <span>Watch Videos</span>
                        </button>
                      )}
                    </div>
                  ) : (
                    <button
                      onClick={() => handlePurchase(pack)}
                      className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition"
                    >
                      <Lock className="w-4 h-4" />
                      <span>Purchase for LKR {pack.price}</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
