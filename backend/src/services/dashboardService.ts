import { DashboardRepository } from '../repositories/DashboardRepository.js';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import * as schema from '../repositories/schema/index.js';

export class DashboardService {
  private dashboardRepo: DashboardRepository;

  constructor(db: PostgresJsDatabase<typeof schema>) {
    this.dashboardRepo = new DashboardRepository(db);
  }

  async getTeacherDashboard(teacherId: string) {
    const stats = await this.dashboardRepo.getTeacherStats(teacherId);
    const onboardingData = await this.dashboardRepo.getTeacherOnboardingTrend(teacherId);

    return {
      stats,
      onboardingData
    };
  }

  async getStudentDashboard(studentId: string) {
    const stats = await this.dashboardRepo.getStudentStats(studentId);
    const performanceData = await this.dashboardRepo.getStudentPerformanceTrend(studentId);

    return {
      stats,
      performanceData
    };
  }
}
