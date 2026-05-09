import { useState } from 'react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { CENTER_LABELS } from '@/contexts/AuthContext';
import { ProfileApi } from '@/features/teacher/api';
import { FilesApi } from '../../api';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getInitials } from '@/lib/utils';
import { Camera, Lock } from 'lucide-react';

export default function StudentProfile() {
  const { user } = useAuth();
  const [fullName, setFullName] = useState(user?.full_name ?? '');
  const [saving, setSaving] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar_url ?? '');
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [changingPassword, setChangingPassword] = useState(false);

  async function handleSaveProfile() {
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

  async function handleChangePassword() {
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

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
        <p className="text-sm text-gray-500 mt-1">View and update your account details</p>
      </div>

      {/* Avatar */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-4">
        <h2 className="font-semibold text-gray-900">Profile Photo</h2>
        <div className="flex items-center gap-5">
          <div className="relative">
            <Avatar className="w-20 h-20">
              <AvatarImage src={avatarUrl || undefined} />
              <AvatarFallback className="bg-primary/10 text-primary text-xl font-bold">
                {getInitials(fullName || 'S')}
              </AvatarFallback>
            </Avatar>
            <label className={`absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-primary flex items-center justify-center cursor-pointer shadow ${uploadingAvatar ? 'opacity-60 pointer-events-none' : ''}`}>
              <Camera className="w-3.5 h-3.5 text-white" />
              <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} disabled={uploadingAvatar} />
            </label>
          </div>
          <div>
            <p className="font-medium text-gray-900">{user?.full_name}</p>
            <p className="text-sm text-gray-500">Student · {user?.student_id}</p>
          </div>
        </div>
      </div>

      {/* Personal Info */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-4">
        <h2 className="font-semibold text-gray-900">Personal Information</h2>
        <Input label="Full Name" value={fullName} onChange={e => setFullName(e.target.value)} />
        <Input label="Email" value={user?.email ?? ''} disabled helperText="Email cannot be changed" />
        <div className="grid grid-cols-2 gap-3">
          <Input label="Student ID" value={user?.student_id ?? '—'} disabled />
          <Input label="Center" value={CENTER_LABELS[user?.center ?? ''] ?? user?.center ?? '—'} disabled />
        </div>
        <div className="flex justify-end">
          <Button onClick={handleSaveProfile} isLoading={saving}>Save Changes</Button>
        </div>
      </div>

      {/* Change Password */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Lock className="w-4 h-4 text-gray-500" />
          <h2 className="font-semibold text-gray-900">Change Password</h2>
        </div>
        <Input label="Current Password" type="password" value={passwordForm.currentPassword} onChange={e => setPasswordForm(f => ({ ...f, currentPassword: e.target.value }))} />
        <Input label="New Password" type="password" value={passwordForm.newPassword} onChange={e => setPasswordForm(f => ({ ...f, newPassword: e.target.value }))} helperText="At least 8 characters" />
        <Input label="Confirm New Password" type="password" value={passwordForm.confirmPassword} onChange={e => setPasswordForm(f => ({ ...f, confirmPassword: e.target.value }))} />
        <div className="flex justify-end">
          <Button onClick={handleChangePassword} isLoading={changingPassword} variant="outline">Change Password</Button>
        </div>
      </div>
    </div>
  );
}
