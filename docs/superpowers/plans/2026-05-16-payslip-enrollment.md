# Payslip Enrollment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace PayHere with a bank-transfer payslip upload flow — students upload a slip image, teachers approve/reject from a new "Payment Requests" page, and approval immediately enrolls the student.

**Architecture:** Extend `class_payments` with `slip_image_url` and `rejection_reason` columns via a Supabase migration; upload slip images to the existing `acp` storage bucket under `payslips/{classId}/{studentId}/`; replace PayHere logic in `BrowseClasses.tsx` with a modal-based slip upload flow; create a new `PaymentRequests.tsx` teacher page wired into `TeacherDashboard.tsx`.

**Tech Stack:** React + TypeScript, Supabase JS client (direct DB + storage), inline styles + Tailwind CSS matching existing component patterns, lucide-react icons.

---

## File Map

| Action | File | Responsibility |
|--------|------|---------------|
| Create | `supabase/migrations/20260516000000_add_payslip_support.sql` | Add columns + update check constraint |
| Modify | `src/components/student/BrowseClasses.tsx` | Replace PayHere with slip modal |
| Create | `src/components/teacher/PaymentRequests.tsx` | Teacher approval/rejection UI |
| Modify | `src/components/teacher/TeacherDashboard.tsx` | Add nav item + route + pending badge |

---

## Task 1: Database Migration

**Files:**
- Create: `supabase/migrations/20260516000000_add_payslip_support.sql`

- [ ] **Step 1: Create the migration file**

```sql
-- supabase/migrations/20260516000000_add_payslip_support.sql

-- Add payslip columns to class_payments
ALTER TABLE class_payments
  ADD COLUMN IF NOT EXISTS slip_image_url text,
  ADD COLUMN IF NOT EXISTS rejection_reason text;

-- Widen payment_status to include 'rejected'
-- (constraint was created inline so postgres auto-names it)
DO $$
BEGIN
  ALTER TABLE class_payments
    DROP CONSTRAINT IF EXISTS class_payments_payment_status_check;
  ALTER TABLE class_payments
    ADD CONSTRAINT class_payments_payment_status_check
    CHECK (payment_status IN ('pending', 'completed', 'failed', 'rejected'));
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Could not update payment_status constraint: %', SQLERRM;
END $$;
```

- [ ] **Step 2: Apply the migration**

In the Supabase dashboard → SQL Editor, paste and run the migration SQL above. Or if using the CLI:

```bash
supabase db push
```

Expected: no errors; run `SELECT column_name FROM information_schema.columns WHERE table_name='class_payments'` and confirm `slip_image_url` and `rejection_reason` appear.

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/20260516000000_add_payslip_support.sql
git commit -m "feat: add payslip columns to class_payments"
```

---

## Task 2: Student — Slip Status State & Fetching

**Files:**
- Modify: `src/components/student/BrowseClasses.tsx`

This task wires up the state and data-fetching changes. No UI changes yet.

- [ ] **Step 1: Replace the PayHere import with supabase**

Find this line near the top of `BrowseClasses.tsx`:
```typescript
import { payHereService } from '../../lib/payhere';
```
Replace it with:
```typescript
import { supabase } from '../../lib/supabase';
```

- [ ] **Step 2: Add a SlipStatusMap type and new state**

Find the block of `useState` declarations inside `BrowseClasses` (around line 103–116). Replace it with:

```typescript
type SlipStatus = { status: 'pending' | 'completed' | 'rejected'; reason: string | null };

const { profile } = useAuth();
const [classes, setClasses] = useState<Class[]>([]);
const [filteredClasses, setFilteredClasses] = useState<Class[]>([]);
const [loading, setLoading] = useState(true);
const [selectedSubject, setSelectedSubject] = useState('all');
const [selectedTeacher, setSelectedTeacher] = useState('all');
const [selectedPrice, setSelectedPrice] = useState('all');
const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
const [teachers, setTeachers] = useState<Teacher[]>([]);
const [subjects, setSubjects] = useState<string[]>([]);
const [enrollingClassId, setEnrollingClassId] = useState<string | null>(null);
const [slipModalClass, setSlipModalClass] = useState<Class | null>(null);
const [slipFile, setSlipFile] = useState<File | null>(null);
const [slipUploading, setSlipUploading] = useState(false);
const [slipStatusMap, setSlipStatusMap] = useState<Record<string, SlipStatus>>({});
const [successMessage, setSuccessMessage] = useState<string | null>(null);
const [errorMessage, setErrorMessage] = useState<string | null>(null);
```

- [ ] **Step 3: Update fetchClasses to also load slip statuses**

Replace the entire `fetchClasses` function with:

```typescript
async function fetchClasses() {
  try {
    setLoading(true);

    const { data: allClasses, error } = await db
      .from<any>('classes')
      .select(`
        id,
        title,
        description,
        subject,
        schedule,
        price,
        is_free,
        status,
        zoom_link,
        next_session_date,
        materials,
        teacher:teachers(
          id,
          profile:profiles(
            full_name,
            avatar_url
          )
        )
      `)
      .eq('is_active', true)
      .order('next_session_date', { ascending: true })
      .execute();

    if (error) throw error;

    const [enrollmentsResult, slipPaymentsResult] = await Promise.all([
      db.from<any>('enrollments')
        .select('class_id')
        .eq('student_id', profile?.id)
        .eq('is_active', true)
        .execute(),
      supabase
        .from('class_payments')
        .select('class_id, payment_status, rejection_reason, created_at')
        .eq('student_id', profile?.id)
        .eq('payment_method', 'bank_transfer')
        .order('created_at', { ascending: false }),
    ]);

    const enrolledClassIds = new Set(enrollmentsResult.data?.map((e: any) => e.class_id) || []);

    // Most-recent slip per class
    const statusMap: Record<string, SlipStatus> = {};
    for (const p of slipPaymentsResult.data || []) {
      if (!statusMap[p.class_id]) {
        statusMap[p.class_id] = {
          status: p.payment_status as SlipStatus['status'],
          reason: p.rejection_reason ?? null,
        };
      }
    }
    setSlipStatusMap(statusMap);

    const classesWithStatus = allClasses?.map((cls: any) => ({
      ...cls,
      is_enrolled: enrolledClassIds.has(cls.id),
    })) || [];

    setClasses(classesWithStatus);

    const uniqueSubjects = Array.from(
      new Set(allClasses?.map((cls: any) => cls.subject).filter(Boolean))
    ).sort() as string[];
    setSubjects(uniqueSubjects);

    const uniqueTeachers = Array.from(
      new Map(
        allClasses
          ?.filter((cls: any) => cls.teacher?.profile?.full_name)
          .map((cls: any) => [
            cls.teacher.id,
            { id: cls.teacher.id, name: cls.teacher.profile.full_name },
          ])
      ).values()
    ).sort((a: any, b: any) => a.name.localeCompare(b.name));

    setTeachers(uniqueTeachers as Teacher[]);
  } catch (error) {
    console.error('Error fetching classes:', error);
    setErrorMessage('Failed to load classes');
  } finally {
    setLoading(false);
  }
}
```

- [ ] **Step 4: Delete handleEnrollPaid entirely**

Remove the entire `handleEnrollPaid` function (from `async function handleEnrollPaid` down to its closing `}`). It will be replaced in the next task.

- [ ] **Step 5: Delete the isProcessing helper**

Remove:
```typescript
const isProcessing = (id: string) =>
  enrollingClassId === id || processingPayment === id;
```

- [ ] **Step 6: Verify TypeScript compiles**

```bash
cd /home/dinesh-s/Documents/Dinesh/acp.lk
npx tsc --noEmit
```

Expected: no errors (there will be errors about missing `processingPayment` in JSX — those get fixed in Task 3).

- [ ] **Step 7: Commit**

```bash
git add src/components/student/BrowseClasses.tsx
git commit -m "feat(student): add slip status state + fetch, remove PayHere"
```

---

## Task 3: Student — Slip Modal, Submit Handler, Updated Card UI

**Files:**
- Modify: `src/components/student/BrowseClasses.tsx`

- [ ] **Step 1: Add bank details constant and handleSubmitSlip**

Insert these two blocks immediately after the `handleEnrollFree` function:

```typescript
// ⚠️ UPDATE THESE VALUES with real bank account details before deploying
const BANK_DETAILS = {
  bank: 'Commercial Bank of Ceylon',
  accountName: 'ACP Academy (Pvt) Ltd',
  accountNumber: '1234567890',
  branch: 'Colombo Main',
};

async function handleSubmitSlip() {
  if (!slipModalClass || !slipFile || !profile?.id) return;
  setSlipUploading(true);
  try {
    const ext = slipFile.name.split('.').pop() || 'jpg';
    const storagePath = `payslips/${slipModalClass.id}/${profile.id}/${Date.now()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from('acp')
      .upload(storagePath, slipFile, { upsert: false });
    if (uploadError) throw uploadError;

    const { data: urlData } = supabase.storage.from('acp').getPublicUrl(storagePath);

    const { error: dbError } = await supabase
      .from('class_payments')
      .insert({
        student_id: profile.id,
        class_id: slipModalClass.id,
        amount: slipModalClass.price,
        payment_status: 'pending',
        payment_method: 'bank_transfer',
        slip_image_url: urlData.publicUrl,
      });
    if (dbError) throw dbError;

    setSlipStatusMap(prev => ({
      ...prev,
      [slipModalClass.id]: { status: 'pending', reason: null },
    }));
    setSlipModalClass(null);
    setSlipFile(null);
    setSuccessMessage('Payslip submitted! Awaiting teacher approval.');
    setTimeout(() => setSuccessMessage(null), 4000);
  } catch (err) {
    console.error('Slip upload error:', err);
    setErrorMessage('Failed to submit payslip. Please try again.');
    setTimeout(() => setErrorMessage(null), 3000);
  } finally {
    setSlipUploading(false);
  }
}
```

- [ ] **Step 2: Add SlipUploadModal just before the return statement of BrowseClasses**

Insert immediately before `return (`:

```typescript
const slipStatus = slipModalClass ? slipStatusMap[slipModalClass.id] ?? null : null;
```

- [ ] **Step 3: Add the modal JSX at the end of the BrowseClasses return, before the closing `</div>`**

Find the `<style>` tag near the end of the BrowseClasses return. Insert the modal before it:

```tsx
{/* Slip Upload Modal */}
{slipModalClass && (
  <div style={{
    position: 'fixed', inset: 0, zIndex: 1000,
    background: 'rgba(0,0,0,0.55)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: '24px',
  }}>
    <div style={{
      background: '#fff', borderRadius: 20,
      width: '100%', maxWidth: 460,
      boxShadow: '0 24px 64px rgba(0,0,0,0.22)',
      overflow: 'hidden',
    }}>
      {/* Modal header */}
      <div style={{
        background: '#0f1623', padding: '20px 24px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div>
          <p style={{ color: '#9ca3af', fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', marginBottom: 4 }}>BANK TRANSFER</p>
          <h3 style={{ color: '#fff', fontSize: 18, fontWeight: 700, margin: 0 }}>
            {slipStatus?.status === 'rejected' ? 'Resubmit Payment Slip' : 'Submit Payment Slip'}
          </h3>
        </div>
        <button
          onClick={() => { setSlipModalClass(null); setSlipFile(null); }}
          style={{ background: 'rgba(255,255,255,0.08)', border: 'none', borderRadius: 8, padding: '6px 10px', cursor: 'pointer', color: '#9ca3af', fontSize: 20, lineHeight: 1 }}
        >
          ×
        </button>
      </div>

      {/* Body */}
      <div style={{ padding: '24px' }}>
        {/* Class info */}
        <div style={{ background: '#f9fafb', borderRadius: 10, padding: '12px 16px', marginBottom: 20, border: '1px solid #e5e7eb' }}>
          <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 2 }}>Enrolling in</p>
          <p style={{ fontSize: 15, fontWeight: 700, color: '#111827', margin: 0 }}>{slipModalClass.title}</p>
          <p style={{ fontSize: 16, fontWeight: 800, color: '#eb1b23', margin: '4px 0 0' }}>
            LKR {slipModalClass.price.toLocaleString()}
          </p>
        </div>

        {/* Bank details */}
        <div style={{ marginBottom: 20 }}>
          <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', color: '#9ca3af', marginBottom: 10 }}>TRANSFER TO</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {Object.entries({
              Bank: BANK_DETAILS.bank,
              'Account Name': BANK_DETAILS.accountName,
              'Account No.': BANK_DETAILS.accountNumber,
              Branch: BANK_DETAILS.branch,
            }).map(([label, value]) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                <span style={{ fontSize: 13, color: '#9ca3af', flexShrink: 0 }}>{label}</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#111827', textAlign: 'right' }}>{value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* File upload */}
        <div style={{ marginBottom: 20 }}>
          <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', color: '#9ca3af', marginBottom: 10 }}>UPLOAD SLIP PHOTO</p>
          <label style={{
            display: 'block', border: '2px dashed #d1d5db', borderRadius: 12, padding: '20px',
            textAlign: 'center', cursor: 'pointer', background: slipFile ? '#f0fdf4' : '#f9fafb',
            transition: 'all 0.15s',
          }}>
            <input
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={e => setSlipFile(e.target.files?.[0] ?? null)}
            />
            {slipFile ? (
              <div>
                <p style={{ fontSize: 14, fontWeight: 600, color: '#16a34a', margin: 0 }}>✓ {slipFile.name}</p>
                <p style={{ fontSize: 12, color: '#6b7280', margin: '4px 0 0' }}>Click to change</p>
              </div>
            ) : (
              <div>
                <p style={{ fontSize: 14, color: '#6b7280', margin: 0 }}>Click to select a photo</p>
                <p style={{ fontSize: 12, color: '#9ca3af', margin: '4px 0 0' }}>JPG, PNG, etc.</p>
              </div>
            )}
          </label>
        </div>

        {/* Submit button */}
        <button
          onClick={handleSubmitSlip}
          disabled={!slipFile || slipUploading}
          style={{
            width: '100%', padding: '13px',
            background: (!slipFile || slipUploading) ? '#e5e7eb' : '#eb1b23',
            color: (!slipFile || slipUploading) ? '#9ca3af' : '#fff',
            border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 700,
            cursor: (!slipFile || slipUploading) ? 'not-allowed' : 'pointer',
            transition: 'all 0.15s',
          }}
        >
          {slipUploading ? 'Uploading...' : 'Submit Payslip'}
        </button>
      </div>
    </div>
  </div>
)}
```

- [ ] **Step 4: Update the JSX where ClassCard and ClassListRow are rendered**

Find the grid render (around the `filteredClasses.map(cls => (<ClassCard`)). Replace the `ClassCard` render call:

```tsx
{filteredClasses.map(cls => (
  <ClassCard
    key={cls.id}
    classItem={cls}
    processing={enrollingClassId === cls.id}
    slipStatus={slipStatusMap[cls.id] ?? null}
    onEnroll={() => handleEnrollFree(cls)}
    onOpenSlipModal={() => setSlipModalClass(cls)}
  />
))}
```

And the list render `ClassListRow` call:

```tsx
{filteredClasses.map(cls => (
  <ClassListRow
    key={cls.id}
    classItem={cls}
    processing={enrollingClassId === cls.id}
    slipStatus={slipStatusMap[cls.id] ?? null}
    onEnroll={() => handleEnrollFree(cls)}
    onOpenSlipModal={() => setSlipModalClass(cls)}
  />
))}
```

- [ ] **Step 5: Replace the ClassCard component**

Find `function ClassCard({` and replace the entire component with:

```tsx
function ClassCard({
  classItem, processing, slipStatus, onEnroll, onOpenSlipModal,
}: {
  classItem: Class;
  processing: boolean;
  slipStatus: { status: 'pending' | 'completed' | 'rejected'; reason: string | null } | null;
  onEnroll: () => void;
  onOpenSlipModal: () => void;
}) {
  const theme = getSubjectTheme(classItem.subject);
  const teacherName = classItem.teacher?.profile?.full_name || 'Unknown';
  const avatarUrl = classItem.teacher?.profile?.avatar_url;

  function renderButton() {
    if (!classItem.is_free) {
      if (slipStatus?.status === 'pending') {
        return (
          <button disabled style={{
            width: '100%', padding: '12px', borderRadius: 10, border: 'none',
            background: '#fef3c7', color: '#92400e', fontSize: 13, fontWeight: 700,
            cursor: 'not-allowed',
          }}>
            ⏳ Pending Approval
          </button>
        );
      }
      if (slipStatus?.status === 'rejected') {
        return (
          <div>
            <button onClick={onOpenSlipModal} className="enroll-btn" style={{
              width: '100%', padding: '12px', borderRadius: 10, border: 'none',
              background: '#f59e0b', color: '#fff', fontSize: 14, fontWeight: 700,
              cursor: 'pointer', marginBottom: 8,
            }}>
              Resubmit Slip
            </button>
            {slipStatus.reason && (
              <p style={{ fontSize: 11, color: '#b45309', textAlign: 'center', margin: 0 }}>
                Rejected: {slipStatus.reason}
              </p>
            )}
          </div>
        );
      }
      return (
        <button onClick={onOpenSlipModal} className="enroll-btn" style={{
          width: '100%', padding: '12px', borderRadius: 10, border: 'none',
          background: '#eb1b23', color: '#fff', fontSize: 14, fontWeight: 700,
          cursor: 'pointer',
        }}>
          Upload Payment Slip
        </button>
      );
    }

    return (
      <button className="enroll-btn" onClick={onEnroll} disabled={processing} style={{
        width: '100%', padding: '12px', borderRadius: 10, border: 'none',
        cursor: processing ? 'not-allowed' : 'pointer',
        background: processing ? '#f3f4f6' : '#eb1b23',
        color: processing ? '#9ca3af' : '#fff',
        fontSize: 14, fontWeight: 700,
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        transition: 'all 0.18s ease',
      }}>
        {processing ? (
          <><Loader size={15} style={{ animation: 'spin 0.8s linear infinite' }} /> Enrolling...</>
        ) : 'Enroll Now'}
      </button>
    );
  }

  return (
    <div className="browse-card" style={{
      background: '#fff', borderRadius: 18, overflow: 'hidden',
      boxShadow: '0 2px 12px rgba(0,0,0,0.07)', border: '1px solid #e5e7eb',
      display: 'flex', flexDirection: 'column',
    }}>
      <div style={{ height: 160, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}
        className={`bg-gradient-to-br ${theme.gradient}`}
      >
        <div style={{ position: 'absolute', inset: 0, opacity: 0.07, backgroundImage: 'repeating-linear-gradient(45deg, #fff 0, #fff 1px, transparent 0, transparent 50%)', backgroundSize: '12px 12px' }} />
        <span style={{ fontSize: 52, opacity: 0.35, userSelect: 'none', zIndex: 1 }}>{theme.emoji}</span>
        <div style={{ position: 'absolute', bottom: 12, left: 12, background: 'rgba(0,0,0,0.45)', color: '#fff', fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', padding: '4px 10px', borderRadius: 6, backdropFilter: 'blur(4px)' }}>
          {classItem.subject?.toUpperCase()}
        </div>
        <div style={{ position: 'absolute', top: 12, left: 12, background: classItem.is_free ? 'rgba(16,185,129,0.9)' : 'rgba(30,30,30,0.8)', color: '#fff', fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 20, backdropFilter: 'blur(4px)' }}>
          {classItem.is_free ? 'FREE' : `LKR ${classItem.price.toLocaleString()}`}
        </div>
      </div>
      <div style={{ padding: '18px 18px 0', flex: 1 }}>
        <h3 style={{ fontSize: 17, fontWeight: 700, color: '#111827', marginBottom: 12, lineHeight: 1.3 }}>{classItem.title}</h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {avatarUrl
            ? <img src={avatarUrl} alt={teacherName} style={{ width: 30, height: 30, borderRadius: '50%', objectFit: 'cover', border: '2px solid #e5e7eb', flexShrink: 0 }} />
            : <AvatarFallback name={teacherName} size={30} />}
          <span style={{ fontSize: 13, color: '#6b7280', fontWeight: 500 }}>{teacherName}</span>
        </div>
      </div>
      <div style={{ padding: '16px 18px 18px' }}>
        {renderButton()}
      </div>
    </div>
  );
}
```

- [ ] **Step 6: Replace the ClassListRow component**

Find `function ClassListRow({` and replace the entire component with:

```tsx
function ClassListRow({
  classItem, processing, slipStatus, onEnroll, onOpenSlipModal,
}: {
  classItem: Class;
  processing: boolean;
  slipStatus: { status: 'pending' | 'completed' | 'rejected'; reason: string | null } | null;
  onEnroll: () => void;
  onOpenSlipModal: () => void;
}) {
  const theme = getSubjectTheme(classItem.subject);
  const teacherName = classItem.teacher?.profile?.full_name || 'Unknown';
  const avatarUrl = classItem.teacher?.profile?.avatar_url;

  function renderButton() {
    if (!classItem.is_free) {
      if (slipStatus?.status === 'pending') {
        return (
          <button disabled style={{
            padding: '10px 20px', borderRadius: 10, border: 'none',
            background: '#fef3c7', color: '#92400e', fontSize: 13, fontWeight: 700,
            cursor: 'not-allowed', whiteSpace: 'nowrap',
          }}>
            ⏳ Pending
          </button>
        );
      }
      if (slipStatus?.status === 'rejected') {
        return (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
            <button onClick={onOpenSlipModal} className="enroll-btn" style={{
              padding: '10px 20px', borderRadius: 10, border: 'none',
              background: '#f59e0b', color: '#fff', fontSize: 13, fontWeight: 700,
              cursor: 'pointer', whiteSpace: 'nowrap',
            }}>
              Resubmit Slip
            </button>
            {slipStatus.reason && (
              <p style={{ fontSize: 11, color: '#b45309', margin: 0, maxWidth: 160, textAlign: 'right' }}>
                {slipStatus.reason}
              </p>
            )}
          </div>
        );
      }
      return (
        <button onClick={onOpenSlipModal} className="enroll-btn" style={{
          padding: '10px 20px', borderRadius: 10, border: 'none',
          background: '#eb1b23', color: '#fff', fontSize: 13, fontWeight: 700,
          cursor: 'pointer', whiteSpace: 'nowrap',
        }}>
          Upload Slip
        </button>
      );
    }

    return (
      <button className="enroll-btn" onClick={onEnroll} disabled={processing} style={{
        padding: '10px 28px', borderRadius: 10, border: 'none',
        cursor: processing ? 'not-allowed' : 'pointer',
        background: processing ? '#f3f4f6' : '#eb1b23',
        color: processing ? '#9ca3af' : '#fff',
        fontSize: 13, fontWeight: 700,
        display: 'flex', alignItems: 'center', gap: 6,
        transition: 'all 0.18s ease', whiteSpace: 'nowrap',
      }}>
        {processing ? (
          <><Loader size={14} style={{ animation: 'spin 0.8s linear infinite' }} /> Enrolling...</>
        ) : 'Enroll Now'}
      </button>
    );
  }

  return (
    <div className="browse-card" style={{
      background: '#fff', borderRadius: 16, overflow: 'hidden',
      boxShadow: '0 2px 8px rgba(0,0,0,0.06)', border: '1px solid #e5e7eb',
      display: 'flex', alignItems: 'stretch',
    }}>
      <div className={`bg-gradient-to-br ${theme.gradient}`} style={{ width: 100, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, opacity: 0.07, backgroundImage: 'repeating-linear-gradient(45deg,#fff 0,#fff 1px,transparent 0,transparent 50%)', backgroundSize: '12px 12px' }} />
        <span style={{ fontSize: 32, opacity: 0.4 }}>{theme.emoji}</span>
      </div>
      <div style={{ flex: 1, padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 180 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', color: '#6b7280', background: '#f3f4f6', padding: '2px 8px', borderRadius: 4 }}>
              {classItem.subject?.toUpperCase()}
            </span>
            <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 10, background: classItem.is_free ? 'rgba(16,185,129,0.12)' : 'rgba(235,27,35,0.10)', color: classItem.is_free ? '#059669' : '#eb1b23' }}>
              {classItem.is_free ? 'FREE' : `LKR ${classItem.price.toLocaleString()}`}
            </span>
          </div>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: '#111827', marginBottom: 6, lineHeight: 1.3 }}>{classItem.title}</h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {avatarUrl
              ? <img src={avatarUrl} alt={teacherName} style={{ width: 22, height: 22, borderRadius: '50%', objectFit: 'cover', border: '2px solid #e5e7eb' }} />
              : <AvatarFallback name={teacherName} size={22} />}
            <span style={{ fontSize: 12, color: '#6b7280' }}>{teacherName}</span>
          </div>
        </div>
        {renderButton()}
      </div>
    </div>
  );
}
```

- [ ] **Step 7: Verify TypeScript**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 8: Manual smoke test**

Start dev server (`npm run dev` from project root). Open Browse Classes as a student. Confirm:
- Free classes still show "Enroll Now" and enroll directly
- Paid classes show "Upload Payment Slip"
- Clicking "Upload Payment Slip" opens the modal with bank details
- Selecting a file enables the Submit button
- After submitting, class shows "Pending Approval"

- [ ] **Step 9: Commit**

```bash
git add src/components/student/BrowseClasses.tsx
git commit -m "feat(student): replace PayHere with bank slip upload modal"
```

---

## Task 4: Teacher — PaymentRequests Page

**Files:**
- Create: `src/components/teacher/PaymentRequests.tsx`

- [ ] **Step 1: Create the file**

```tsx
// src/components/teacher/PaymentRequests.tsx
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
        .insert({
          student_id: payment.student_id,
          class_id: payment.class_id,
          is_active: true,
        });
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
            <div key={payment.id} style={{
              background: '#fff', border: '1px solid #e5e7eb', borderRadius: 16,
              padding: '20px 24px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
            }}>
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

                {/* Slip thumbnail */}
                {payment.slip_image_url && (
                  <a href={payment.slip_image_url} target="_blank" rel="noopener noreferrer"
                    style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, textDecoration: 'none' }}>
                    <img
                      src={payment.slip_image_url}
                      alt="Payslip"
                      style={{ width: 72, height: 72, objectFit: 'cover', borderRadius: 10, border: '2px solid #e5e7eb' }}
                    />
                    <span style={{ fontSize: 11, color: '#6b7280', display: 'flex', alignItems: 'center', gap: 3 }}>
                      <ExternalLink size={11} /> View
                    </span>
                  </a>
                )}
              </div>

              {/* Actions — only for pending */}
              {payment.payment_status === 'pending' && (
                <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid #f3f4f6' }}>
                  {rejectingId === payment.id ? (
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      <input
                        autoFocus
                        value={rejectReason}
                        onChange={e => setRejectReason(e.target.value)}
                        placeholder="Enter rejection reason..."
                        style={{
                          flex: 1, minWidth: 200, padding: '8px 12px', border: '1px solid #d1d5db',
                          borderRadius: 8, fontSize: 13, outline: 'none',
                        }}
                      />
                      <button
                        onClick={() => handleReject(payment)}
                        disabled={!rejectReason.trim() || actionLoading === payment.id}
                        style={{
                          padding: '8px 18px', borderRadius: 8, border: 'none',
                          background: (!rejectReason.trim() || actionLoading === payment.id) ? '#e5e7eb' : '#dc2626',
                          color: (!rejectReason.trim() || actionLoading === payment.id) ? '#9ca3af' : '#fff',
                          fontSize: 13, fontWeight: 600, cursor: 'pointer',
                        }}
                      >
                        {actionLoading === payment.id ? <Loader size={14} style={{ animation: 'spin 0.8s linear infinite' }} /> : 'Confirm'}
                      </button>
                      <button
                        onClick={() => { setRejectingId(null); setRejectReason(''); }}
                        style={{ padding: '8px 14px', borderRadius: 8, border: '1px solid #e5e7eb', background: '#fff', fontSize: 13, cursor: 'pointer', color: '#6b7280' }}
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', gap: 10 }}>
                      <button
                        onClick={() => handleApprove(payment)}
                        disabled={actionLoading === payment.id}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 6,
                          padding: '9px 20px', borderRadius: 10, border: 'none',
                          background: actionLoading === payment.id ? '#e5e7eb' : '#16a34a',
                          color: actionLoading === payment.id ? '#9ca3af' : '#fff',
                          fontSize: 13, fontWeight: 700, cursor: actionLoading === payment.id ? 'not-allowed' : 'pointer',
                        }}
                      >
                        {actionLoading === payment.id
                          ? <Loader size={14} style={{ animation: 'spin 0.8s linear infinite' }} />
                          : <CheckCircle size={15} />}
                        Approve
                      </button>
                      <button
                        onClick={() => { setRejectingId(payment.id); setRejectReason(''); }}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 6,
                          padding: '9px 20px', borderRadius: 10, border: '1px solid #fecaca',
                          background: '#fef2f2', color: '#dc2626',
                          fontSize: 13, fontWeight: 700, cursor: 'pointer',
                        }}
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
```

- [ ] **Step 2: Verify TypeScript**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/teacher/PaymentRequests.tsx
git commit -m "feat(teacher): add PaymentRequests page with approve/reject"
```

---

## Task 5: Teacher — Wire Into TeacherDashboard

**Files:**
- Modify: `src/components/teacher/TeacherDashboard.tsx`

- [ ] **Step 1: Add imports**

At the top of `TeacherDashboard.tsx`, add `CreditCard` to the lucide-react import:

```typescript
import {
  LayoutDashboard, Users, FileText, Package, LogOut,
  GraduationCap, TrendingUp, DollarSign, UserPlus, User,
  Menu, X, Image, MessageSquare, Trophy, AlertTriangle,
  Home, BookOpen, Activity, CreditCard,
} from 'lucide-react';
```

Add the component import below the other page imports:

```typescript
import PaymentRequests from './PaymentRequests';
```

Add `supabase` import below the existing imports:

```typescript
import { supabase } from '../../lib/supabase';
```

- [ ] **Step 2: Add pending count state and fetch**

Inside `TeacherDashboard`, after the existing `useState` declarations, add:

```typescript
const [pendingPayments, setPendingPayments] = useState(0);
```

Add a new `useEffect` after the existing `teacherId` effect:

```typescript
useEffect(() => {
  if (!teacherId) return;
  supabase
    .from('class_payments')
    .select('id, class:classes(teacher_id)')
    .eq('payment_method', 'bank_transfer')
    .eq('payment_status', 'pending')
    .then(({ data }) => {
      const count = (data || []).filter((p: any) => p.class?.teacher_id === teacherId).length;
      setPendingPayments(count);
    });
}, [teacherId]);
```

- [ ] **Step 3: Add the nav item**

Find the `navItems` array and add a new entry for Payment Requests:

```typescript
const navItems = [
  { path: '/teacher/dashboard', label: 'Dashboard', icon: LayoutDashboard, section: 'main' },
  { path: '/teacher/classes', label: 'My Classes', icon: GraduationCap, section: 'main' },
  { path: '/teacher/exams', label: 'Exams', icon: FileText, section: 'main' },
  { path: '/teacher/study-packs', label: 'Study Packs', icon: Package, section: 'main' },
  { path: '/teacher/payments', label: 'Payment Requests', icon: CreditCard, section: 'main' },
  { path: '/teacher/rankings', label: 'Student Rankings', icon: Trophy, section: 'main' },
  { path: '/teacher/gallery', label: 'Gallery', icon: Image, section: 'website' },
  { path: '/teacher/reviews', label: 'Reviews', icon: MessageSquare, section: 'website' },
  { path: '/teacher/test-results', label: 'Test Results', icon: Trophy, section: 'website' },
  { path: '/teacher/success', label: 'Success Stories', icon: BookOpen, section: 'website' },
];
```

- [ ] **Step 4: Update the main nav render to show badge on Payment Requests**

Find the `{mainNav.map(item => {` block and replace it with:

```tsx
{mainNav.map(item => {
  const Icon = item.icon;
  const badge = item.path === '/teacher/payments' && pendingPayments > 0 ? pendingPayments : null;
  return (
    <NavLink
      key={item.path}
      to={item.path}
      onClick={() => setIsMobileMenuOpen(false)}
      className={({ isActive }) =>
        `w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
          isActive
            ? 'bg-[#eb1b23] text-white shadow-lg shadow-red-900/40'
            : 'text-slate-400 hover:bg-white/5 hover:text-white'
        }`
      }
    >
      <Icon className="w-4 h-4 flex-shrink-0" />
      <span className="flex-1">{item.label}</span>
      {badge && (
        <span className="bg-[#eb1b23] text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
          {badge}
        </span>
      )}
    </NavLink>
  );
})}
```

- [ ] **Step 5: Add the route**

Inside the `<Routes>` block, add after the `rankings` route:

```tsx
<Route path="payments" element={<PaymentRequests />} />
```

- [ ] **Step 6: Verify TypeScript**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 7: End-to-end smoke test**

1. Log in as a student → Browse Classes → submit a payslip for a paid class → confirm "Pending Approval" shows
2. Log in as a teacher → Payment Requests nav item shows badge with count
3. Find the pending request → click the slip thumbnail to view image
4. Click Approve → confirm student is now enrolled (check their My Classes)
5. Submit another slip → reject with a reason → confirm student sees the reason and "Resubmit Slip" button

- [ ] **Step 8: Commit and push**

```bash
git add src/components/teacher/TeacherDashboard.tsx
git commit -m "feat(teacher): wire PaymentRequests into dashboard nav + route"
git push
```
