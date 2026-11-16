import { StudyPackPurchaseRepository, StudyPackRepository } from '../repositories/index.js';
import { AppError } from '../utils/errors.js';
import { getDb } from '../providers/db/drizzle.js';

class StudentStudyPackService {
  private purchaseRepo: StudyPackPurchaseRepository;
  private packRepo: StudyPackRepository;

  constructor() {
    const db = getDb();
    this.purchaseRepo = new StudyPackPurchaseRepository(db);
    this.packRepo = new StudyPackRepository(db);
  }

  async getStudentPacks(studentId: string) {
    const purchases = await this.purchaseRepo.getByStudentId(studentId);
    const purchasedIds = new Set(purchases.map(p => p.study_pack_id));
    const allPacks = await this.packRepo.findAllPublishedOrFree();

    return {
      purchased: allPacks.filter(p => purchasedIds.has(p.id) || p.is_free),
      // paid packs the student does not own: no lesson links in the response
      available: allPacks
        .filter(p => !purchasedIds.has(p.id) && !p.is_free)
        .map(p => ({ ...p, materials: [] })),
    };
  }

  async purchasePack(studentId: string, packId: string) {
    const pack = await this.packRepo.findById(packId);
    if (!pack) throw AppError.notFound('Study pack not found');

    // Until a payment flow exists, students can only self-enroll in free packs.
    if (!pack.is_free) throw AppError.forbidden('Payment required for this study pack');

    const existing = await this.purchaseRepo.findExisting(studentId, packId);
    if (existing) throw AppError.conflict('Already purchased');
    return this.purchaseRepo.create({
      id: crypto.randomUUID(),
      student_id: studentId,
      study_pack_id: packId,
    });
  }
}

let _instance: StudentStudyPackService;
export function getStudentStudyPackService() {
  if (!_instance) _instance = new StudentStudyPackService();
  return _instance;
}