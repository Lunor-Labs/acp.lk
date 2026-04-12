import React, { useState } from 'react';
import { useAuth } from '../../../../contexts/AuthContext';
import { ArrowLeft, CheckCircle, Eye, EyeOff } from 'lucide-react';
import { Input } from '../../../../components/ui/Input';
import { Button } from '../../../../components/ui/Button';

interface Props {
  onBack: () => void;
}

type Step = 'identifier' | 'otp' | 'done';

const ForgotPasswordForm: React.FC<Props> = ({ onBack }) => {
  const [identifier, setIdentifier] = useState('');
  const [resolvedEmail, setResolvedEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [showPw, setShowPw] = useState(false);

  const [step, setStep] = useState<Step>('identifier');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { requestPasswordResetOtp, resetPasswordWithOtp } = useAuth();

  const isStudentId = /^\d{7}$/.test(identifier.trim());

  // ─── Step 1: Send OTP ────────────────────────────────────────────────
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim()) {
      setError('Please enter your Student ID or email');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const { email } = await requestPasswordResetOtp(identifier.trim());
      setResolvedEmail(email);
      setStep('otp');
    } catch (err: any) {
      setError(err.message || 'Could not send code. Please check your Student ID.');
    } finally {
      setLoading(false);
    }
  };

  // ─── Step 2: Verify OTP + set new password ───────────────────────────
  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp.trim() || otp.trim().length < 6) {
      setError('Please enter the verification code from your email');
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    if (newPassword !== confirmPw) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await resetPasswordWithOtp(resolvedEmail, otp.trim(), newPassword);
      setStep('done');
    } catch (err: any) {
      setError(err.message || 'Invalid or expired code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ─── Done screen ─────────────────────────────────────────────────────
  if (step === 'done') {
    return (
      <div className="text-center py-6">
        <div className="flex justify-center mb-6">
          <div className="bg-green-100 p-4 rounded-full shadow-sm">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
        </div>
        <h3 className="text-2xl font-bold text-gray-900 mb-2">Password Updated!</h3>
        <p className="text-[15px] text-gray-600 mb-8">
          Your password has been changed. You can now log in with your Student ID and new password.
        </p>
        <Button 
          variant="auth" 
          onClick={onBack} 
          className="w-full h-12 text-[15px]"
        >
          Back to Login
        </Button>
      </div>
    );
  }

  // ─── Step 2: OTP + New Password ──────────────────────────────────────
  if (step === 'otp') {
    return (
      <div className="pt-2">
        <div className="mb-6">
          <button
            onClick={() => { setStep('identifier'); setOtp(''); setError(null); }}
            className="flex items-center text-[13px] font-medium text-gray-500 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-1.5" /> Back
          </button>
        </div>

        <h3 className="text-2xl font-bold text-gray-900 mb-2 text-center">Set New Password</h3>
        <p className="text-[14px] text-gray-500 mb-6 text-center px-4">
          Enter the code sent to your email and choose a new password.
        </p>

        <form onSubmit={handleReset} className="flex flex-col gap-5">
          {/* OTP sent banner */}
          <div className="bg-green-50 border border-green-200 p-4 rounded-xl flex items-start gap-3 mb-2">
            <div className="text-green-600 text-xl flex-shrink-0 mt-0.5">📬</div>
            <div>
              <p className="text-sm font-bold text-green-800">Code sent to</p>
              <p className="text-[13px] text-green-700 font-mono break-all mt-0.5">{resolvedEmail}</p>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-medium text-gray-700 ml-1">Verification Code</label>
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={8}
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
              placeholder="••••••••"
              className="w-full text-center tracking-[0.5em] font-mono text-2xl font-bold rounded-xl border-2 border-gray-200 px-4 py-4 focus:ring-2 focus:ring-[#eb1b23] focus:border-[#eb1b23] transition-all"
              required
              disabled={loading}
              autoFocus
              autoComplete="one-time-code"
            />
            <p className="text-[12px] text-gray-500 ml-1 text-center mt-1">Enter the digits from your email</p>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-medium text-gray-700 ml-1">New Password</label>
            <Input
              type={showPw ? 'text' : 'password'}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="At least 6 characters"
              required
              disabled={loading}
              autoComplete="new-password"
              rightIcon={
                <button
                  type="button"
                  onClick={() => setShowPw(v => !v)}
                  disabled={loading}
                  className="hover:text-gray-600 focus:outline-none"
                  tabIndex={-1}
                >
                  {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              }
            />
          </div>

          <Input
            label="Confirm New Password"
            type={showPw ? 'text' : 'password'}
            value={confirmPw}
            onChange={(e) => setConfirmPw(e.target.value)}
            placeholder="Re-enter new password"
            required
            disabled={loading}
            autoComplete="new-password"
          />

          {error && (
            <div className="bg-red-50 text-red-600 border border-red-100 p-3 rounded-xl text-[13px]">
              {error}
            </div>
          )}

          <Button 
            variant="auth" 
            type="submit" 
            isLoading={loading} 
            className="w-full h-12 text-[15px] mt-2"
          >
            Reset Password
          </Button>
        </form>
      </div>
    );
  }

  // ─── Step 1: Enter Student ID / email ────────────────────────────────
  return (
    <div className="pt-2">
      <div className="mb-6">
        <button
          onClick={onBack}
          className="flex items-center text-[13px] font-medium text-gray-500 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-1.5" /> Back to Login
        </button>
      </div>

      <h3 className="text-2xl font-bold text-gray-900 mb-2 text-center">Reset Password</h3>
      <p className="text-[14px] text-gray-500 mb-6 text-center px-4">
        Enter your identifier and we'll send a code to your registered email.
      </p>

      <form onSubmit={handleSendOtp} className="flex flex-col gap-5">
        <Input
          label="Student ID or Email"
          type="text"
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}
          placeholder="e.g. 2600001 or you@example.com"
          required
          disabled={loading}
          autoFocus
          autoComplete="username"
        />
        {isStudentId && (
          <p className="text-xs text-green-600 font-medium -mt-4 ml-2">✓ Student ID detected</p>
        )}

        <div className="bg-blue-50 border border-blue-100 text-blue-800 p-3.5 rounded-xl text-[13px] shadow-sm">
          <span className="mr-2">📧</span> A verification code will be sent to the email attached to this account.
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 border border-red-100 p-3 rounded-xl text-[13px]">
            {error}
          </div>
        )}

        <Button 
          variant="auth" 
          type="submit" 
          isLoading={loading} 
          className="w-full h-12 text-[15px] mt-2"
        >
          Send Verification Code
        </Button>
      </form>
    </div>
  );
};

export default ForgotPasswordForm;
