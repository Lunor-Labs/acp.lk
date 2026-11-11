import { useState, useRef } from 'react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { CENTER_LABELS } from '@/contexts/AuthContext';
import { ProfileApi } from '@/features/teacher/api';
import { FilesApi } from '../../api';
import { getInitials } from '@/lib/utils';
import { Camera, User, Mail, Lock, Save, CreditCard, Building } from 'lucide-react';

export default function StudentProfile() {
  const { user } = useAuth();
  const [fullName, setFullName] = useState(user?.full_name ?? '');
  const [saving, setSaving] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar_url ?? '');
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [changingPassword, setChangingPassword] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    if (!fullName.trim()) { toast.error('Name is required'); return; }
    setSaving(true);
    try {
      await ProfileApi.updateMe({ full_name: fullName, avatar_url: avatarUrl || undefined });
      toast.success('Profile updated');
    } catch { toast.error('Failed to update profile'); }
    finally { setSaving(false); }
  }

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error('Image must be smaller than 5 MB'); return; }
    setUploadingAvatar(true);
    try {
      const path = `avatars/${user?.id}_${Date.now()}${file.name.slice(file.name.lastIndexOf('.'))}`;
      const storagePath = await FilesApi.uploadWithSignedUrl('acp', path, file);
      const url = await FilesApi.getPublicUrl('acp', storagePath);
      setAvatarUrl(url);
      await ProfileApi.updateMe({ avatar_url: url });
      toast.success('Profile photo updated');
    } catch { toast.error('Failed to upload photo'); }
    finally { setUploadingAvatar(false); }
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    if (!passwordForm.currentPassword || !passwordForm.newPassword) { toast.error('All password fields are required'); return; }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) { toast.error('New passwords do not match'); return; }
    if (passwordForm.newPassword.length < 8) { toast.error('New password must be at least 8 characters'); return; }
    setChangingPassword(true);
    try {
      await ProfileApi.changePassword({ currentPassword: passwordForm.currentPassword, newPassword: passwordForm.newPassword });
      toast.success('Password changed successfully');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err: any) { toast.error(err.message || 'Failed to change password'); }
    finally { setChangingPassword(false); }
  }

  const initials = getInitials(fullName || 'S');

  return (
    <div className="h-full min-h-0 overflow-y-auto p-4 sm:p-6 lg:p-8">
      <div className="max-w-2xl mx-auto space-y-6">

        {/* Hero card */}
        <div className="relative rounded-2xl overflow-hidden p-8 flex items-center gap-6" style={{ background: 'linear-gradient(135deg, #1e1e2e 0%, #2d1f3e 100%)' }}>
          <div className="absolute top-0 right-0 w-32 h-32 rounded-full opacity-15 -translate-y-8 translate-x-8" style={{ background: '#eb1b23', filter: 'blur(30px)' }} />
          <div className="absolute bottom-0 left-16 w-20 h-20 rounded-full opacity-15 translate-y-4" style={{ background: '#8b5cf6', filter: 'blur(20px)' }} />

          <div className="relative flex-shrink-0">
            {avatarUrl ? (
              <img src={avatarUrl} alt={fullName} className="w-24 h-24 rounded-full object-cover border-2 border-white/20" />
            ) : (
              <div className="w-24 h-24 rounded-full flex items-center justify-center text-white text-3xl font-bold border-2 border-white/20" style={{ background: 'linear-gradient(135deg, #eb1b23, #c41019)' }}>
                {initials}
              </div>
            )}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingAvatar}
              className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-[#eb1b23] border-2 border-white flex items-center justify-center cursor-pointer shadow-lg disabled:opacity-60"
            >
              <Camera className="w-3.5 h-3.5 text-white" />
            </button>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
          </div>

          <div>
            <h2 className="text-2xl font-extrabold text-white">{user?.full_name}</h2>
            <div className="flex items-center gap-2 mt-1.5">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium text-white/85" style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)' }}>
                Student
              </span>
              {user?.student_id && (
                <span className="text-xs text-white/50">ID: {user.student_id}</span>
              )}
            </div>
          </div>
        </div>

        {/* Personal info */}
        <form onSubmit={handleSaveProfile} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-5">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-4">Account Info</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <ReadOnlyField icon={<Mail className="w-3.5 h-3.5" />} label="Email" value={user?.email ?? ''} />
              {user?.student_id && <ReadOnlyField icon={<CreditCard className="w-3.5 h-3.5" />} label="Student ID" value={user.student_id} />}
              {user?.center && <ReadOnlyField icon={<Building className="w-3.5 h-3.5" />} label="Center" value={CENTER_LABELS[user.center] ?? user.center} />}
            </div>
          </div>
          <div className="border-t border-gray-100 pt-5">
            <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-4">Personal Details</p>
            <FormField icon={<User className="w-3.5 h-3.5" />} label="Full Name *" value={fullName} onChange={setFullName} placeholder="Your full name" />
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving || uploadingAvatar}
              className="flex items-center gap-2 px-8 py-2.5 rounded-xl font-bold text-sm bg-[#eb1b23] text-white hover:bg-red-700 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </form>

        {/* Change password */}
        <form onSubmit={handleChangePassword} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <Lock className="w-4 h-4 text-gray-500" />
            <h2 className="font-semibold text-gray-900">Change Password</h2>
          </div>
          <FormField icon={<Lock className="w-3.5 h-3.5" />} label="Current Password" type="password" value={passwordForm.currentPassword} onChange={v => setPasswordForm(f => ({ ...f, currentPassword: v }))} placeholder="Current password" />
          <FormField icon={<Lock className="w-3.5 h-3.5" />} label="New Password" type="password" value={passwordForm.newPassword} onChange={v => setPasswordForm(f => ({ ...f, newPassword: v }))} placeholder="At least 8 characters" />
          <FormField icon={<Lock className="w-3.5 h-3.5" />} label="Confirm New Password" type="password" value={passwordForm.confirmPassword} onChange={v => setPasswordForm(f => ({ ...f, confirmPassword: v }))} placeholder="Repeat new password" />
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={changingPassword}
              className="flex items-center gap-2 px-8 py-2.5 rounded-xl font-bold text-sm border border-gray-200 text-gray-700 hover:bg-gray-50 transition-all disabled:opacity-60"
            >
              {changingPassword ? 'Changing…' : 'Change Password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function FormField({ icon, label, value, onChange, placeholder, type = 'text' }: {
  icon: React.ReactNode; label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-600 mb-1.5">{label}</label>
      <div className={`flex items-center gap-2 border rounded-xl px-3 py-2.5 bg-white transition-all ${focused ? 'border-[#eb1b23] ring-2 ring-[#eb1b23]/20' : 'border-gray-200'}`}>
        <span className="text-gray-400 flex-shrink-0">{icon}</span>
        <input
          type={type}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          className="flex-1 text-sm text-gray-900 bg-transparent outline-none"
        />
      </div>
    </div>
  );
}

function ReadOnlyField({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-600 mb-1.5">{label}</label>
      <div className="flex items-center gap-2 border border-gray-200 rounded-xl px-3 py-2.5 bg-gray-50">
        <span className="text-gray-400 flex-shrink-0">{icon}</span>
        <span className="text-sm text-gray-500">{value}</span>
      </div>
    </div>
  );
}
