import nodemailer from 'nodemailer';
import { env } from '../config/env.js';

const transporter = nodemailer.createTransport({
  host: env.SMTP_HOST,
  port: parseInt(env.SMTP_PORT),
  secure: env.SMTP_PORT === '465',
  auth: {
    user: env.SMTP_USER,
    pass: env.SMTP_PASS,
  },
});

export const EmailService = {

  async sendOtp(email: string, code: string, purpose: 'signup' | 'reset', metadata?: { studentId?: string; fullName?: string }) {
    const subject = purpose === 'signup'
      ? 'Your ACP.lk Registration OTP'
      : 'Your ACP.lk Password Reset OTP';

    const studentIdLine = metadata?.studentId
      ? `<p><strong>Your Student ID:</strong> ${metadata.studentId}</p>`
      : '';

    const greeting = metadata?.fullName
      ? `Hi ${metadata.fullName},`
      : 'Hi,';

    const html = `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2 style="color: #1a1a1a;">ACP.lk</h2>
        <p>${greeting}</p>
        <p>${purpose === 'signup' ? 'Complete your registration using the OTP below.' : 'Use the OTP below to reset your password.'}</p>
        ${studentIdLine}
        <div style="background: #f4f4f4; padding: 24px; border-radius: 8px; text-align: center; margin: 24px 0;">
          <span style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #1a1a1a;">${code}</span>
        </div>
        <p style="color: #666; font-size: 14px;">This OTP expires in 10 minutes. Do not share it with anyone.</p>
      </div>
    `;

    await transporter.sendMail({
      from: env.SMTP_FROM,
      to: email,
      subject,
      html,
    });
  },
};