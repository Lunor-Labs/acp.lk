import React, { useState } from 'react';
import { useAuth } from '../../../../contexts/AuthContext';
import { Eye, EyeOff } from 'lucide-react';
import { Input } from '../../../../components/ui/Input';
import { Button } from '../../../../components/ui/Button';

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
      setError('Please enter your Student ID or Email');
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
      setError(err.message || 'Invalid credentials. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <form onSubmit={handleSubmit} className="flex flex-col gap-5 pt-2">
        {/* ── Student ID ── */}
        <Input
          label="Student ID or Email"
          type="text"
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}
          placeholder="e.g. 2600001 or student@example.com"
          required
          disabled={loading}
          autoComplete="username"
          autoFocus
        />
        {isStudentId && (
          <p className="text-xs text-green-600 font-medium -mt-3 ml-2">✓ Student ID format detected</p>
        )}

        {/* ── Password ── */}
        <div className="flex flex-col gap-1.5">
          <div className="flex justify-between items-center px-1">
            <label className="text-[13px] font-medium text-gray-700">
              Password
            </label>
            <button
              type="button"
              onClick={onForgotPassword}
              disabled={loading}
              className="text-[12px] font-medium text-primary-600 hover:text-primary-700 hover:underline"
            >
              Forgot Password?
            </button>
          </div>
          <Input
            type={showPw ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password"
            required
            disabled={loading}
            autoComplete="current-password"
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

        {error && (
          <div className="bg-red-50 text-red-600 border border-red-100 p-3 rounded-xl text-sm mt-1">
            {error}
          </div>
        )}

        <Button 
          variant="auth" 
          type="submit" 
          isLoading={loading} 
          className="w-full mt-2 h-12 text-[15px]"
        >
          Login
        </Button>
      </form>

      <div className="text-center mt-6 text-sm text-gray-500">
        <span>Don't have an account? 
          <button 
             className="ml-1.5 font-semibold text-[#eb1b23] hover:underline" 
             onClick={onSwitchToRegister}
          >
             Register
          </button>
        </span>
      </div>
    </div>
  );
};

export default LoginForm;
