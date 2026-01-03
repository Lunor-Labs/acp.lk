# PayHere Payment Gateway Integration Guide

Complete implementation guide for integrating PayHere payment gateway with environment-based configuration management.

## Table of Contents
1. [Environment Configuration](#environment-configuration)
2. [Code Implementation](#code-implementation)
3. [Security Considerations](#security-considerations)
4. [Testing Setup](#testing-setup)
5. [Production Deployment](#production-deployment)

---

## 1. Environment Configuration

### Required Environment Variables

Add these variables to your `.env` file:

```Bash
# PayHere Payment Gateway Configuration
# Get your credentials from: https://www.payhere.lk/merchant/settings

# Environment Mode: 'sandbox' for testing, 'production' for live payments
VITE_PAYHERE_MODE=sandbox

# PayHere Merchant ID (from PayHere Dashboard)
VITE_PAYHERE_MERCHANT_ID=1227368

# PayHere Merchant Secret (IMPORTANT: Keep this secure, used for webhook validation)
# This is NOT prefixed with VITE_ because it should NEVER be exposed to the client
PAYHERE_MERCHANT_SECRET=your_merchant_secret_here
```

### Environment Variable Details

| Variable | Required | Exposed to Client | Description |
|----------|----------|-------------------|-------------|
| `VITE_PAYHERE_MODE` | Yes | Yes | Environment mode: `sandbox` or `production` |
| `VITE_PAYHERE_MERCHANT_ID` | Yes | Yes | Your PayHere merchant ID |
| `PAYHERE_MERCHANT_SECRET` | Yes | No | Your merchant secret for webhook validation (server-side only) |

### Getting PayHere Credentials

1. **Create a PayHere Account**
   - Visit: https://www.payhere.lk/
   - Sign up for a merchant account
   - Complete the KYC verification process

2. **Get Your Credentials**
   - Login to PayHere Dashboard: https://www.payhere.lk/merchant/
   - Navigate to: Settings → Domains & Credentials
   - Copy your Merchant ID and Merchant Secret

3. **Configure Sandbox (Testing)**
   - Sandbox Merchant ID: `1227368` (default test account)
   - Use test credentials for development

---

## 2. Code Implementation

### Architecture Overview

```
Frontend (React)
├── src/lib/payhere.ts           → PayHere service class
├── src/components/student/MyClasses.tsx → Payment UI
└── index.html                   → PayHere SDK script

Backend (Supabase Edge Function)
└── supabase/functions/payhere-webhook/ → Webhook handler

Database (Supabase)
└── class_payments table         → Payment tracking
```

### Frontend Implementation

#### PayHere Service (`src/lib/payhere.ts`)

```typescript
import { payHereService } from './lib/payhere';

// Check if PayHere is loaded
if (payHereService.isPayHereLoaded()) {
  console.log('PayHere is ready');
}

// Get configuration
const config = payHereService.getConfig();
console.log('Mode:', config.mode); // 'sandbox' or 'production'
console.log('Merchant ID:', config.merchantId);

// Check environment
if (payHereService.isSandbox()) {
  const testCreds = payHereService.getSandboxTestCredentials();
  console.log('Test credentials:', testCreds);
}

// Create payment data
const paymentData = payHereService.createPaymentData({
  orderId: 'ORDER123',
  items: 'Physics Class Fee',
  amount: 2500.00,
  firstName: 'John',
  lastName: 'Doe',
  email: 'john@example.com',
  phone: '0771234567',
  city: 'Colombo',
  country: 'Sri Lanka',
  address: '123 Main Street',
});

// Initiate payment
await payHereService.initiatePayment(paymentData, {
  onCompleted: async (orderId) => {
    console.log('Payment completed:', orderId);
    // Update your database
  },
  onDismissed: () => {
    console.log('Payment cancelled by user');
  },
  onError: (error) => {
    console.error('Payment error:', error);
  },
});
```

#### Component Integration Example

```typescript
import { payHereService } from '../../lib/payhere';
import { supabase } from '../../lib/supabase';

async function handlePayment(classItem: Class) {
  try {
    // 1. Create payment record in database
    const { data: payment, error } = await supabase
      .from('class_payments')
      .insert({
        student_id: userId,
        class_id: classItem.id,
        amount: classItem.price,
        payment_status: 'pending',
        payment_method: 'payhere',
      })
      .select()
      .single();

    if (error) throw error;

    // 2. Create PayHere payment data
    const paymentData = payHereService.createPaymentData({
      orderId: payment.id,
      items: classItem.title,
      amount: classItem.price,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone,
    });

    // 3. Initiate payment
    await payHereService.initiatePayment(paymentData, {
      onCompleted: async (orderId) => {
        // Update payment status in database
        await supabase
          .from('class_payments')
          .update({
            payment_status: 'completed',
            payment_reference: orderId,
            paid_at: new Date().toISOString(),
          })
          .eq('id', payment.id);

        // Refresh UI
        fetchClasses();
      },
      onDismissed: () => {
        console.log('Payment cancelled');
      },
      onError: async (error) => {
        // Mark payment as failed
        await supabase
          .from('class_payments')
          .update({ payment_status: 'failed' })
          .eq('id', payment.id);
      },
    });
  } catch (error) {
    console.error('Payment initiation error:', error);
  }
}
```

### Backend Implementation

#### Webhook Handler (`supabase/functions/payhere-webhook/index.ts`)

The webhook handler automatically:
- Validates PayHere webhook signatures using MD5 hash
- Verifies payment authenticity
- Updates payment records in the database
- Handles all PayHere status codes

**Status Codes:**
- `2` = Success
- `0` = Pending
- `-1` = Cancelled
- `-2` = Failed
- `-3` = Chargedback

**Webhook URL:**
```
https://your-project.supabase.co/functions/v1/payhere-webhook
```

---

## 3. Security Considerations

### Best Practices

#### 1. Environment Variable Security

**DO:**
- Store `PAYHERE_MERCHANT_SECRET` without `VITE_` prefix (server-side only)
- Use `.gitignore` to exclude `.env` files from version control
- Use different credentials for sandbox and production
- Rotate secrets regularly in production

**DON'T:**
- Never commit `.env` files to Git
- Never expose merchant secret to client-side code
- Never use sandbox credentials in production

#### 2. Webhook Signature Validation

The webhook handler validates every incoming notification:

```typescript
// MD5 signature validation
const localMd5sig = generateMD5Hash(
  merchantSecret,
  orderId,
  amount,
  currency,
  statusCode
);

if (localMd5sig !== receivedMd5sig) {
  // Reject invalid webhooks
  return Response.json({ error: 'Invalid signature' }, { status: 400 });
}
```

**Why this matters:**
- Prevents fraudulent payment notifications
- Ensures data integrity
- Protects against replay attacks

#### 3. Database Security

**Row Level Security (RLS) Policies:**

```sql
-- Students can view their own payments
CREATE POLICY "Students can view own payments"
  ON class_payments FOR SELECT
  TO authenticated
  USING (student_id = auth.uid());

-- Teachers can view payments for their classes
CREATE POLICY "Teachers can view class payments"
  ON class_payments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM classes
      JOIN teachers ON classes.teacher_id = teachers.id
      WHERE classes.id = class_payments.class_id
      AND teachers.profile_id = auth.uid()
    )
  );
```

#### 4. Client-Side Validation

```typescript
// Validate amount before payment
function validatePaymentAmount(amount: number): boolean {
  return amount > 0 && amount <= 1000000; // Max 1M LKR
}

// Validate required fields
if (!user.email || !user.phone) {
  alert('Please complete your profile before making a payment');
  return;
}
```

---

## 4. Testing Setup

### Sandbox Mode Testing

#### Test Credentials

**Default Sandbox Merchant ID:** `1227368`

**Test Card Numbers:**
```
Card Number: 5xxx xxxx xxxx 4454
Expiry Date: Any future date (e.g., 12/25)
CVV: Any 3 digits (e.g., 123)
Cardholder Name: Any name
```

**Test Mobile Payment:**
```
Mobile Number: 0771234567
OTP: Any digits
```

#### Testing Checklist

- [ ] **Payment Initiation**
  - Click "Pay & Unlock" button
  - PayHere modal opens correctly
  - All payment details pre-filled

- [ ] **Successful Payment**
  - Complete payment with test card
  - Payment status updates to "completed"
  - Class access granted immediately
  - Database record updated

- [ ] **Payment Cancellation**
  - Close PayHere modal
  - Payment status remains "pending"
  - User can retry payment

- [ ] **Payment Failure**
  - Use invalid card details
  - Payment status updates to "failed"
  - Error message displayed

- [ ] **Webhook Processing**
  - Webhook receives notification
  - Signature validated successfully
  - Database updated correctly

#### Manual Testing Steps

**1. Test Successful Payment:**
```bash
# 1. Start your application
npm run dev

# 2. Login as a student
# 3. Navigate to "My Classes"
# 4. Select an unpaid class
# 5. Click "Pay & Unlock"
# 6. Use test card: 5xxx xxxx xxxx 4454
# 7. Verify payment completion
```

**2. Test Payment Cancellation:**
```bash
# 1. Click "Pay & Unlock"
# 2. Close the PayHere modal
# 3. Verify payment status remains pending
# 4. Verify you can retry payment
```

**3. Test Webhook:**
```bash
# Check Supabase Edge Function logs
# Verify webhook receives notifications
# Check database for payment updates
```

#### Automated Testing

```typescript
// Example test with Jest/Vitest
describe('PayHere Service', () => {
  test('creates valid payment data', () => {
    const paymentData = payHereService.createPaymentData({
      orderId: 'TEST123',
      items: 'Test Item',
      amount: 1000,
      firstName: 'John',
      lastName: 'Doe',
      email: 'test@example.com',
      phone: '0771234567',
    });

    expect(paymentData.merchant_id).toBeDefined();
    expect(paymentData.amount).toBe('1000.00');
    expect(paymentData.currency).toBe('LKR');
    expect(paymentData.sandbox).toBe(true); // In test mode
  });

  test('validates environment configuration', () => {
    expect(() => payHereService.getConfig()).not.toThrow();
  });
});
```

### Switching Between Environments

**Development (Sandbox):**
```bash
VITE_PAYHERE_MODE=sandbox
VITE_PAYHERE_MERCHANT_ID=1227368
```

**Production (Live):**
```bash
VITE_PAYHERE_MODE=production
VITE_PAYHERE_MERCHANT_ID=your_live_merchant_id
PAYHERE_MERCHANT_SECRET=your_live_merchant_secret
```

---

## 5. Production Deployment

### Pre-Deployment Checklist

- [ ] Obtain production PayHere merchant account
- [ ] Verify KYC approval from PayHere
- [ ] Get production Merchant ID and Secret
- [ ] Update environment variables
- [ ] Test in sandbox thoroughly
- [ ] Configure production webhook URL
- [ ] Set up payment monitoring
- [ ] Configure error alerting

### Environment Variables for Production

**Frontend (.env):**
```bash
VITE_PAYHERE_MODE=production
VITE_PAYHERE_MERCHANT_ID=your_production_merchant_id
```

**Backend (Supabase Dashboard → Edge Functions → Secrets):**
```bash
PAYHERE_MERCHANT_SECRET=your_production_merchant_secret
```

### PayHere Dashboard Configuration

1. **Login to PayHere Dashboard**
   - https://www.payhere.lk/merchant/

2. **Configure Webhook URL**
   - Go to: Settings → Notifications
   - Set Notify URL: `https://your-project.supabase.co/functions/v1/payhere-webhook`
   - Save changes

3. **Domain Whitelisting**
   - Go to: Settings → Domains
   - Add your production domain
   - Save changes

### Monitoring and Alerts

**Monitor these metrics:**
- Payment success rate
- Failed payment reasons
- Webhook delivery success
- Average payment processing time

**Set up alerts for:**
- Payment failures exceeding threshold
- Webhook signature validation failures
- Database update errors
- API downtime

### Error Handling in Production

```typescript
// Implement comprehensive error handling
try {
  await payHereService.initiatePayment(paymentData, callbacks);
} catch (error) {
  // Log to monitoring service (e.g., Sentry)
  console.error('Payment error:', error);

  // Show user-friendly message
  showErrorNotification('Payment failed. Please try again or contact support.');

  // Track failed payment
  trackEvent('payment_failed', {
    error: error.message,
    classId: classItem.id,
  });
}
```

---

## Common Issues and Solutions

### Issue 1: PayHere SDK Not Loading

**Symptom:** "Payment gateway not loaded" error

**Solution:**
```html
<!-- Ensure PayHere script is in index.html -->
<script type="text/javascript" src="https://www.payhere.lk/lib/payhere.js"></script>
```

### Issue 2: Invalid Merchant ID

**Symptom:** Payment modal doesn't open

**Solution:**
- Verify `VITE_PAYHERE_MERCHANT_ID` is set correctly
- Check if you're using correct ID for the environment (sandbox/production)

### Issue 3: Webhook Not Receiving Notifications

**Symptom:** Payments succeed but database not updated

**Solution:**
- Verify webhook URL in PayHere dashboard
- Check Edge Function logs for errors
- Ensure `PAYHERE_MERCHANT_SECRET` is set in Supabase

### Issue 4: Signature Validation Failure

**Symptom:** "Invalid signature" errors in webhook logs

**Solution:**
- Verify `PAYHERE_MERCHANT_SECRET` matches PayHere dashboard
- Check if secret includes any extra spaces or characters
- Ensure webhook is receiving data from PayHere (not test requests)

---

## API Reference

### PayHereService Class

#### Methods

**`getConfig(): PayHereConfig`**
- Returns current PayHere configuration
- Includes mode, merchant ID, and URLs

**`isSandbox(): boolean`**
- Returns true if running in sandbox mode
- Returns false if running in production mode

**`isPayHereLoaded(): boolean`**
- Checks if PayHere SDK is loaded
- Returns true if window.payhere is available

**`waitForPayHere(timeout?: number): Promise<void>`**
- Waits for PayHere SDK to load
- Default timeout: 5000ms
- Throws error if timeout exceeded

**`createPaymentData(params): PayHerePaymentData`**
- Creates formatted payment data object
- Validates and formats all required fields
- Returns PayHere-compatible payment object

**`initiatePayment(paymentData, callbacks): Promise<void>`**
- Initiates PayHere payment flow
- Opens PayHere modal
- Handles payment callbacks

**`getSandboxTestCredentials()`**
- Returns test credentials for sandbox mode
- Returns null in production mode

---

## Support

### Resources

- **PayHere Documentation:** https://support.payhere.lk/
- **PayHere API Reference:** https://support.payhere.lk/api-&-mobile-sdk/payhere-checkout
- **PayHere Support:** support@payhere.lk
- **PayHere Dashboard:** https://www.payhere.lk/merchant/

### Contact

For technical issues with this integration:
1. Check the troubleshooting section above
2. Review Supabase Edge Function logs
3. Check PayHere transaction logs in dashboard
4. Contact your development team

---

## License

This integration guide is part of the AL Tuition Platform project.
