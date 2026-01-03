# PayHere Integration - Quick Start Guide

## Step 1: Environment Setup (2 minutes)

Add to your `.env` file:

```bash
# Sandbox (Testing)
VITE_PAYHERE_MODE=sandbox
VITE_PAYHERE_MERCHANT_ID=1227368
PAYHERE_MERCHANT_SECRET=your_merchant_secret_here
```

## Step 2: Test Payment (1 minute)

1. Start your app: `npm run dev`
2. Login as a student
3. Go to "My Classes"
4. Click "Pay & Unlock" on any paid class
5. Use test card: `5xxx xxxx xxxx 4454`
6. Use any future expiry and CVV

## Step 3: Production Setup

### Get Your Credentials
1. Create account: https://www.payhere.lk/
2. Complete KYC verification
3. Get credentials from: Dashboard → Settings → Domains & Credentials

### Update Environment
```bash
# Production
VITE_PAYHERE_MODE=production
VITE_PAYHERE_MERCHANT_ID=your_live_merchant_id
PAYHERE_MERCHANT_SECRET=your_live_merchant_secret
```

### Configure PayHere Dashboard
1. Login to PayHere Dashboard
2. Go to: Settings → Notifications
3. Set Notify URL: `https://your-project.supabase.co/functions/v1/payhere-webhook`
4. Go to: Settings → Domains
5. Add your production domain

## Code Usage

### Basic Payment Flow

```typescript
import { payHereService } from './lib/payhere';

// Create payment
const paymentData = payHereService.createPaymentData({
  orderId: 'ORDER123',
  items: 'Class Fee',
  amount: 2500,
  firstName: 'John',
  lastName: 'Doe',
  email: 'john@example.com',
  phone: '0771234567',
});

// Initiate payment
await payHereService.initiatePayment(paymentData, {
  onCompleted: async (orderId) => {
    // Payment successful
    console.log('Payment completed:', orderId);
  },
  onDismissed: () => {
    // User cancelled
    console.log('Payment cancelled');
  },
  onError: (error) => {
    // Payment failed
    console.error('Payment error:', error);
  },
});
```

## Test Cards (Sandbox Only)

| Card Type | Number | Expiry | CVV |
|-----------|--------|--------|-----|
| Visa/Master | 5xxx xxxx xxxx 4454 | Any future date | Any 3 digits |
| Mobile | 0771234567 | - | Any OTP |

## Common Issues

| Issue | Solution |
|-------|----------|
| "Payment gateway not loaded" | Refresh page, check internet connection |
| "Invalid merchant ID" | Check `VITE_PAYHERE_MERCHANT_ID` in `.env` |
| Webhook not working | Verify URL in PayHere dashboard, check Edge Function logs |
| Payment succeeds but DB not updated | Check `PAYHERE_MERCHANT_SECRET` is set in Supabase |

## Architecture

```
User clicks "Pay & Unlock"
    ↓
Create payment record (status: pending)
    ↓
Open PayHere modal
    ↓
User completes payment
    ↓
PayHere sends webhook → Edge Function
    ↓
Validate signature + Update DB (status: completed)
    ↓
Frontend refreshes → User gets access
```

## Files Structure

```
project/
├── .env                                    # Environment variables
├── index.html                              # PayHere SDK script
├── src/
│   ├── lib/
│   │   ├── payhere.ts                     # PayHere service
│   │   └── supabase.ts                    # Database client
│   └── components/
│       └── student/
│           └── MyClasses.tsx              # Payment UI
└── supabase/
    └── functions/
        └── payhere-webhook/
            └── index.ts                    # Webhook handler
```

## Security Checklist

- [ ] `.env` file is in `.gitignore`
- [ ] `PAYHERE_MERCHANT_SECRET` has NO `VITE_` prefix
- [ ] Different credentials for sandbox and production
- [ ] Webhook URL configured in PayHere dashboard
- [ ] Production domain whitelisted in PayHere
- [ ] RLS policies enabled on `class_payments` table

## Support Resources

- **Full Documentation:** See `PAYHERE_INTEGRATION.md`
- **PayHere Docs:** https://support.payhere.lk/
- **PayHere Dashboard:** https://www.payhere.lk/merchant/
- **Supabase Edge Functions:** Check logs in Supabase Dashboard

## Quick Commands

```bash
# Start development
npm run dev

# Build for production
npm run build

# Check environment variables
cat .env

# View Edge Function logs
# Go to: Supabase Dashboard → Edge Functions → payhere-webhook → Logs
```

---

**Need more details?** Read the full integration guide in `PAYHERE_INTEGRATION.md`
