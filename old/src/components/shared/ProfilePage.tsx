import { useState, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { Camera, CheckCircle, AlertCircle, Loader, ArrowLeft, User, Phone, MessageCircle, CreditCard, Mail } from 'lucide-react';

interface ProfilePageProps {
  onBack: () => void;
}

export default function ProfilePage({ onBack }: ProfilePageProps) {
  const { profile, updateProfile } = useAuth();

  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [phone, setPhone] = useState(profile?.phone || '');
  const [whatsapp, setWhatsapp] = useState(profile?.whatsapp_no || '');
  const [mobile, setMobile] = useState(profile?.mobile_no || '');
  const [nic, setNic] = useState(profile?.nic || '');

  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be smaller than 5 MB');
      return;
    }
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
    setError(null);
  }

  async function uploadAvatar(): Promise<string | null> {
    if (!avatarFile || !profile?.id) return null;
    setUploading(true);
    try {
      const ext = avatarFile.name.split('.').pop();
      const path = `avatars/${profile.id}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from('acp')
        .upload(path, avatarFile, { upsert: true });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from('acp').getPublicUrl(path);
      // Bust cache by appending a timestamp
      return `${data.publicUrl}?t=${Date.now()}`;
    } catch (err: any) {
      throw new Error(`Avatar upload failed: ${err.message}`);
    } finally {
      setUploading(false);
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!fullName.trim()) {
      setError('Full name is required');
      return;
    }
    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      let avatarUrl = profile?.avatar_url;
      if (avatarFile) {
        avatarUrl = (await uploadAvatar()) ?? avatarUrl;
      }

      await updateProfile({
        full_name: fullName.trim(),
        phone: phone.trim() || undefined,
        whatsapp_no: whatsapp.trim() || undefined,
        mobile_no: mobile.trim() || undefined,
        nic: nic.trim() || undefined,
        ...(avatarUrl ? { avatar_url: avatarUrl } : {}),
      } as any);

      setSuccess(true);
      setAvatarFile(null);
      setAvatarPreview(null);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  }

  const displayAvatar = avatarPreview || profile?.avatar_url;
  const initials = (profile?.full_name || 'U')
    .split(' ')
    .map(n => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const roleLabel =
    profile?.role === 'teacher' ? 'Educator'
    : profile?.role === 'student' ? 'Student'
    : 'Administrator';

  return (
    <div style={{ padding: '32px 24px', maxWidth: 680, margin: '0 auto' }}>

      {/* Back */}
      <button
        onClick={onBack}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          color: '#6b7280',
          fontSize: 14,
          fontWeight: 500,
          marginBottom: 28,
          padding: 0,
        }}
      >
        <ArrowLeft size={16} />
        Back
      </button>

      {/* Header card */}
      <div style={{
        background: 'linear-gradient(135deg, #1e1e2e 0%, #2d1f3e 100%)',
        borderRadius: 20,
        padding: '32px 28px',
        display: 'flex',
        alignItems: 'center',
        gap: 24,
        marginBottom: 24,
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Decorative blobs */}
        <div style={{ position: 'absolute', top: -30, right: -30, width: 120, height: 120, borderRadius: '50%', background: 'rgba(235,27,35,0.15)', filter: 'blur(30px)' }} />
        <div style={{ position: 'absolute', bottom: -20, left: 60, width: 80, height: 80, borderRadius: '50%', background: 'rgba(139,92,246,0.15)', filter: 'blur(20px)' }} />

        {/* Avatar with change button */}
        <div style={{ position: 'relative', flexShrink: 0 }}>
          {displayAvatar ? (
            <img
              src={displayAvatar}
              alt={profile?.full_name}
              style={{ width: 90, height: 90, borderRadius: '50%', objectFit: 'cover', border: '3px solid rgba(255,255,255,0.2)' }}
            />
          ) : (
            <div style={{
              width: 90, height: 90, borderRadius: '50%',
              background: 'linear-gradient(135deg, #eb1b23, #c41019)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 28, fontWeight: 700, color: '#fff',
              border: '3px solid rgba(255,255,255,0.2)',
            }}>
              {initials}
            </div>
          )}

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            style={{
              position: 'absolute', bottom: 0, right: 0,
              width: 28, height: 28, borderRadius: '50%',
              background: '#eb1b23',
              border: '2px solid #fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
            }}
          >
            <Camera size={13} color="#fff" />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleAvatarChange}
            style={{ display: 'none' }}
          />
        </div>

        {/* Info */}
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: '#fff', margin: 0, marginBottom: 4 }}>
            {profile?.full_name}
          </h2>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            background: 'rgba(255,255,255,0.1)',
            backdropFilter: 'blur(8px)',
            border: '1px solid rgba(255,255,255,0.15)',
            borderRadius: 20,
            padding: '3px 12px',
          }}>
            <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.85)', fontWeight: 500 }}>
              {roleLabel}
            </span>
          </div>
          {profile?.student_id && (
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 6, margin: '6px 0 0' }}>
              Student ID: {profile.student_id}
            </p>
          )}
        </div>
      </div>

      {/* Alerts */}
      {success && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          background: '#f0fdf4', border: '1px solid #bbf7d0',
          borderRadius: 12, padding: '12px 16px', marginBottom: 20,
        }}>
          <CheckCircle size={16} color="#16a34a" />
          <span style={{ color: '#15803d', fontSize: 14, fontWeight: 500 }}>Profile updated successfully!</span>
        </div>
      )}
      {error && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          background: '#fef2f2', border: '1px solid #fecaca',
          borderRadius: 12, padding: '12px 16px', marginBottom: 20,
        }}>
          <AlertCircle size={16} color="#dc2626" />
          <span style={{ color: '#b91c1c', fontSize: 14 }}>{error}</span>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSave}>
        <div style={{
          background: '#fff',
          borderRadius: 20,
          border: '1px solid #e5e7eb',
          boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
          padding: '28px 24px',
        }}>

          {/* Read-only fields */}
          <div style={{ marginBottom: 28 }}>
            <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', color: '#9ca3af', marginBottom: 16, textTransform: 'uppercase' }}>
              Account Info
            </p>
            <div style={{ display: 'grid', gap: 14, gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))' }}>
              <ReadOnlyField icon={<Mail size={14} />} label="Email" value={profile?.email || ''} />
              {profile?.student_id && (
                <ReadOnlyField icon={<CreditCard size={14} />} label="Student ID" value={profile.student_id} />
              )}
            </div>
          </div>

          <div style={{ borderTop: '1px solid #f3f4f6', paddingTop: 28, marginBottom: 0 }}>
            <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', color: '#9ca3af', marginBottom: 16, textTransform: 'uppercase' }}>
              Personal Details
            </p>

            <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))' }}>
              <FormField
                icon={<User size={14} />}
                label="Full Name *"
                value={fullName}
                onChange={setFullName}
                placeholder="Your full name"
              />
              <FormField
                icon={<Phone size={14} />}
                label="Phone"
                value={phone}
                onChange={setPhone}
                placeholder="e.g. 0771234567"
                type="tel"
              />
              <FormField
                icon={<MessageCircle size={14} />}
                label="WhatsApp No."
                value={whatsapp}
                onChange={setWhatsapp}
                placeholder="e.g. 0771234567"
                type="tel"
              />
              <FormField
                icon={<Phone size={14} />}
                label="Mobile No."
                value={mobile}
                onChange={setMobile}
                placeholder="e.g. 0771234567"
                type="tel"
              />
              <FormField
                icon={<CreditCard size={14} />}
                label="NIC"
                value={nic}
                onChange={setNic}
                placeholder="National Identity Card No."
              />
            </div>
          </div>
        </div>

        {/* Save button */}
        <div style={{ marginTop: 20, display: 'flex', justifyContent: 'flex-end' }}>
          <button
            type="submit"
            disabled={saving || uploading}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '12px 32px',
              borderRadius: 12,
              border: 'none',
              background: saving || uploading ? '#f3f4f6' : '#eb1b23',
              color: saving || uploading ? '#9ca3af' : '#fff',
              fontSize: 14,
              fontWeight: 700,
              cursor: saving || uploading ? 'not-allowed' : 'pointer',
              transition: 'all 0.18s',
            }}
          >
            {(saving || uploading) && <Loader size={15} style={{ animation: 'spin 0.8s linear infinite' }} />}
            {saving ? 'Saving...' : uploading ? 'Uploading...' : 'Save Changes'}
          </button>
        </div>
      </form>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

/* ─── Helper Components ──────────────────────────────────────────── */

function FormField({
  icon, label, value, onChange, placeholder, type = 'text',
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <div>
      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
        {label}
      </label>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        border: `1.5px solid ${focused ? '#eb1b23' : '#e5e7eb'}`,
        borderRadius: 10,
        padding: '9px 12px',
        background: '#fff',
        transition: 'border-color 0.15s',
      }}>
        <span style={{ color: '#9ca3af', flexShrink: 0 }}>{icon}</span>
        <input
          type={type}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={{
            flex: 1,
            border: 'none',
            outline: 'none',
            fontSize: 13,
            color: '#111827',
            background: 'transparent',
          }}
        />
      </div>
    </div>
  );
}

function ReadOnlyField({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
        {label}
      </label>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        border: '1.5px solid #e5e7eb',
        borderRadius: 10,
        padding: '9px 12px',
        background: '#f9fafb',
      }}>
        <span style={{ color: '#9ca3af', flexShrink: 0 }}>{icon}</span>
        <span style={{ fontSize: 13, color: '#6b7280' }}>{value}</span>
      </div>
    </div>
  );
}
