# Payslip Enrollment Design

**Goal:** Replace PayHere with a bank-transfer payslip flow — students upload a slip photo, teachers approve or reject from a dedicated portal page, and approved students are immediately enrolled.

**Architecture:** Extend the existing `class_payments` table with two new columns (`slip_image_url`, `rejection_reason`), upload slips to Supabase Storage under `payslips/{classId}/{studentId}/{filename}`, and add a new `PaymentRequests.tsx` teacher page wired into the existing `TeacherDashboard` router.

**Tech Stack:** React + TypeScript, Supabase JS client (direct DB + storage), Tailwind CSS / inline styles matching existing component patterns.

---

## Database Changes

**Migration file:** `supabase/migrations/20260516000000_add_payslip_support.sql`

Add to `class_payments`:
- `slip_image_url text` — Supabase Storage public URL of the uploaded slip photo
- `rejection_reason text` — teacher's reason when rejecting

Update constraints (Postgres requires drop + recreate for check constraints):
- Drop and recreate `payment_status` check: `('pending', 'completed', 'failed', 'rejected')`
- Drop and recreate `payment_method` check: `('payhere', 'bank_transfer')` — or remove the method constraint entirely since it was added as a default only, not a named constraint in the original migration

RLS additions:
- Students can INSERT/UPDATE their own rows where `payment_method='bank_transfer'`
- Teachers can SELECT/UPDATE all payments for their classes (existing teacher policy already covers this — no new policy needed)

Storage:
- Bucket: `acp` (existing)
- Folder: `payslips/{classId}/{studentId}/{filename}`
- RLS: authenticated users can upload to paths starting with `payslips/` where filename contains their user ID segment; public read (same as rest of `acp` bucket)

---

## Payment Status State Machine

```
[not submitted]
      │ student uploads slip
      ▼
  pending
   │         │
   │ approve  │ reject (with reason)
   ▼         ▼
completed  rejected
   │            │ student resubmits
   │            ▼
   │         pending (new record)
   ▼
enrollment inserted (is_active=true)
```

---

## Files

| Action | File |
|--------|------|
| Create | `supabase/migrations/20260516000000_add_payslip_support.sql` |
| Modify | `src/components/student/BrowseClasses.tsx` |
| Create | `src/components/teacher/PaymentRequests.tsx` |
| Modify | `src/components/teacher/TeacherDashboard.tsx` |

---

## Student Flow (`BrowseClasses.tsx`)

### Data fetching
`fetchClasses` additionally queries `class_payments` for the current student filtered to `payment_method='bank_transfer'`, ordered by `created_at DESC`. For each class, take the **most recent row** (handles resubmissions). Result merged into each class object as `slip_status: 'pending' | 'completed' | 'rejected' | null` and `rejection_reason: string | null`.

### Button states (paid classes only)
| Slip status | Button | Extra UI |
|-------------|--------|----------|
| `null` | "Enroll Now" (red) — opens modal | — |
| `'pending'` | "Pending Approval" (grey, disabled) | — |
| `'rejected'` | "Resubmit Slip" (amber) — opens modal | Rejection reason shown below button in amber text |
| `'completed'` | class filtered out (student is enrolled) | — |

### Upload modal
- Heading: "Submit Bank Transfer Slip"
- Bank details block (hardcoded — developer fills in real account name/number/bank before deploy):
  ```
  Bank: [BANK NAME]
  Account Name: [ACCOUNT NAME]
  Account Number: [ACCOUNT NUMBER]
  Branch: [BRANCH]
  ```
- File input: image only (`accept="image/*"`), single file, required
- Submit button: disabled while uploading
- On submit:
  1. Upload file to `payslips/{classId}/{studentId}/{timestamp}-{filename}` in `acp` bucket
  2. Get public URL
  3. Insert row into `class_payments`: `{ student_id, class_id, amount: class.price, payment_status: 'pending', payment_method: 'bank_transfer', slip_image_url: publicUrl }`
  4. Close modal, update local state to show "Pending Approval"
- On resubmit: same flow — inserts a new row (old rejected row stays for audit)

---

## Teacher Flow (`PaymentRequests.tsx`)

### Data fetching
Query `class_payments` joined with `profiles` (student) and `classes`, filtered to:
- `payment_method = 'bank_transfer'`
- `class.teacher_id = currentTeacher.id`

### Layout
Three tabs: **Pending** (default, shown with count badge) | **Approved** | **Rejected**

### Pending tab — each row shows:
- Student full name + student number
- Class title
- Slip image thumbnail (click opens full-size in new tab)
- Submitted date
- **Approve** button (green) — one click, no confirmation needed
- **Reject** button (red) — expands an inline text input for reason + confirm button

### Approve action:
1. `UPDATE class_payments SET payment_status='completed' WHERE id=...`
2. `INSERT INTO enrollments { student_id, class_id, is_active: true }`
3. Row moves to Approved tab

### Reject action:
1. Validate reason is not empty
2. `UPDATE class_payments SET payment_status='rejected', rejection_reason=... WHERE id=...`
3. Row moves to Rejected tab

### Approved / Rejected tabs:
Read-only list. Rejected rows show the reason. No further actions.

---

## Teacher Dashboard (`TeacherDashboard.tsx`)

- Add nav item: `{ path: '/teacher/payments', label: 'Payment Requests', icon: CreditCard, section: 'main' }`
- Fetch pending count on mount: `SELECT count(*) FROM class_payments WHERE payment_method='bank_transfer' AND payment_status='pending' AND class_id IN (teacher's classes)`
- Show red badge with count next to nav label when count > 0
- Add `<Route path="payments" element={<PaymentRequests />} />` to the Routes block
