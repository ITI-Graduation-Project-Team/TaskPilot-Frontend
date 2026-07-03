import { Injectable } from '@angular/core';
import { loadScript, PayPalScriptOptions, PayPalNamespace } from '@paypal/paypal-js';
import { environment } from '../../../environments/environment';

/**
 * Manages the PayPal.js lifecycle: lazy initialization and redirect flows.
 * Uses `loadScript()` for async bundle loading so the PayPal SDK is never
 * eagerly imported.
 */
@Injectable({ providedIn: 'root' })
export class PaypalPaymentService {
  private paypalPromise?: Promise<PayPalNamespace | null>;

  constructor() {}

  /** Returns the initialized PayPal instance, or null if loading failed. */
  private async getPayPal(): Promise<PayPalNamespace | null> {
    if (!this.paypalPromise) {
      const options: PayPalScriptOptions = {
        clientId: environment.paypalClientId,
        currency: 'USD', // Adjust this to match your system currency if necessary
        intent: 'subscription',
        vault: true
      };
      this.paypalPromise = loadScript(options);
    }
    return this.paypalPromise as Promise<PayPalNamespace | null>;
  }

  /**
   * Initiates the PayPal payment flow by redirecting the user to the approval URL.
   * This is a simple redirect because PayPal handles subscription approvals on its own page.
   * 
   * @param approvalUrl The PayPal approval URL returned by the backend (inside clientSecret).
   */
  async initiatePayment(approvalUrl: string): Promise<void> {
    const paypal = await this.getPayPal();
    if (!paypal) {
      console.error('PayPal SDK could not be initialized.');
      // Fallback redirect if SDK fails to load but we have the URL
    }
    
    // Redirect the user to the PayPal approval page
    window.location.href = approvalUrl;
  }
}
