import { getDb } from './src/providers/db/drizzle.js';
import { profiles } from './src/repositories/schema/index.js';
import { DashboardRepository } from './src/repositories/DashboardRepository.js';
import { eq } from 'drizzle-orm';

async function run() {
  const db = getDb();
  // find a student
  const students = await db.select({ id: profiles.id }).from(profiles).where(eq(profiles.role, 'student')).limit(1);
  if (!students.length) { console.log('No student found'); process.exit(0); }
  const studentId = students[0].id;
  
  const repo = new DashboardRepository(db);
  console.log('Fetching stats...');
  try {
    const stats = await repo.getStudentStats(studentId);
    console.log('Stats:', stats);
    const trend = await repo.getStudentPerformanceTrend(studentId);
    console.log('Trend:', trend);
  } catch (err) {
    console.error('ERROR CAUGHT:', err);
  }
  process.exit(0);
}
run();
