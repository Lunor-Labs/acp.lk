import type { VercelRequest, VercelResponse } from '@vercel/node';
import { ExamService } from '../../../backend/src/services/examService.js';
import { getDb } from '../../../backend/src/providers/db/drizzle.js';
import { getAuthUser } from '../../_lib/auth.js';
import { sendSuccess, handleError } from '../../_lib/response.js';
import { AppError } from '../../../backend/src/utils/errors.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const user = await getAuthUser(req);
    if (user.role !== 'teacher' && user.role !== 'admin') throw AppError.forbidden();

    if (req.method === 'GET') {
      const exams = await new ExamService(getDb()).listTeacherExams(user.id);
      return sendSuccess(res, exams);
    }

    if (req.method === 'POST') {
      const { type, questions, pdfPath, pdfAnswers, ...examData } = req.body;
      const svc = new ExamService(getDb());
      let result;
      if (type === 'pdf') {
        result = await svc.createExamWithPdf(user.id, examData, pdfPath, pdfAnswers);
      } else if (type === 'manual') {
        result = await svc.createExamWithQuestions(user.id, examData, questions || []);
      } else {
        result = await svc.createExam(user.id, examData);
      }
      return sendSuccess(res, result, 201);
    }

    res.status(405).end();
  } catch (err) {
    handleError(err, res);
  }
}
