import React, { useState } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import './Auth.css';
import LoginForm from './LoginForm';
import RegisterForm from './RegisterForm';
import ForgotPasswordForm from './ForgotPasswordForm';
import studentBg from '../../../assets/register/student-bg.webp';
import acpLogo from '../../../assets/acp-logo-dark.webp';

interface AuthPanelProps {
  defaultMode?: 'login' | 'register';
  onBackToHome?: () => void;
}

const AuthPanel: React.FC<AuthPanelProps> = ({ defaultMode = 'login', onBackToHome }) => {
  const [mode, setMode] = useState<'login' | 'register' | 'forgot-password'>(defaultMode);
  const { loading: authLoading } = useAuth();

  const handleLoginSuccess = () => {
    // Auth context will handle navigation through the Router component
    console.log('Login successful');
  };

  const handleRegisterSuccess = () => {
    console.log('Registration successful');
    setMode('login');
  };

  return (
    <div className="auth-page">
      {/* Left Side - Image */}
      <div className="auth-left">
        <div className="auth-image-container">
          <img src={studentBg} alt="Student" className="auth-image" />
          <div>
            <h2 className="auth-overlay-title">
              {mode === 'login' ? 'Welcome Back!' : 'Join Our Learning Community'}
            </h2>
            <p className="auth-overlay-subtitle">
              {mode === 'login' ? 'Continue your learning journey' : 'Start your educational journey today'}
            </p>
          </div>
        </div>
      </div>

      {/* Right Side - Auth Form */}
      <div className="auth-right">
        <div className="auth-card">
          <div className="auth-header">
            <button
              onClick={onBackToHome}
              className="back-to-home"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Back to Home
            </button>
          </div>

          <div className="auth-brand">
            <div className="logo flex justify-center w-full">
              <img src={acpLogo} alt="ACP Logo" className="h-16 w-auto object-contain" />
            </div>
          </div>

          <div className="auth-toggle">
            <button onClick={() => setMode('login')} className={mode === 'login' ? 'active' : ''}>Login</button>
            <button onClick={() => setMode('register')} className={mode === 'register' ? 'active' : ''}>Register</button>
          </div>

          <div className="auth-body">
            {authLoading ? (
              <div className="auth-loading">
                <div className="loading-spinner"></div>
                <div>Preparing your dashboard...</div>
                <div className="loading-subtitle">This may take a moment on first login</div>
              </div>
            ) : (
              <>
                {mode === 'login' && (
                  <LoginForm
                    onSwitchToRegister={() => setMode('register')}
                    onForgotPassword={() => setMode('forgot-password')}
                    onLoginSuccess={handleLoginSuccess}
                  />
                )}
                {mode === 'register' && (
                  <RegisterForm
                    onSwitchToLogin={() => setMode('login')}
                    onRegisterSuccess={handleRegisterSuccess}
                  />
                )}
                {mode === 'forgot-password' && (
                  <ForgotPasswordForm onBack={() => setMode('login')} />
                )}
              </>
            )}
          </div>

          <div id="recaptcha-container" />
        </div>
      </div>
    </div>
  );
};

export default AuthPanel;
