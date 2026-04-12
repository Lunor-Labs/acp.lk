interface PayHereConfig {
  mode: 'sandbox' | 'production';
  merchantId: string;
  returnUrl: string;
  cancelUrl: string;
  notifyUrl: string;
}

interface PayHerePaymentData {
  sandbox: boolean;
  merchant_id: string;
  return_url: string;
  cancel_url: string;
  notify_url: string;
  order_id: string;
  items: string;
  amount: string;
  currency: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  country: string;
  delivery_address?: string;
  delivery_city?: string;
  delivery_country?: string;
  custom_1?: string;
  custom_2?: string;
}

interface PayHereWindow extends Window {
  payhere?: {
    startPayment: (payment: PayHerePaymentData) => void;
    onCompleted: (orderId: string) => void;
    onDismissed: () => void;
    onError: (error: any) => void;
  };
}

declare const window: PayHereWindow;

class PayHereService {
  private config: PayHereConfig;

  constructor() {
    this.config = this.loadConfig();
    this.validateConfig();
  }

  private loadConfig(): PayHereConfig {
    const mode = import.meta.env.VITE_PAYHERE_MODE || 'sandbox';
    const merchantId = import.meta.env.VITE_PAYHERE_MERCHANT_ID;

    if (mode !== 'sandbox' && mode !== 'production') {
      throw new Error(
        'Invalid VITE_PAYHERE_MODE. Must be either "sandbox" or "production"'
      );
    }

    return {
      mode: mode as 'sandbox' | 'production',
      merchantId: merchantId || '',
      returnUrl: window.location.origin,
      cancelUrl: window.location.origin,
      notifyUrl: `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/payhere-webhook`,
    };
  }

  private validateConfig(): void {
    if (!this.config.merchantId) {
      throw new Error(
        'PayHere Merchant ID is required. Please set VITE_PAYHERE_MERCHANT_ID in your environment variables.'
      );
    }

    if (this.config.mode === 'production' && this.config.merchantId === '1227368') {
      console.warn(
        'WARNING: You are using the default sandbox merchant ID in production mode. Please update VITE_PAYHERE_MERCHANT_ID with your production merchant ID.'
      );
    }
  }

  getConfig(): PayHereConfig {
    return { ...this.config };
  }

  isSandbox(): boolean {
    return this.config.mode === 'sandbox';
  }

  isPayHereLoaded(): boolean {
    return typeof window.payhere !== 'undefined';
  }

  waitForPayHere(timeout: number = 5000): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.isPayHereLoaded()) {
        resolve();
        return;
      }

      const startTime = Date.now();
      const checkInterval = setInterval(() => {
        if (this.isPayHereLoaded()) {
          clearInterval(checkInterval);
          resolve();
        } else if (Date.now() - startTime > timeout) {
          clearInterval(checkInterval);
          reject(new Error('PayHere SDK failed to load within timeout period'));
        }
      }, 100);
    });
  }

  createPaymentData(params: {
    orderId: string;
    items: string;
    amount: number;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    city?: string;
    country?: string;
    address?: string;
    custom1?: string;
    custom2?: string;
  }): PayHerePaymentData {
    return {
      sandbox: this.isSandbox(),
      merchant_id: this.config.merchantId,
      return_url: this.config.returnUrl,
      cancel_url: this.config.cancelUrl,
      notify_url: this.config.notifyUrl,
      order_id: params.orderId,
      items: params.items,
      amount: params.amount.toFixed(2),
      currency: 'LKR',
      first_name: params.firstName,
      last_name: params.lastName,
      email: params.email,
      phone: params.phone,
      address: params.address || '',
      city: params.city || 'Colombo',
      country: params.country || 'Sri Lanka',
      custom_1: params.custom1,
      custom_2: params.custom2,
    };
  }

  async initiatePayment(
    paymentData: PayHerePaymentData,
    callbacks: {
      onCompleted: (orderId: string) => void | Promise<void>;
      onDismissed: () => void | Promise<void>;
      onError: (error: any) => void | Promise<void>;
    }
  ): Promise<void> {
    try {
      await this.waitForPayHere();

      if (!window.payhere) {
        throw new Error('PayHere SDK is not available');
      }

      window.payhere.onCompleted = callbacks.onCompleted;
      window.payhere.onDismissed = callbacks.onDismissed;
      window.payhere.onError = callbacks.onError;

      window.payhere.startPayment(paymentData);
    } catch (error) {
      console.error('PayHere initialization error:', error);
      throw error;
    }
  }

  getSandboxTestCredentials() {
    if (!this.isSandbox()) {
      return null;
    }

    return {
      merchantId: '1227368',
      testCards: {
        visa: '5xxx xxxx xxxx 4454',
        mastercard: '5xxx xxxx xxxx 4454',
      },
      testMobile: '0771234567',
      instructions: [
        '1. Use test card number: 5xxx xxxx xxxx 4454',
        '2. Use any future expiry date (MM/YY)',
        '3. Use any 3-digit CVV',
        '4. For mobile payments, use: 0771234567',
        '5. Enter any OTP when prompted',
      ],
    };
  }
}

export const payHereService = new PayHereService();

export function formatCurrency(amount: number): string {
  return `LKR ${amount.toFixed(2)}`;
}

export function validatePaymentAmount(amount: number): boolean {
  return amount > 0 && amount <= 1000000;
}
