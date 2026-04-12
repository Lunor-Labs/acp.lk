import React, { useState } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { Eye, EyeOff } from 'lucide-react';

interface Props {
  onSwitchToRegister: () => void;
  onForgotPassword: () => void;
  onLoginSuccess?: () => void;
}

const LoginForm: React.FC<Props> = ({ onSwitchToRegister, onForgotPassword, onLoginSuccess }) => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { signIn } = useAuth();

  const isStudentId = /^\d{7}$/.test(identifier.trim());

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim()) {
      setError('Please enter your Student ID');
      return;
    }
    if (!password) {
      setError('Please enter your password');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await signIn(identifier.trim(), password);
      onLoginSuccess?.();
    } catch (err: any) {
      setError(err.message || 'Invalid Student ID or password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <form onSubmit={handleSubmit} className="auth-form">
        {/* ── Student ID ── */}
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
              <div className="text-xs text-green-600 font-medium mt-1 ml-2">
                ✓ Student ID detected
              </div>
            )}
          </div>
        </div>

        {/* ── Password ── */}
        <div className="form-group">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <label style={{ marginBottom: 0 }}>Password</label>
            <button
              type="button"
              className="btn-link"
              onClick={onForgotPassword}
              disabled={loading}
              style={{ fontSize: '12px', padding: '0' }}
            >
              Forgot Password?
            </button>
          </div>
          <div style={{ position: 'relative' }}>
            <input
              type={showPw ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
              disabled={loading}
              autoComplete="current-password"
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

        {error && <div className="auth-error">{error}</div>}

        <button className="btn-submit" type="submit" disabled={loading}>
          {loading ? 'Logging in…' : 'Login'}
        </button>
      </form>

      <div className="auth-footer">
        <span>Don't have an account? <button className="link" onClick={onSwitchToRegister}>Register</button></span>
      </div>
    </div>
  );
};

export default LoginForm;
