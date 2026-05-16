import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { TeacherRepository } from '../../repositories/TeacherRepository';
import { CheckCircle, XCircle, ExternalLink, Loader } from 'lucide-react';

interface PaymentRow {
  id: string;
  student_id: string;
  class_id: string;
  amount: number;
  payment_status: 'pending' | 'completed' | 'rejected';
  slip_image_url: string | null;
  rejection_reason: string | null;
  created_at: string;
  class: { id: string; title: string; teacher_id: string } | null;
  student: { id: string; full_name: string; student_number: number } | null;
}

const teacherRepo = new TeacherRepository();

export default function PaymentRequests() {
  const { profile } = useAuth();
  const [teacherId, setTeacherId] = useState<string | null>(null);
  const [payments, setPayments] = useState<PaymentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'pending' | 'completed' | 'rejected'>('pending');
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (profile?.id) {
      teacherRepo.findByProfileId(profile.id).then(t => {
        if (t) setTeacherId(t.id);
      });
    }
  }, [profile?.id]);

  useEffect(() => {
    if (teacherId) fetchPayments(teacherId);
  }, [teacherId]);

  async function fetchPayments(tid: string) {
    setLoading(true);
    try {
      const { data, error: fetchError } = await supabase
        .from('class_payments')
        .select(`
          id,
          student_id,
          class_id,
          amount,
          payment_status,
          slip_image_url,
          rejection_reason,
          created_at,
          class:classes(id, title, teacher_id),
          student:profiles(id, full_name, student_number)
        `)
        .eq('payment_method', 'bank_transfer')
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      const filtered = (data || []).filter(
        (p: any) => p.class?.teacher_id === tid
      ) as PaymentRow[];

      setPayments(filtered);
    } catch (err) {
      console.error('Error fetching payments:', err);
      setError('Failed to load payment requests.');
    } finally {
      setLoading(false);
    }
  }

  async function handleApprove(payment: PaymentRow) {
    setActionLoading(payment.id);
    try {
      const { error: updateError } = await supabase
        .from('class_payments')
        .update({ payment_status: 'completed', paid_at: new Date().toISOString() })
        .eq('id', payment.id);
      if (updateError) throw updateError;

      const { error: enrollError } = await supabase
        .from('enrollments')
        .insert({ student_id: payment.student_id, class_id: payment.class_id, is_active: true });
      if (enrollError) throw enrollError;

      setPayments(prev =>
        prev.map(p => p.id === payment.id ? { ...p, payment_status: 'completed' } : p)
      );
    } catch (err) {
      console.error('Approve error:', err);
      setError('Failed to approve. Please try again.');
      setTimeout(() => setError(null), 3000);
    } finally {
      setActionLoading(null);
    }
  }

  async function handleReject(payment: PaymentRow) {
    if (!rejectReason.trim()) return;
    setActionLoading(payment.id);
    try {
      const { error: updateError } = await supabase
        .from('class_payments')
        .update({ payment_status: 'rejected', rejection_reason: rejectReason.trim() })
        .eq('id', payment.id);
      if (updateError) throw updateError;

      setPayments(prev =>
        prev.map(p =>
          p.id === payment.id
            ? { ...p, payment_status: 'rejected', rejection_reason: rejectReason.trim() }
            : p
        )
      );
      setRejectingId(null);
      setRejectReason('');
    } catch (err) {
      console.error('Reject error:', err);
      setError('Failed to reject. Please try again.');
      setTimeout(() => setError(null), 3000);
    } finally {
      setActionLoading(null);
    }
  }

  const tabPayments = payments.filter(p => p.payment_status === activeTab);
  const pendingCount = payments.filter(p => p.payment_status === 'pending').length;

  const tabs: { key: typeof activeTab; label: string }[] = [
    { key: 'pending', label: `Pending${pendingCount > 0 ? ` (${pendingCount})` : ''}` },
    { key: 'completed', label: 'Approved' },
    { key: 'rejected', label: 'Rejected' },
  ];

  return (
    <div style={{ padding: '32px 24px', maxWidth: 800, margin: '0 auto' }}>
      <h1 style={{ fontSize: 26, fontWeight: 800, color: '#111827', marginBottom: 6 }}>Payment Requests</h1>
      <p style={{ color: '#6b7280', fontSize: 14, marginBottom: 28 }}>Review bank transfer payslips submitted by students.</p>

      {error && (
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, padding: '12px 16px', marginBottom: 20, color: '#b91c1c', fontSize: 14 }}>
          {error}
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, background: '#f3f4f6', borderRadius: 12, padding: 4, marginBottom: 24, width: 'fit-content' }}>
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={{
              padding: '8px 20px', borderRadius: 9, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600,
              background: activeTab === tab.key ? '#fff' : 'transparent',
              color: activeTab === tab.key ? '#111827' : '#6b7280',
              boxShadow: activeTab === tab.key ? '0 1px 4px rgba(0,0,0,0.10)' : 'none',
              transition: 'all 0.15s',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
          <div style={{ width: 36, height: 36, borderRadius: '50%', border: '3px solid #eb1b23', borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite' }} />
        </div>
      ) : tabPayments.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#9ca3af', fontSize: 15 }}>
          No {activeTab} requests.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {tabPayments.map(payment => (
            <div key={payment.id} style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 16, padding: '20px 24px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: 200 }}>
                  <p style={{ fontSize: 16, fontWeight: 700, color: '#111827', marginBottom: 2 }}>
                    {payment.student?.full_name ?? 'Unknown Student'}
                  </p>
                  <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 4 }}>
                    {payment.class?.title ?? 'Unknown Class'}
                  </p>
                  <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 12, color: '#374151', background: '#f3f4f6', padding: '2px 10px', borderRadius: 6, fontWeight: 600 }}>
                      LKR {payment.amount.toLocaleString()}
                    </span>
                    <span style={{ fontSize: 12, color: '#9ca3af' }}>
                      {new Date(payment.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                  </div>
                  {payment.rejection_reason && (
                    <p style={{ fontSize: 12, color: '#b45309', marginTop: 6, background: '#fef3c7', padding: '4px 10px', borderRadius: 6 }}>
                      Reason: {payment.rejection_reason}
                    </p>
                  )}
                </div>

                {payment.slip_image_url && (
                  <a href={payment.slip_image_url} target="_blank" rel="noopener noreferrer"
                    style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, textDecoration: 'none' }}>
                    <img src={payment.slip_image_url} alt="Payslip" style={{ width: 72, height: 72, objectFit: 'cover', borderRadius: 10, border: '2px solid #e5e7eb' }} />
                    <span style={{ fontSize: 11, color: '#6b7280', display: 'flex', alignItems: 'center', gap: 3 }}>
                      <ExternalLink size={11} /> View
                    </span>
                  </a>
                )}
              </div>

              {payment.payment_status === 'pending' && (
                <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid #f3f4f6' }}>
                  {rejectingId === payment.id ? (
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      <input
                        autoFocus
                        value={rejectReason}
                        onChange={e => setRejectReason(e.target.value)}
                        placeholder="Enter rejection reason..."
                        style={{ flex: 1, minWidth: 200, padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 13, outline: 'none' }}
                      />
                      <button
                        onClick={() => handleReject(payment)}
                        disabled={!rejectReason.trim() || actionLoading === payment.id}
                        style={{ padding: '8px 18px', borderRadius: 8, border: 'none', background: (!rejectReason.trim() || actionLoading === payment.id) ? '#e5e7eb' : '#dc2626', color: (!rejectReason.trim() || actionLoading === payment.id) ? '#9ca3af' : '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
                      >
                        {actionLoading === payment.id ? <Loader size={14} style={{ animation: 'spin 0.8s linear infinite' }} /> : 'Confirm'}
                      </button>
                      <button onClick={() => { setRejectingId(null); setRejectReason(''); }} style={{ padding: '8px 14px', borderRadius: 8, border: '1px solid #e5e7eb', background: '#fff', fontSize: 13, cursor: 'pointer', color: '#6b7280' }}>
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', gap: 10 }}>
                      <button
                        onClick={() => handleApprove(payment)}
                        disabled={actionLoading === payment.id}
                        style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 20px', borderRadius: 10, border: 'none', background: actionLoading === payment.id ? '#e5e7eb' : '#16a34a', color: actionLoading === payment.id ? '#9ca3af' : '#fff', fontSize: 13, fontWeight: 700, cursor: actionLoading === payment.id ? 'not-allowed' : 'pointer' }}
                      >
                        {actionLoading === payment.id ? <Loader size={14} style={{ animation: 'spin 0.8s linear infinite' }} /> : <CheckCircle size={15} />}
                        Approve
                      </button>
                      <button
                        onClick={() => { setRejectingId(payment.id); setRejectReason(''); }}
                        style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 20px', borderRadius: 10, border: '1px solid #fecaca', background: '#fef2f2', color: '#dc2626', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
                      >
                        <XCircle size={15} /> Reject
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
