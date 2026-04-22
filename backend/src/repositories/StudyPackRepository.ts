import { eq, desc } from 'drizzle-orm';
import { BaseRepository } from './BaseRepository.js';
import { studyPacks, type StudyPack, type NewStudyPack } from './schema/studyPacks.js';

export class StudyPackRepository extends BaseRepository<typeof studyPacks> {
  constructor() {
    super(studyPacks);
  }

  async findByTeacherId(teacherId: string): Promise<StudyPack[]> {
    return this.db
      .select()
      .from(studyPacks)
      .where(eq(studyPacks.teacher_id, teacherId))
      .orderBy(desc(studyPacks.created_at));
  }

  async findAllPublishedOrFree(): Promise<StudyPack[]> {
    // Basic logic for now - a real app might have a status column.
    // For now we'll just return all desc.
    return this.db
      .select()
      .from(studyPacks)
      .orderBy(desc(studyPacks.created_at));
  }
}
