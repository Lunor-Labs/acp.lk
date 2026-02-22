import React, { useState } from 'react';
import { useAuth } from '../../../contexts/AuthContext';

interface Props {
  onSwitchToLogin: () => void;
  onRegisterSuccess?: () => void;
}

const RegisterForm: React.FC<Props> = ({ onSwitchToLogin, onRegisterSuccess }) => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
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
      await signUp(email, password, fullName, 'student');
      onRegisterSuccess?.();
    } catch (err: any) {
      setError(err.message || 'Registration failed. Email may already be registered.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <form onSubmit={handleRegister} className="auth-form">
        <label>First Name</label>
        <input
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          placeholder="First Name"
          required
          disabled={loading}
        />

        <label>Last Name</label>
        <input
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
          placeholder="Last Name"
          required
          disabled={loading}
        />

        <label>Email Address</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="your.email@example.com"
          required
          disabled={loading}
        />

        <label>Password</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Create a password (min 6 characters)"
          required
          disabled={loading}
        />

        <label>Confirm Password</label>
        <input
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="Confirm your password"
          required
          disabled={loading}
        />

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
