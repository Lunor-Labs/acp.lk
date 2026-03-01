import React, { useState } from 'react';
import { useAuth, CENTER_LABELS } from '../../../contexts/AuthContext';
import { ClassCenter } from '../../../repositories';
import { Copy, CheckCircle } from 'lucide-react';

interface Props {
  onSwitchToLogin: () => void;
  onRegisterSuccess?: () => void;
}

const AL_YEARS = [2026, 2027, 2028];
const CENTERS: ClassCenter[] = ['online', 'riochem', 'vision'];

const RegisterForm: React.FC<Props> = ({ onSwitchToLogin, onRegisterSuccess }) => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [alYear, setAlYear] = useState<number>(2026);
  const [center, setCenter] = useState<ClassCenter>('online');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedStudentId, setGeneratedStudentId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const { signUp } = useAuth();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!firstName || !lastName) {
      setError('Please enter your first and last name');
      return;
    }

    if (!email || !password) {
      setError('Please enter email and password');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const fullName = `${firstName} ${lastName}`;
      const result = await signUp(
        email,
        password,
        fullName,
        'student', // Role is now defaulted to student
        alYear,
        center
      );

      if (result.studentId) {
        setGeneratedStudentId(result.studentId);
      } else {
        onRegisterSuccess?.();
      }
    } catch (err: any) {
      setError(err.message || 'Registration failed. Email may already be registered.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (generatedStudentId) {
      navigator.clipboard.writeText(generatedStudentId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (generatedStudentId) {
    return (
      <div className="text-center">
        <div className="flex justify-center mb-4">
          <div className="bg-green-100 p-3 rounded-full">
            <CheckCircle className="w-8 h-8 text-green-500" />
          </div>
        </div>

        <h3 className="text-xl font-bold text-gray-800 mb-2">Account Created!</h3>
        <p className="text-sm text-gray-600 mb-4">
          Check your email to confirm your account. Your Student ID has been sent there too.
        </p>

        <div className="id-display-card">
          <p className="id-label">YOUR STUDENT ID</p>
          <div className="id-value-container">
            <span className="id-value">{generatedStudentId}</span>
            <button type="button" onClick={handleCopy} className="copy-btn" title="Copy to clipboard">
              <Copy className="w-5 h-5" />
            </button>
          </div>
          {copied && <p className="text-xs text-green-600 mt-1">Copied to clipboard!</p>}
        </div>

        <div className="warning-box">
          <strong>Important:</strong> Save this ID. You will need it to log in every time. Your password can be reset via email, but your ID cannot.
        </div>

        <button
          onClick={onSwitchToLogin}
          className="btn-submit w-full"
        >
          Go to Login
        </button>
      </div>
    );
  }

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

        <div className="form-row">
          <div className="form-group flex-1">
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Min 6 characters"
              required
              disabled={loading}
            />
          </div>
          <div className="form-group flex-1">
            <label>Confirm Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm password"
              required
              disabled={loading}
            />
          </div>
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
          📋 A unique Student ID will be generated after registration.
        </div>

        {error && <div className="auth-error">{error}</div>}

        <button
          className="btn-submit"
          type="submit"
          disabled={loading}
        >
          {loading ? 'Registering...' : 'Register'}
        </button>
      </form>

      <div className="auth-footer">
        <span>Already have an account? <button className="link" onClick={onSwitchToLogin}>Login</button></span>
      </div>
    </div>
  );
};

export default RegisterForm;
