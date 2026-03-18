import React, { useState } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { ArrowLeft, CheckCircle, Eye, EyeOff } from 'lucide-react';

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
            <div className="text-center">
                <div className="flex justify-center mb-4">
                    <div className="bg-green-100 p-3 rounded-full">
                        <CheckCircle className="w-8 h-8 text-green-500" />
                    </div>
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">Password Updated!</h3>
                <p className="text-sm text-gray-600 mb-6">
                    Your password has been changed. You can now log in with your Student ID and new password.
                </p>
                <button onClick={onBack} className="btn-submit w-full">
                    Back to Login
                </button>
            </div>
        );
    }

    // ─── Step 2: OTP + New Password ──────────────────────────────────────
    if (step === 'otp') {
        return (
            <div>
                <div className="auth-header mb-4" style={{ marginBottom: '1rem' }}>
                    <button
                        onClick={() => { setStep('identifier'); setOtp(''); setError(null); }}
                        className="back-to-home"
                        style={{ padding: '0', background: 'none', border: 'none' }}
                    >
                        <ArrowLeft className="w-4 h-4" /> Back
                    </button>
                </div>

                <h3 className="text-xl font-bold text-gray-800 mb-1 text-center">Set New Password</h3>
                <p className="text-sm text-gray-500 mb-4 text-center">Enter the code sent to your email and choose a new password.</p>

                <form onSubmit={handleReset} className="auth-form">
                    {/* OTP sent banner */}
                    <div className="otp-sent-banner">
                        <span className="otp-sent-icon">📬</span>
                        <div>
                            <div className="otp-sent-title">Code sent to</div>
                            <div className="otp-sent-email">{resolvedEmail}</div>
                        </div>
                    </div>

                    {/* Verification Code */}
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
                            Enter the code from your email
                        </div>
                    </div>

                    {/* New Password */}
                    <div className="form-group">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <label style={{ marginBottom: 0 }}>New Password</label>
                            <button
                                type="button"
                                onClick={() => setShowPw(v => !v)}
                                style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}
                                tabIndex={-1}
                            >
                                {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
                                {showPw ? 'Hide' : 'Show'}
                            </button>
                        </div>
                        <input
                            type={showPw ? 'text' : 'password'}
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            placeholder="At least 6 characters"
                            required
                            disabled={loading}
                            autoComplete="new-password"
                        />
                    </div>

                    {/* Confirm Password */}
                    <div className="form-group">
                        <label>Confirm New Password</label>
                        <input
                            type={showPw ? 'text' : 'password'}
                            value={confirmPw}
                            onChange={(e) => setConfirmPw(e.target.value)}
                            placeholder="Re-enter new password"
                            required
                            disabled={loading}
                            autoComplete="new-password"
                        />
                    </div>

                    {error && <div className="auth-error">{error}</div>}

                    <button className="btn-submit" type="submit" disabled={loading}>
                        {loading ? 'Updating password…' : 'Reset Password'}
                    </button>
                </form>
            </div>
        );
    }

    // ─── Step 1: Enter Student ID / email ────────────────────────────────
    return (
        <div>
            <div className="auth-header mb-4" style={{ marginBottom: '1rem' }}>
                <button
                    onClick={onBack}
                    className="back-to-home"
                    style={{ padding: '0', background: 'none', border: 'none' }}
                >
                    <ArrowLeft className="w-4 h-4" /> Back to Login
                </button>
            </div>

            <h3 className="text-xl font-bold text-gray-800 mb-1 text-center">Reset Password</h3>
            <p className="text-sm text-gray-600 mb-4 text-center">
                Enter your Student ID and we'll send a verification code to your registered email.
            </p>

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
                            autoFocus
                            autoComplete="username"
                        />
                        {isStudentId && (
                            <div className="text-xs text-green-600 font-medium mt-1 ml-2">
                                ✓ Student ID detected
                            </div>
                        )}
                    </div>
                </div>

                <div className="otp-info-box">
                    📧 A verification code will be sent to your registered email address.
                </div>

                {error && <div className="auth-error">{error}</div>}

                <button className="btn-submit" type="submit" disabled={loading}>
                    {loading ? 'Sending code…' : 'Send Verification Code'}
                </button>
            </form>
        </div>
    );
};

export default ForgotPasswordForm;
