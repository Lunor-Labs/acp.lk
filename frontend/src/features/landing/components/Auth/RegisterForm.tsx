import React, { useState } from 'react';
import { useAuth, CENTER_LABELS, type PendingRegisterData } from '../../../../contexts/AuthContext';
import { Copy, CheckCircle, Eye, EyeOff } from 'lucide-react';
import { Input } from '../../../../components/ui/Input';
import { Button } from '../../../../components/ui/Button';

interface Props {
  onSwitchToLogin: () => void;
}

const AL_YEARS = [2026, 2027, 2028];
type ClassCenter = 'online' | 'riochem' | 'vision';
const CENTERS: ClassCenter[] = ['online', 'riochem', 'vision'];

type Step = 'form' | 'otp' | 'done';

const RegisterForm: React.FC<Props> = ({ onSwitchToLogin }) => {
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
      <div className="text-center py-6">
        <div className="flex justify-center mb-6">
          <div className="bg-green-100 p-4 rounded-full shadow-sm">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
        </div>

        <h3 className="text-2xl font-bold text-gray-900 mb-2">Account Created!</h3>
        <p className="text-[15px] text-gray-600 mb-6">
          You're all set! Save your Student ID — you'll use it with your password to log in.
        </p>

        <div className="bg-red-50 border-2 border-red-100 rounded-2xl p-6 mb-8 text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-500 to-red-400"></div>
          <p className="text-sm font-bold text-red-800 tracking-wider mb-3">YOUR STUDENT ID</p>
          <div className="flex items-center justify-center gap-4">
            <span className="font-mono text-4xl font-extrabold text-red-700 tracking-[0.2em]">{finalStudentId}</span>
            <button 
              type="button" 
              onClick={handleCopy} 
              className="bg-white hover:bg-gray-50 border border-gray-200 text-gray-600 p-2.5 rounded-xl transition-all shadow-sm focus:ring-2 focus:ring-red-100"
              title="Copy to clipboard"
            >
              <Copy className="w-5 h-5" />
            </button>
          </div>
          {copied && <p className="text-xs text-green-600 font-medium mt-3">✓ Copied to clipboard!</p>}
        </div>

        <Button 
          variant="auth" 
          onClick={onSwitchToLogin} 
          className="w-full h-12 text-[15px]"
        >
          Go to Login
        </Button>
      </div>
    );
  }

  // ─── OTP step ─────────────────────────────────────────────────────────
  if (step === 'otp') {
    return (
      <div className="pt-2">
        <form onSubmit={handleVerifyOtp} className="flex flex-col gap-5">
          <div className="bg-green-50 border border-green-200 p-4 rounded-xl flex items-start gap-3 mb-2">
            <div className="text-green-600 text-xl flex-shrink-0 mt-0.5">🙌</div>
            <div>
              <p className="text-sm font-bold text-green-800">Check your email</p>
              <p className="text-[13px] text-green-700 font-mono break-all mt-0.5">{email}</p>
            </div>
          </div>

          {previewStudentId && (
            <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl text-[13px] text-blue-800 text-center shadow-sm">
              🎓 Your reserved Student ID is <strong className="font-mono text-sm tracking-widest bg-white px-2 py-1 rounded ml-1 border border-blue-200">{previewStudentId}</strong>
            </div>
          )}

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
            <p className="text-[12px] text-gray-500 ml-1 text-center mt-1">Enter the digits sent to your inbox</p>
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
            Verify & Create Account
          </Button>

          <Button
            variant="ghost"
            type="button"
            className="w-full mt-1 text-gray-500"
            onClick={() => {
              setStep('form');
              setOtp('');
              setError(null);
            }}
            disabled={loading}
          >
            ← Back to Edit Details
          </Button>
        </form>

        <div className="text-center mt-6 text-sm text-gray-500">
          <span>Already have an account? 
            <button 
               className="ml-1.5 font-semibold text-[#eb1b23] hover:underline" 
               onClick={onSwitchToLogin}
            >
               Login
            </button>
          </span>
        </div>
      </div>
    );
  }

  // ─── Main form ────────────────────────────────────────────────────────
  return (
    <div className="pt-2">
      <form onSubmit={handleRegister} className="flex flex-col gap-4">
        
        <div className="flex flex-col sm:flex-row gap-4 w-full">
          <Input
            label="First Name"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            placeholder="First Name"
            required
            disabled={loading}
          />
          <Input
            label="Last Name"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            placeholder="Last Name"
            required
            disabled={loading}
          />
        </div>

        <Input
          label="Email Address"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="your.email@example.com"
          required
          disabled={loading}
        />

        <Input
          label="NIC Number"
          value={nic}
          onChange={(e) => setNic(e.target.value)}
          placeholder="e.g. 2005xxxxxxxx"
          required
          disabled={loading}
        />

        <div className="flex flex-col sm:flex-row gap-4 w-full">
          <Input
            label="Mobile No"
            type="tel"
            value={mobileNo}
            onChange={(e) => setMobileNo(e.target.value.replace(/\D/g, ''))}
            placeholder="077xxxxxxx"
            required
            disabled={loading}
          />
          <Input
            label="WhatsApp No"
            type="tel"
            value={whatsappNo}
            onChange={(e) => setWhatsappNo(e.target.value.replace(/\D/g, ''))}
            placeholder="077xxxxxxx"
            required
            disabled={loading}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-[13px] font-medium text-gray-700 ml-1">Password</label>
          <Input
            type={showPw ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
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
          label="Confirm Password"
          type={showPw ? 'text' : 'password'}
          value={confirmPw}
          onChange={(e) => setConfirmPw(e.target.value)}
          placeholder="Re-enter your password"
          required
          disabled={loading}
          autoComplete="new-password"
        />

        <div className="flex flex-col gap-1.5">
          <label className="text-[13px] font-medium text-gray-700 ml-1">A/L Year</label>
          <select
            value={alYear}
            onChange={(e) => setAlYear(Number(e.target.value))}
            disabled={loading}
            className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#eb1b23] focus-visible:border-[#eb1b23] cursor-pointer appearance-none bg-[url('data:image/svg+xml;charset=UTF-8,%3csvg xmlns=%27http://www.w3.org/2000/svg%27 viewBox=%270 0 24 24%27 fill=%27none%27 stroke=%27currentColor%27 stroke-width=%272%27 stroke-linecap=%27round%27 stroke-linejoin=%27round%27%3e%3cpolyline points=%276 9 12 15 18 9%27%3e%3c/polyline%3e%3c/svg%3e')] bg-no-repeat bg-[position:right_1rem_center] bg-[length:1em]"
          >
            {AL_YEARS.map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-[13px] font-medium text-gray-700 ml-1">Class Center</label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {CENTERS.map(c => (
              <button
                key={c}
                type="button"
                className={`py-2.5 px-2 border rounded-xl text-[13px] font-medium transition-all ${
                  center === c 
                    ? 'bg-[#eb1b23] border-[#eb1b23] text-white shadow-md' 
                    : 'bg-white border-gray-200 text-gray-600 hover:border-[#eb1b23] hover:bg-red-50/50'
                }`}
                onClick={() => setCenter(c)}
              >
                {CENTER_LABELS[c]}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-100 text-blue-800 p-3.5 rounded-xl text-[13px] mt-2 shadow-sm">
          <span className="mr-2">📧</span> A verification code will be sent to your email. Your Student ID will be included in the email as well!
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
          className="w-full text-[15px] h-12 mt-2"
        >
          Send Verification Code
        </Button>
      </form>

      <div className="text-center mt-8 text-[14px] text-gray-500">
        <span>Already have an account? 
          <button 
             className="ml-1.5 font-semibold text-[#eb1b23] hover:underline transition-all" 
             onClick={onSwitchToLogin}
          >
             Login
          </button>
        </span>
      </div>
    </div>
  );
};

export default RegisterForm;
