import React, { useState } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { ArrowLeft, Mail, CheckCircle } from 'lucide-react';

interface Props {
    onBack: () => void;
}

const ForgotPasswordForm: React.FC<Props> = ({ onBack }) => {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [sent, setSent] = useState(false);

    const { forgotPassword } = useAuth();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email) return;

        setLoading(true);
        setError(null);
        try {
            await forgotPassword(email.trim());
            setSent(true);
        } catch (err: any) {
            setError(err.message || 'Failed to send reset email');
        } finally {
            setLoading(false);
        }
    };

    if (sent) {
        return (
            <div className="text-center">
                <div className="flex justify-center mb-4">
                    <div className="bg-green-100 p-3 rounded-full">
                        <CheckCircle className="w-8 h-8 text-green-500" />
                    </div>
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">Email Sent!</h3>
                <p className="text-sm text-gray-600 mb-6">
                    Check your Gmail for a password-reset link. If you reset it, remember to log in with your <span className="text-red-600 font-semibold">Student ID</span>.
                </p>
                <button
                    onClick={onBack}
                    className="btn-submit w-full"
                >
                    Back to Login
                </button>
            </div>
        );
    }

    return (
        <div>
            <div className="auth-header mb-4" style={{ marginBottom: '1rem' }}>
                <button onClick={onBack} className="back-to-home" style={{ padding: '0', background: 'none', border: 'none' }}>
                    <ArrowLeft className="w-4 h-4" /> Back to Login
                </button>
            </div>

            <h3 className="text-xl font-bold text-gray-800 mb-2 text-center">Reset Password</h3>
            <p className="text-sm text-gray-600 mb-6 text-center">
                Enter your Gmail address to receive a link to set a new password.
            </p>

            <form onSubmit={handleSubmit} className="auth-form">
                <label>Gmail Address</label>
                <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your.email@gmail.com"
                    required
                    disabled={loading}
                    autoFocus
                />

                {error && <div className="auth-error">{error}</div>}

                <button
                    className="btn-submit"
                    type="submit"
                    disabled={loading}
                >
                    {loading ? 'Sending...' : 'Send Reset Link'}
                </button>
            </form>
        </div>
    );
};

export default ForgotPasswordForm;
