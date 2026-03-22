import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { LogOut, UserCircle, ChevronDown } from 'lucide-react';

interface ProfileMenuProps {
  role: string;
  onProfileClick: () => void;
}

export default function ProfileMenu({ role, onProfileClick }: ProfileMenuProps) {
  const { profile, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const initials = (profile?.full_name || 'U')
    .split(' ')
    .map(n => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const roleLabel =
    role === 'teacher' ? 'Educator'
    : role === 'student' ? 'Senior Scholar'
    : 'Administrator';

  return (
    <div ref={menuRef} style={{ position: 'relative', userSelect: 'none' }}>
      {/* Trigger pill */}
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          background: '#fff',
          border: '1.5px solid #e5e7eb',
          borderRadius: 40,
          padding: '5px 14px 5px 5px',
          cursor: 'pointer',
          boxShadow: '0 1px 6px rgba(0,0,0,0.07)',
          transition: 'box-shadow 0.2s, border-color 0.2s',
        }}
        onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 4px 14px rgba(0,0,0,0.12)')}
        onMouseLeave={e => (e.currentTarget.style.boxShadow = '0 1px 6px rgba(0,0,0,0.07)')}
      >
        {/* Avatar */}
        {profile?.avatar_url ? (
          <img
            src={profile.avatar_url}
            alt={profile.full_name}
            style={{
              width: 36,
              height: 36,
              borderRadius: '50%',
              objectFit: 'cover',
              border: '2px solid #f3f4f6',
            }}
          />
        ) : (
          <div style={{
            width: 36,
            height: 36,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #eb1b23 0%, #c41019 100%)',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 13,
            fontWeight: 700,
            flexShrink: 0,
          }}>
            {initials}
          </div>
        )}

        {/* Name + role */}
        <div style={{ textAlign: 'left' }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: '#111827', lineHeight: 1.2, margin: 0 }}>
            {profile?.full_name || 'User'}
          </p>
          <p style={{ fontSize: 11, color: '#9ca3af', lineHeight: 1.2, margin: 0 }}>
            {roleLabel}
          </p>
        </div>

        <ChevronDown
          size={14}
          color="#9ca3af"
          style={{
            marginLeft: 2,
            transition: 'transform 0.2s',
            transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
          }}
        />
      </button>

      {/* Dropdown */}
      {open && (
        <div style={{
          position: 'absolute',
          top: 'calc(100% + 8px)',
          right: 0,
          background: '#fff',
          border: '1px solid #e5e7eb',
          borderRadius: 14,
          boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
          minWidth: 190,
          zIndex: 1000,
          overflow: 'hidden',
          animation: 'dropIn 0.15s ease',
        }}>
          {/* Header */}
          <div style={{
            padding: '14px 16px 10px',
            borderBottom: '1px solid #f3f4f6',
          }}>
            <p style={{ fontSize: 12, fontWeight: 600, color: '#374151', margin: 0 }}>
              {profile?.full_name}
            </p>
            <p style={{ fontSize: 11, color: '#9ca3af', margin: 0 }}>
              {profile?.email}
            </p>
          </div>

          {/* Menu items */}
          <div style={{ padding: '6px' }}>
            <DropdownItem
              icon={<UserCircle size={15} />}
              label="My Profile"
              onClick={() => { setOpen(false); onProfileClick(); }}
            />
            <DropdownItem
              icon={<LogOut size={15} />}
              label="Log Out"
              danger
              onClick={() => { setOpen(false); signOut(); }}
            />
          </div>
        </div>
      )}

      <style>{`
        @keyframes dropIn {
          from { opacity: 0; transform: translateY(-6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

function DropdownItem({
  icon, label, onClick, danger = false,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  danger?: boolean;
}) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '9px 12px',
        borderRadius: 9,
        border: 'none',
        background: hovered
          ? danger ? '#fff1f2' : '#f9fafb'
          : 'transparent',
        color: danger ? '#eb1b23' : '#374151',
        fontSize: 13,
        fontWeight: 500,
        cursor: 'pointer',
        textAlign: 'left',
        transition: 'background 0.15s',
      }}
    >
      {icon}
      {label}
    </button>
  );
}
