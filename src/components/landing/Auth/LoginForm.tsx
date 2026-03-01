import React, { useState } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import ForgotPasswordForm from './ForgotPasswordForm';

interface Props {
  onSwitchToRegister: () => void;
  onLoginSuccess?: () => void;
}

const LoginForm: React.FC<Props> = ({ onSwitchToRegister, onLoginSuccess }) => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showForgot, setShowForgot] = useState(false);

  const { signIn } = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier || !password) {
      setError('Please enter student ID and password');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await signIn(identifier.trim(), password);
      onLoginSuccess?.();
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  if (showForgot) {
    return <ForgotPasswordForm onBack={() => setShowForgot(false)} />;
  }

  const isStudentId = /^\d{2}-\d-\d{5}$/.test(identifier.trim());

  return (
    <div>
      <form onSubmit={handleLogin} className="auth-form">
        <div className="form-group">
          <label>Student ID</label>
          <div className="relative">
            <input
              type="text"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="e.g. 26-0-00001"
              required
              disabled={loading}
              autoComplete="username"
            />
            {isStudentId && (
              <div className="text-xs text-red-600 font-medium mt-1 ml-2">
                ✓ Student ID detected
              </div>
            )}
          </div>
        </div>

        <div className="form-group">
          <label>Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password"
            required
            disabled={loading}
            autoComplete="current-password"
          />
        </div>

        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => setShowForgot(true)}
            className="btn-link"
          >
            Forgot Password?
          </button>
        </div>

        {error && <div className="auth-error">{error}</div>}

        <button
          className="btn-submit"
          type="submit"
          disabled={loading}
        >
          {loading ? 'Logging in...' : 'Login'}
        </button>
      </form>

      <div className="auth-footer">
        <span>Don't have an account? <button className="link" onClick={onSwitchToRegister}>Register</button></span>
      </div>
    </div>
  );
};

export default LoginForm;
