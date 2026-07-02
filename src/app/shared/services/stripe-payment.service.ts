import { Injectable } from '@angular/core';
import {
  loadStripe,
  Stripe,
  StripeElements,
  StripeCardElement,
} from '@stripe/stripe-js';
import { environment } from '../../../environments/environment';

/**
 * Manages the Stripe.js lifecycle: lazy initialization, card element creation,
 * and payment confirmation. Uses `loadStripe()` for async bundle loading so
 * the Stripe SDK is never eagerly imported.
 *
 * SECURITY: Only the publishable key (`pk_test_...` / `pk_live_...`) is used here.
 * The secret key (`sk_...`) must NEVER appear in frontend code.
 */
@Injectable({ providedIn: 'root' })
export class StripePaymentService {
  private stripePromise: Promise<Stripe | null>;

  constructor() {
    // Stripe.js is loaded lazily — the bundle is not fetched until getStripe() is first called.
    this.stripePromise = loadStripe(environment.stripePublishableKey);
  }

  /** Returns the initialized Stripe instance, or null if loading failed. */
  private async getStripe(): Promise<Stripe | null> {
    return this.stripePromise;
  }

  /**
   * Creates a Stripe Elements card input and mounts it into the given DOM element.
   * Returns the stripe instance, elements container, and card element for later use.
   *
   * @param mountTarget The HTMLElement into which the card input will be mounted.
   * @param inputBorderColor The border color to match the app's input style.
   */
  async createAndMountCard(
    mountTarget: HTMLElement,
    inputBorderColor = '#DECCCC'
  ): Promise<{ stripe: Stripe; elements: StripeElements; card: StripeCardElement } | null> {
    const stripe = await this.getStripe();
    if (!stripe) return null;

    const elements = stripe.elements({
      appearance: {
        theme: 'stripe',
        variables: {
          colorPrimary: '#D51C39',
          colorBackground: '#F6F6F6',
          colorText: '#121338',
          colorDanger: '#D51C39',
          fontFamily: 'system-ui, sans-serif',
          borderRadius: '10px',
        },
        rules: {
          '.Input': {
            border: `1.5px solid ${inputBorderColor}`,
            boxShadow: 'none',
            padding: '12px',
          },
          '.Input:focus': {
            border: '1.5px solid #D51C39',
            boxShadow: '0 0 0 2px rgba(213, 28, 57, 0.15)',
            outline: 'none',
          },
        },
      },
    });

    // Using the legacy Card Element for maximum compatibility.
    const card = elements.create('card', {
      hidePostalCode: true,
      style: {
        base: {
          color: '#121338',
          fontFamily: 'system-ui, sans-serif',
          fontSize: '15px',
          '::placeholder': { color: '#9ca3af' },
        },
        invalid: { color: '#D51C39' },
      },
    });

    card.mount(mountTarget);
    return { stripe, elements, card };
  }

  /**
   * Confirms a Stripe card payment using the client secret returned by the backend.
   *
   * @param clientSecret The `clientSecret` from the `POST api/usersubscriptions` response.
   * @param card The mounted StripeCardElement.
   * @returns An object with an optional `error` string if payment confirmation failed.
   */
  async confirmPayment(
    clientSecret: string,
    card: StripeCardElement
  ): Promise<{ error?: string }> {
    const stripe = await this.getStripe();
    if (!stripe) return { error: 'Stripe could not be initialized.' };

    const result = await stripe.confirmCardPayment(clientSecret, {
      payment_method: { card },
    });

    if (result.error) {
      return { error: result.error.message ?? 'Payment confirmation failed.' };
    }

    return {};
  }

  /**
   * Confirms a Stripe card setup using the client secret returned by the backend
   * for trial subscriptions. This saves the card WITHOUT charging it.
   * Stripe will auto-charge when the trial period ends.
   *
   * IMPORTANT: This is NOT the same as confirmPayment (confirmCardPayment).
   * Trial → confirmCardSetup (saves card, $0 charge)
   * Paid  → confirmCardPayment (charges card now)
   *
   * @param clientSecret The `clientSecret` from the `POST api/usersubscriptions` response (SetupIntent).
   * @param card The mounted StripeCardElement.
   * @returns An object with an optional `error` string if card setup failed.
   */
  async confirmCardSetup(
    clientSecret: string,
    card: StripeCardElement
  ): Promise<{ error?: string }> {
    const stripe = await this.getStripe();
    if (!stripe) return { error: 'Stripe could not be initialized.' };

    const result = await stripe.confirmCardSetup(clientSecret, {
      payment_method: { card },
    });

    if (result.error) {
      return { error: result.error.message ?? 'Card setup failed.' };
    }

    return {};
  }
}
