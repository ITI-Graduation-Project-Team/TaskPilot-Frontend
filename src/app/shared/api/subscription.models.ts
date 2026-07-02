// ── Enum Types ──────────────────────────────────────────────────────────────
// Serialized as strings by the backend (JsonStringEnumConverter)

export type BillingCycle = 'Monthly' | 'Annually';
export type SubscriptionStatus = 'Active' | 'Expired' | 'Canceled' | 'Trialing' | 'Pending';
export type PaymentGateway = 'Stripe' | 'PayPal' | 'Fawry' | 'VodafoneCash';

// ── Response DTOs ────────────────────────────────────────────────────────────

/** Matches the backend `SubscriptionPlanDto`. */
export interface SubscriptionPlanDto {
  id: number;
  name: string;
  monthlyPrice: number;
  annualPrice: number;
  /** ISO 4217 currency code — currently always "EGP". */
  currency: string;
  maxProjects: number;
  maxUsersPerProject: number;
  hasAi: boolean;
  hasAdvancedAnalytics: boolean;
  hasTrial: boolean;
  trialDays: number;
}

/** Matches the backend `UserSubscriptionDto`. */
export interface UserSubscriptionDto {
  id: string;
  projectManagerId: string;
  subscriptionPlanId: number;
  planName: string;
  /** ISO 8601 date-time string. */
  startDate: string;
  /** ISO 8601 date-time string. */
  endDate: string;
  billingCycle: BillingCycle;
  status: SubscriptionStatus;
  autoRenew: boolean;
  isTrial: boolean;
  /** ISO 8601 date-time string, or null if not a trial. */
  trialEndDate: string | null;
  cancelAtPeriodEnd: boolean;
  /** 
   * Multi-purpose field for payment confirmation:
   * - Stripe: The Stripe Payment Intent client secret.
   * - PayPal: The PayPal approval URL to redirect to.
   * Null for free/trial plans.
   */
  clientSecret: string | null;
  isSetupIntent: boolean;
}

// ── Request DTOs ─────────────────────────────────────────────────────────────

/** Request body for `POST api/usersubscriptions`. */
export interface CreateUserSubscriptionDto {
  subscriptionPlanId: number;
  billingCycle: BillingCycle;
  autoRenew: boolean;
  gateway: PaymentGateway;
  /** Stripe PaymentMethod ID — pass null when using the card element flow. */
  paymentMethodId?: string | null;
  /** PayPal return URL for successful payment approval */
  returnUrl?: string;
  /** PayPal cancel URL for aborted payment */
  cancelUrl?: string;
  /** True when the user wants to start a free trial instead of paying immediately. */
  isTrial?: boolean;
}
