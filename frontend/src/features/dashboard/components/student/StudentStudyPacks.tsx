import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Package, Play, FileText, Lock } from 'lucide-react';
import { StudentStudyPacksApi } from '../../api';
import type { StudyPack, VideoLesson } from '../../api';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

export default function StudentStudyPacks() {
  const [purchased, setPurchased] = useState<StudyPack[]>([]);
  const [available, setAvailable] = useState<StudyPack[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPack, setSelectedPack] = useState<StudyPack | null>(null);
  const [purchasing, setPurchasing] = useState<string | null>(null);

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

  function PackCard({ pack, owned }: { pack: StudyPack; owned: boolean }) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 flex flex-col gap-3 hover:shadow-md transition-shadow">
        <div className="flex items-start justify-between gap-2">
          <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Package className="w-5 h-5 text-primary" />
          </div>
          {pack.is_free ? (
            <Badge variant="secondary" className="text-xs">Free</Badge>
          ) : owned ? (
            <Badge className="text-xs bg-green-100 text-green-700 hover:bg-green-100">Enrolled</Badge>
          ) : (
            <Badge variant="outline" className="text-xs">Rs. {Number(pack.price).toLocaleString()}</Badge>
          )}
        </div>
        <div>
          <p className="font-semibold text-gray-900">{pack.title}</p>
          <p className="text-xs text-gray-500 mt-0.5">{pack.subject}</p>
          {pack.description && <p className="text-sm text-gray-600 mt-1 line-clamp-2">{pack.description}</p>}
        </div>
        <p className="text-xs text-gray-400">{pack.materials?.length ?? 0} lesson{pack.materials?.length !== 1 ? 's' : ''}</p>
        {owned ? (
          <Button size="sm" onClick={() => setSelectedPack(pack)} className="w-full">
            View Materials
          </Button>
        ) : (
          <Button
            size="sm"
            variant="outline"
            className="w-full"
            isLoading={purchasing === pack.id}
            onClick={() => handlePurchase(pack)}
          >
            {pack.is_free ? 'Enroll Free' : <><Lock className="w-3 h-3 mr-1" />Purchase</>}
          </Button>
        )}
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-40" />
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-52 rounded-2xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Study Packs</h1>
        <p className="text-sm text-gray-500 mt-1">Access video lessons and study materials</p>
      </div>

      {purchased.length > 0 && (
        <section className="space-y-4">
          <h2 className="font-semibold text-gray-700">My Packs</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {purchased.map(pack => <PackCard key={pack.id} pack={pack} owned />)}
          </div>
        </section>
      )}

      {available.length > 0 && (
        <section className="space-y-4">
          <h2 className="font-semibold text-gray-700">Available Packs</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {available.map(pack => <PackCard key={pack.id} pack={pack} owned={false} />)}
          </div>
        </section>
      )}

      {purchased.length === 0 && available.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
            <Package className="w-8 h-8 text-gray-400" />
          </div>
          <p className="font-medium text-gray-700">No study packs available</p>
          <p className="text-sm text-gray-400 mt-1">Check back later for study materials</p>
        </div>
      )}

      {/* Materials viewer */}
      <Dialog open={selectedPack !== null} onOpenChange={open => { if (!open) setSelectedPack(null); }}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedPack?.title}</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 pt-2">
            {(selectedPack?.materials ?? []).length === 0 ? (
              <p className="text-sm text-gray-500 py-4 text-center">No materials available yet</p>
            ) : (
              (selectedPack?.materials ?? []).map((lesson: VideoLesson) => (
                <div key={lesson.id} className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:bg-gray-50 transition-colors">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    {lesson.youtube_url ? <Play className="w-4 h-4 text-primary" /> : <FileText className="w-4 h-4 text-primary" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{lesson.title}</p>
                    <p className="text-xs text-gray-400">{lesson.duration} · {lesson.size}</p>
                  </div>
                  {lesson.youtube_url && (
                    <a href={lesson.youtube_url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary font-medium hover:underline flex-shrink-0">
                      Watch
                    </a>
                  )}
                  {lesson.url && !lesson.youtube_url && (
                    <a href={lesson.url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary font-medium hover:underline flex-shrink-0">
                      Download
                    </a>
                  )}
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
