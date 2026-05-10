import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Package, Play, FileText, Lock, Search, Filter, X } from 'lucide-react';
import { StudentStudyPacksApi } from '../../api';
import type { StudyPack, VideoLesson } from '../../api';

function getYoutubeId(url: string) {
  const match = url.match(/(?:youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]{11})/);
  return match ? match[1] : null;
}

function getYoutubeThumbnail(url: string) {
  const id = getYoutubeId(url);
  return id ? `https://img.youtube.com/vi/${id}/mqdefault.jpg` : null;
}

export default function StudentStudyPacks() {
  const [purchased, setPurchased] = useState<StudyPack[]>([]);
  const [available, setAvailable] = useState<StudyPack[]>([]);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState<string | null>(null);
  const [activeVideo, setActiveVideo] = useState<string | null>(null);
  const [selectedPack, setSelectedPack] = useState<StudyPack | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'free' | 'paid' | 'purchased'>('all');

  useEffect(() => { fetchPacks(); }, []);

  async function fetchPacks() {
    try {
      setLoading(true);
      const data = await StudentStudyPacksApi.getStudentPacks();
      setPurchased(data.purchased);
      setAvailable(data.available);
    } catch { toast.error('Failed to load study packs'); }
    finally { setLoading(false); }
  }

  async function handlePurchase(pack: StudyPack) {
    setPurchasing(pack.id);
    try {
      await StudentStudyPacksApi.purchasePack(pack.id);
      setAvailable(prev => prev.filter(p => p.id !== pack.id));
      setPurchased(prev => [...prev, pack]);
      toast.success(`Enrolled in "${pack.title}"`);
    } catch (err: any) {
      toast.error(err.message || 'Failed to enroll');
    } finally { setPurchasing(null); }
  }

  const allPacks = [
    ...purchased.map(p => ({ ...p, _owned: true })),
    ...available.map(p => ({ ...p, _owned: false })),
  ] as (StudyPack & { _owned: boolean })[];

  const filtered = allPacks.filter(pack => {
    const q = searchQuery.toLowerCase();
    const matchesSearch = pack.title.toLowerCase().includes(q) || pack.subject.toLowerCase().includes(q);
    if (filterType === 'free') return matchesSearch && pack.is_free;
    if (filterType === 'paid') return matchesSearch && !pack.is_free;
    if (filterType === 'purchased') return matchesSearch && pack._owned;
    return matchesSearch;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#eb1b23]" />
      </div>
    );
  }

  return (
    <div className="h-full min-h-0 overflow-y-auto p-4 sm:p-6 lg:p-8">
      <div className="mb-6">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">Study Packs</h2>
        <p className="text-gray-500 mt-1 text-sm">Browse and access learning materials</p>
      </div>

      {/* Search + Filter */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-6 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search study packs..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#eb1b23]/20 focus:border-[#eb1b23] transition"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-400 flex-shrink-0" />
          <select
            value={filterType}
            onChange={e => setFilterType(e.target.value as 'all' | 'free' | 'paid' | 'purchased')}
            className="px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#eb1b23]/20 focus:border-[#eb1b23] transition bg-white"
          >
            <option value="all">All Packs</option>
            <option value="free">Free Only</option>
            <option value="paid">Paid Only</option>
            <option value="purchased">My Enrolled</option>
          </select>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
          <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No study packs found</h3>
          <p className="text-gray-500 text-sm">Try adjusting your search or filter</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map(pack => {
            const firstYoutube = pack.materials?.find(m => m.youtube_url);
            const thumbnail = firstYoutube ? getYoutubeThumbnail(firstYoutube.youtube_url!) : null;

            return (
              <div
                key={pack.id}
                className="group cursor-pointer"
                onClick={() => {
                  if (pack._owned && firstYoutube?.youtube_url) setActiveVideo(firstYoutube.youtube_url);
                  else if (pack._owned) setSelectedPack(pack);
                }}
              >
                {/* Thumbnail */}
                <div className="relative aspect-video bg-gray-900 overflow-hidden rounded-xl mb-3">
                  {thumbnail ? (
                    <img src={thumbnail} alt={pack.title} className="w-full h-full object-cover group-hover:brightness-75 transition-all duration-300" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#eb1b23]/80 to-[#c41019]/80">
                      <Package className="w-12 h-12 text-white/30" />
                    </div>
                  )}
                  {pack._owned && thumbnail && (
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="w-14 h-14 bg-white/20 backdrop-blur-xl rounded-full flex items-center justify-center border border-white/30">
                        <Play className="w-7 h-7 text-white fill-current" />
                      </div>
                    </div>
                  )}
                  <div className="absolute top-2 left-2">
                    <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider text-white ${pack.is_free ? 'bg-green-600' : pack._owned ? 'bg-[#eb1b23]' : 'bg-gray-700'}`}>
                      {pack.is_free ? 'FREE' : pack._owned ? 'ENROLLED' : 'PAID'}
                    </span>
                  </div>
                  {!pack._owned && !pack.is_free && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                      <Lock className="w-10 h-10 text-white/50" />
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="space-y-1.5">
                  <h3 className="text-sm font-bold text-gray-900 line-clamp-2 group-hover:text-[#eb1b23] transition-colors">{pack.title}</h3>
                  {pack.description && <p className="text-xs text-gray-500 line-clamp-2">{pack.description}</p>}
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-400">{pack.subject}</span>
                    {!pack._owned && !pack.is_free && (
                      <span className="text-xs font-bold text-gray-700">Rs. {Number(pack.price).toLocaleString()}</span>
                    )}
                  </div>
                  {!pack._owned && (
                    <button
                      onClick={e => { e.stopPropagation(); handlePurchase(pack); }}
                      disabled={purchasing === pack.id}
                      className="w-full mt-2 py-2 rounded-xl font-semibold text-sm border border-[#eb1b23] text-[#eb1b23] hover:bg-[#eb1b23] hover:text-white transition-all disabled:opacity-60"
                    >
                      {purchasing === pack.id ? 'Enrolling…' : pack.is_free ? 'Enroll Free' : 'Purchase'}
                    </button>
                  )}
                  {pack._owned && (
                    <button
                      onClick={e => { e.stopPropagation(); setSelectedPack(pack); }}
                      className="w-full mt-2 py-2 rounded-xl font-semibold text-sm bg-gray-100 text-gray-700 hover:bg-gray-200 transition-all"
                    >
                      View Materials
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Video modal */}
      {activeVideo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="relative w-full max-w-4xl bg-black rounded-2xl overflow-hidden shadow-2xl">
            <button
              onClick={() => setActiveVideo(null)}
              className="absolute top-4 right-4 z-10 p-2 bg-black/50 hover:bg-black/80 text-white rounded-full transition"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="aspect-video">
              <iframe
                src={`https://www.youtube.com/embed/${getYoutubeId(activeVideo)}?autoplay=1`}
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                title="Study Session"
              />
            </div>
          </div>
        </div>
      )}

      {/* Materials modal */}
      {selectedPack && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h3 className="font-bold text-gray-900">{selectedPack.title}</h3>
              <button onClick={() => setSelectedPack(null)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="overflow-y-auto flex-1 p-4 space-y-2">
              {(selectedPack.materials ?? []).length === 0 ? (
                <p className="text-sm text-gray-500 py-8 text-center">No materials available yet</p>
              ) : (
                selectedPack.materials!.map((lesson: VideoLesson) => (
                  <div key={lesson.id} className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:bg-gray-50 transition-colors">
                    <div className="w-8 h-8 rounded-lg bg-[#eb1b23]/10 flex items-center justify-center flex-shrink-0">
                      {lesson.youtube_url ? <Play className="w-4 h-4 text-[#eb1b23]" /> : <FileText className="w-4 h-4 text-[#eb1b23]" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{lesson.title}</p>
                      <p className="text-xs text-gray-400">{lesson.duration} · {lesson.size}</p>
                    </div>
                    {lesson.youtube_url && (
                      <a href={lesson.youtube_url} target="_blank" rel="noopener noreferrer" className="text-xs text-[#eb1b23] font-medium hover:underline flex-shrink-0">
                        Watch
                      </a>
                    )}
                    {lesson.url && !lesson.youtube_url && (
                      <a href={lesson.url} target="_blank" rel="noopener noreferrer" className="text-xs text-[#eb1b23] font-medium hover:underline flex-shrink-0">
                        Download
                      </a>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
