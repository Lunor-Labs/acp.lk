import React, { useState } from 'react';
import { useAuth, CENTER_LABELS, PendingRegisterData } from '../../../contexts/AuthContext';
import { ClassCenter } from '../../../repositories';
import { Copy, CheckCircle, Eye, EyeOff } from 'lucide-react';

interface Props {
  onSwitchToLogin: () => void;
  onRegisterSuccess?: () => void;
}

const AL_YEARS = [2026, 2027, 2028];
const CENTERS: ClassCenter[] = ['online', 'riochem', 'vision'];

type Step = 'form' | 'otp' | 'done';

const RegisterForm: React.FC<Props> = ({ onSwitchToLogin, onRegisterSuccess }) => {
  // ─── Form fields ─────────────────────────────────────────────────────────
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [alYear, setAlYear] = useState<number>(2026);
  const [center, setCenter] = useState<ClassCenter>('online');
  const [nic, setNic] = useState('');
  const [whatsappNo, setWhatsappNo] = useState('');
  const [mobileNo, setMobileNo] = useState('');

  // ─── OTP step ────────────────────────────────────────────────────────────
  const [otp, setOtp] = useState('');
  const [pendingData, setPendingData] = useState<PendingRegisterData | null>(null);
  const [previewStudentId, setPreviewStudentId] = useState<string>('');

  // ─── UI state ────────────────────────────────────────────────────────────
  const [step, setStep] = useState<Step>('form');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [finalStudentId, setFinalStudentId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const { requestSignUpOtp, verifySignUpOtp } = useAuth();

  // ─── Step 1: Send OTP ─────────────────────────────────────────────────
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!firstName || !lastName) {
      setError('Please enter your first and last name');
      return;
    }
    if (!email) {
      setError('Please enter your email address');
      return;
    }
    if (!nic) {
      setError('Please enter your NIC');
      return;
    }
    if (!mobileNo) {
      setError('Please enter your mobile number');
      return;
    }
    if (!whatsappNo) {
      setError('Please enter your WhatsApp mobile number');
      return;
    }
    if (!password || password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    if (password !== confirmPw) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const pending: Omit<PendingRegisterData, 'studentId'> = {
        fullName: `${firstName} ${lastName}`,
        role: 'student',
        alYear,
        center,
        nic,
        whatsappNo,
        mobileNo,
        password,
      };

      const { studentId } = await requestSignUpOtp(email.trim(), pending);
      setPreviewStudentId(studentId);

      setPendingData({ ...pending, studentId });
      setStep('otp');
    } catch (err: any) {
      setError(err.message || 'Failed to send verification code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ─── Step 2: Verify OTP ───────────────────────────────────────────────
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp.trim() || otp.trim().length < 6) {
      setError('Please enter the verification code from your email');
      return;
    }
    if (!pendingData) return;

    setLoading(true);
    setError(null);
    try {
      const result = await verifySignUpOtp(email.trim(), otp.trim(), pendingData);
      setFinalStudentId(result.studentId);
      setStep('done');
    } catch (err: any) {
      setError(err.message || 'Invalid or expired code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (finalStudentId) {
      navigator.clipboard.writeText(finalStudentId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // ─── Done screen ──────────────────────────────────────────────────────
  if (step === 'done' && finalStudentId) {
    return (
      <div className="text-center">
        <div className="flex justify-center mb-4">
          <div className="bg-green-100 p-3 rounded-full">
            <CheckCircle className="w-8 h-8 text-green-500" />
          </div>
        </div>

        <h3 className="text-xl font-bold text-gray-800 mb-2">Account Created!</h3>
        <p className="text-sm text-gray-600 mb-4">
          You're all set! Save your Student ID — you'll use it together with your password to log in.
        </p>

        <div className="id-display-card">
          <p className="id-label">YOUR STUDENT ID</p>
          <div className="id-value-container">
            <span className="id-value">{finalStudentId}</span>
            <button type="button" onClick={handleCopy} className="copy-btn" title="Copy to clipboard">
              <Copy className="w-5 h-5" />
            </button>
          </div>
          {copied && <p className="text-xs text-green-600 mt-1">Copied to clipboard!</p>}
        </div>

        <div className="warning-box">
          <strong>Important:</strong> Save your Student ID — you will need it along with your password every time you log in.
        </div>

        <button onClick={onSwitchToLogin} className="btn-submit w-full">
          Go to Login
        </button>
      </div>
    );
  }

  // ─── OTP step ─────────────────────────────────────────────────────────
  if (step === 'otp') {
    return (
      <div>
        <form onSubmit={handleVerifyOtp} className="auth-form">
          <div className="otp-sent-banner">
            <span className="otp-sent-icon">📬</span>
            <div>
              <div className="otp-sent-title">Check your email</div>
              <div className="otp-sent-email">{email}</div>
            </div>
          </div>

          {/* Show the pre-generated student ID */}
          {previewStudentId && (
            <div className="info-box" style={{ textAlign: 'center' }}>
              🎓 Your Student ID is <strong style={{ fontFamily: 'monospace', fontSize: '1.05em', letterSpacing: '2px' }}>{previewStudentId}</strong> — also shown in the email.
            </div>
          )}

          <div className="form-group">
            <label>Verification Code</label>
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
              Enter the code sent to your email
            </div>
          </div>

          {error && <div className="auth-error">{error}</div>}

          <button className="btn-submit" type="submit" disabled={loading}>
            {loading ? 'Creating account…' : 'Verify & Create Account'}
          </button>

          <button
            type="button"
            className="btn-link text-center w-full mt-2"
            onClick={() => {
              setStep('form');
              setOtp('');
              setError(null);
            }}
            disabled={loading}
          >
            ← Edit my details
          </button>
        </form>

        <div className="auth-footer">
          <span>Already have an account? <button className="link" onClick={onSwitchToLogin}>Login</button></span>
        </div>
      </div>
    );
  }

  // ─── Main form ────────────────────────────────────────────────────────
  return (
    <div>
      <form onSubmit={handleRegister} className="auth-form">
        <div className="form-row">
          <div className="form-group flex-1">
            <label>First Name</label>
            <input
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="First Name"
              required
              disabled={loading}
            />
          </div>
          <div className="form-group flex-1">
            <label>Last Name</label>
            <input
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="Last Name"
              required
              disabled={loading}
            />
          </div>
        </div>

        <div className="form-group">
          <label>Email Address</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your.email@example.com"
            required
            disabled={loading}
          />
        </div>

        <div className="form-group">
          <label>NIC Number</label>
          <input
            value={nic}
            onChange={(e) => setNic(e.target.value)}
            placeholder="National ID Card Number"
            required
            disabled={loading}
          />
        </div>

        <div className="form-row">
          <div className="form-group flex-1">
            <label>Mobile No</label>
            <input
              type="tel"
              value={mobileNo}
              onChange={(e) => setMobileNo(e.target.value.replace(/\D/g, ''))}
              placeholder="0771234567"
              required
              disabled={loading}
            />
          </div>
          <div className="form-group flex-1">
            <label>WhatsApp No</label>
            <input
              type="tel"
              value={whatsappNo}
              onChange={(e) => setWhatsappNo(e.target.value.replace(/\D/g, ''))}
              placeholder="0771234567"
              required
              disabled={loading}
            />
          </div>
        </div>

        {/* ── Password ── */}
        <div className="form-group">
          <label>Password</label>
          <div style={{ position: 'relative' }}>
            <input
              type={showPw ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 6 characters"
              required
              disabled={loading}
              autoComplete="new-password"
              style={{ paddingRight: '44px' }}
            />
            <button
              type="button"
              onClick={() => setShowPw(v => !v)}
              disabled={loading}
              style={{
                position: 'absolute',
                right: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                color: '#94a3b8',
                cursor: 'pointer',
                padding: '4px',
                display: 'flex',
                alignItems: 'center',
              }}
              tabIndex={-1}
            >
              {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        <div className="form-group">
          <label>Confirm Password</label>
          <input
            type={showPw ? 'text' : 'password'}
            value={confirmPw}
            onChange={(e) => setConfirmPw(e.target.value)}
            placeholder="Re-enter your password"
            required
            disabled={loading}
            autoComplete="new-password"
          />
        </div>

        <div className="form-group">
          <label>A/L Year</label>
          <select
            value={alYear}
            onChange={(e) => setAlYear(Number(e.target.value))}
            disabled={loading}
          >
            {AL_YEARS.map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>Class Center</label>
          <div className="center-selector">
            {CENTERS.map(c => (
              <button
                key={c}
                type="button"
                className={`selector-btn ${center === c ? 'active' : ''}`}
                onClick={() => setCenter(c)}
              >
                {CENTER_LABELS[c]}
              </button>
            ))}
          </div>
        </div>

        <div className="info-box">
          📧 A verification code will be sent to your email. Your Student ID will be included in the email too!
        </div>

        {error && <div className="auth-error">{error}</div>}

        <button className="btn-submit" type="submit" disabled={loading}>
          {loading ? 'Sending code…' : 'Send Verification Code'}
        </button>
      </form>

      <div className="auth-footer">
        <span>Already have an account? <button className="link" onClick={onSwitchToLogin}>Login</button></span>
      </div>
    </div>
  );
};

export default RegisterForm;
