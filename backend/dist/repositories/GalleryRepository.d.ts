import { BaseRepository } from './BaseRepository.js';
import { GalleryImage, NewGalleryImage } from './schema/index.js';
import type { DrizzleDb } from '../providers/db/drizzle.js';
export declare class GalleryRepository extends BaseRepository {
    constructor(db: DrizzleDb);
    findById(id: string): Promise<GalleryImage | null>;
    getActiveImages(): Promise<GalleryImage[]>;
    getByTeacherId(teacherId: string): Promise<GalleryImage[]>;
    create(data: NewGalleryImage): Promise<GalleryImage>;
    update(id: string, data: Partial<NewGalleryImage>): Promise<GalleryImage>;
    toggleActive(id: string, isActive: boolean): Promise<void>;
    delete(id: string): Promise<void>;
}
//# sourceMappingURL=GalleryRepository.d.ts.map