import React, { useState } from 'react';
import { useAuth } from '../../../contexts/AuthContext';

interface Props {
  onSwitchToRegister: () => void;
  onLoginSuccess?: () => void;
}

const LoginForm: React.FC<Props> = ({ onSwitchToRegister, onLoginSuccess }) => {
  const [identifier, setIdentifier] = useState('');
  const [otp, setOtp] = useState('');
  const [resolvedEmail, setResolvedEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<'identifier' | 'otp'>('identifier');

  const { requestLoginOtp, verifyLoginOtp } = useAuth();

  // ─── Step 1: Send OTP ──────────────────────────────────────────────────
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim()) {
      setError('Please enter your Student ID or email');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const { email } = await requestLoginOtp(identifier.trim());
      setResolvedEmail(email);
      setStep('otp');
    } catch (err: any) {
      setError(err.message || 'Could not send OTP. Please check your Student ID.');
    } finally {
      setLoading(false);
    }
  };

  // ─── Step 2: Verify OTP ────────────────────────────────────────────────
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp.trim() || otp.trim().length < 8) {
      setError('Please enter the 8-digit code from your email');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await verifyLoginOtp(resolvedEmail!, otp.trim());
      onLoginSuccess?.();
    } catch (err: any) {
      setError(err.message || 'Invalid or expired code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const isStudentId = /^\d{7}$/.test(identifier.trim());

  // ─── Step 1 UI ─────────────────────────────────────────────────────────
  if (step === 'identifier') {
    return (
      <div>
        <form onSubmit={handleSendOtp} className="auth-form">
          <div className="form-group">
            <label>Student ID</label>
            <div className="relative">
              <input
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="e.g. 2600001"
                required
                disabled={loading}
                autoComplete="username"
                autoFocus
              />
              {isStudentId && (
                <div className="text-xs text-red-600 font-medium mt-1 ml-2">
                  ✓ Student ID detected
                </div>
              )}
            </div>
          </div>

          <div className="otp-info-box">
            📧 A one-time code will be sent to your registered email address.
          </div>

          {error && <div className="auth-error">{error}</div>}

          <button className="btn-submit" type="submit" disabled={loading}>
            {loading ? 'Sending code...' : 'Send OTP Code'}
          </button>
        </form>

        <div className="auth-footer">
          <span>Don't have an account? <button className="link" onClick={onSwitchToRegister}>Register</button></span>
        </div>
      </div>
    );
  }

  // ─── Step 2 UI ─────────────────────────────────────────────────────────
  return (
    <div>
      <form onSubmit={handleVerifyOtp} className="auth-form">
        <div className="otp-sent-banner">
          <span className="otp-sent-icon">📬</span>
          <div>
            <div className="otp-sent-title">Check your email</div>
            <div className="otp-sent-email">{resolvedEmail}</div>
          </div>
        </div>

        <div className="form-group">
          <label>6-Digit OTP Code</label>
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={8}
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
            placeholder="• • • • • • • •"
            className="otp-input"
            required
            disabled={loading}
            autoFocus
            autoComplete="one-time-code"
          />
          <div className="text-xs text-gray-500 mt-1 ml-1">
            Enter the 8-digit code sent to your email
          </div>
        </div>

        {error && <div className="auth-error">{error}</div>}

        <button className="btn-submit" type="submit" disabled={loading}>
          {loading ? 'Verifying...' : 'Login'}
        </button>

        <button
          type="button"
          className="btn-link text-center w-full mt-2"
          onClick={() => {
            setStep('identifier');
            setOtp('');
            setError(null);
          }}
          disabled={loading}
        >
          ← Use a different Student ID
        </button>
      </form>

      <div className="auth-footer">
        <span>Don't have an account? <button className="link" onClick={onSwitchToRegister}>Register</button></span>
      </div>
    </div>
  );
};

export default LoginForm;
