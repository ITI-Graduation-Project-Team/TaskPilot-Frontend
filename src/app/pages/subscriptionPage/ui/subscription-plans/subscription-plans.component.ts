import { Component, OnInit, OnDestroy, signal, computed, ViewChild, ElementRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { userSubscriptionApi } from '../../../../shared/api/user-subscription.api';
import { subscriptionPlanApi } from '../../../../shared/api/subscription-plan.api';
import { StripePaymentService } from '../../../../shared/services/stripe-payment.service';
import { PaypalPaymentService } from '../../../../shared/services/paypal-payment.service';
import { ToastService } from '../../../../shared/services/toast.service';
import { SubscriptionPlanDto, UserSubscriptionDto, BillingCycle, PaymentGateway } from '../../../../shared/api/subscription.models';
import { StripeCardElement } from '@stripe/stripe-js';
import { ActivatedRoute, Router } from '@angular/router';

type PageState = 'loading' | 'loaded' | 'error_403' | 'error_generic';

@Component({
  selector: 'app-subscription-plans',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './subscription-plans.component.html',
  styleUrls: ['./subscription-plans.component.scss']
})
export class SubscriptionPlansComponent implements OnInit, OnDestroy {
  private stripeService = inject(StripePaymentService);
  private paypalService = inject(PaypalPaymentService);
  private toastService = inject(ToastService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  pageState = signal<PageState>('loading');

  // Data
  plans = signal<SubscriptionPlanDto[]>([]);
  maxAnnualSavingPercent = computed(() => {
    let max = 0;
    for (const plan of this.plans()) {
      if (plan.monthlyPrice > 0) {
        const savings = Math.round(((plan.monthlyPrice * 12 - plan.annualPrice) / (plan.monthlyPrice * 12)) * 100);
        if (savings > max) max = savings;
      }
    }
    return max;
  });
  currentSub = signal<UserSubscriptionDto | null>(null);

  // UI State
  billingCycle = signal<BillingCycle>('Monthly');
  selectedPlan = signal<SubscriptionPlanDto | null>(null);
  showPaymentForm = signal(false);
  selectedGateway = signal<PaymentGateway>('Stripe');

  // Payment Form State
  autoRenew = signal(true);
  isPaying = signal(false);
  paymentError = signal<string | null>(null);

  private pollInterval: any;

  // Free Plan Confirm State
  showFreeConfirm = signal<SubscriptionPlanDto | null>(null);

  // Cancel Form State
  showCancelConfirm = signal(false);
  isCanceling = signal(false);

  // Trial State
  selectedPlanForTrial: number | null = null;
  usedTrialPlanIds = new Set<number>();

  // Stripe
  @ViewChild('cardElementContainer', { static: false }) cardContainer!: ElementRef;
  private cardElement: StripeCardElement | null = null;

  ngOnInit() {
    this.loadData();
    this.checkPaymentSuccess();
  }

  ngOnDestroy() {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
    }
  }

  checkPaymentSuccess() {
    const paymentSuccess = this.route.snapshot.queryParamMap.get('paymentSuccess');
    if (paymentSuccess === 'true') {
      this.toastService.show('🎉 Payment confirmed! Your subscription is now active.', 'success');
      // Remove the query param from URL without navigating
      this.router.navigate([], {
        relativeTo: this.route,
        queryParams: {},
        replaceUrl: true
      });
    }
  }

  async loadData() {
    this.pageState.set('loading');

    try {
      let noSubscription = false;

      // 1. Load current sub (404 is fine, means no sub)
      try {
        const subRes = await userSubscriptionApi.getCurrent();
        if (subRes.data.succeeded && subRes.data.data) {
          this.currentSub.set(subRes.data.data);
        }
      } catch (err: any) {
        if (err.response?.status === 404) {
          noSubscription = true;
        } else {
          console.error('Error fetching current subscription:', err);
        }
        // Proceed even if no subscription
      }

      // 2. Load plans
      const plansRes = await subscriptionPlanApi.getAll();
      if (plansRes.data.succeeded && plansRes.data.data) {
        const loadedPlans = plansRes.data.data;
        this.plans.set(loadedPlans);

        // Auto-enroll if no subscription
        if (noSubscription) {
          const freePlan = loadedPlans.find(
            p => p.monthlyPrice === 0 && p.annualPrice === 0
          );
          if (freePlan) {
            try {
              await userSubscriptionApi.subscribe({
                subscriptionPlanId: freePlan.id,
                billingCycle: 'Monthly',
                autoRenew: false,
                gateway: undefined as any,
                paymentMethodId: undefined,
                returnUrl: undefined,
                cancelUrl: undefined
              });
              
              // Refetch current sub after successful auto-enrollment
              const newSubRes = await userSubscriptionApi.getCurrent();
              if (newSubRes.data.succeeded && newSubRes.data.data) {
                this.currentSub.set(newSubRes.data.data);
              }
            } catch (autoErr) {
              console.error('Failed to auto-enroll in Free plan:', autoErr);
            }
          }
        }

        this.pageState.set('loaded');
      } else {
        this.pageState.set('error_generic');
      }

    } catch (err: any) {
      if (err.response?.status === 403) {
        // Backend hasn't opened this endpoint to ProjectManagers yet
        this.pageState.set('error_403');
      } else {
        this.pageState.set('error_generic');
      }
    }
  }

  setBillingCycle(cycle: BillingCycle) {
    this.billingCycle.set(cycle);
  }

  isCurrentPlan(planId: number): boolean {
    const sub = this.currentSub();
    return !!sub && sub.subscriptionPlanId === planId &&
      (sub.status === 'Active' || sub.status === 'Trialing' || sub.status === 'Pending');
  }

  canDowngradeToFree(): boolean {
    const sub = this.currentSub();
    if (!sub) return false;
    const currentPlan = this.plans().find(p => p.id === sub.subscriptionPlanId);
    if (!currentPlan) return false;
    return currentPlan.monthlyPrice > 0 || currentPlan.annualPrice > 0;
  }

  showChoosePlanButton(plan: SubscriptionPlanDto): boolean {
    if (this.isCurrentPlan(plan.id)) return false;
    
    // For free plan, only show if we can downgrade
    if (plan.monthlyPrice === 0 && plan.annualPrice === 0) {
      return this.canDowngradeToFree();
    }
    
    // For paid plans, always show if not current
    return true;
  }

  getSavingsPercentage(plan: SubscriptionPlanDto): number {
    const monthlyTotal = plan.monthlyPrice * 12;
    if (monthlyTotal <= plan.annualPrice || monthlyTotal === 0) return 0;
    return Math.round(((monthlyTotal - plan.annualPrice) / monthlyTotal) * 100);
  }

  async choosePlan(plan: SubscriptionPlanDto) {
    if (plan.monthlyPrice === 0 && plan.annualPrice === 0) {
      this.showFreeConfirm.set(plan);
      this.showPaymentForm.set(false);
      this.selectedPlan.set(null);
      this.unmountStripe();
      return;
    }

    this.selectedPlan.set(plan);
    this.selectedGateway.set('Stripe'); // Default to Stripe
    this.showPaymentForm.set(true);
    this.showFreeConfirm.set(null);
    this.paymentError.set(null);
    this.isPaying.set(false);

    // If trial is selected for this plan, force auto-renew on
    if (this.isTrialSelected(plan)) {
      this.autoRenew.set(true);
    }

    this.mountStripe();
  }

  toggleTrial(planId: number) {
    if (this.selectedPlanForTrial === planId) {
      this.selectedPlanForTrial = null;
    } else {
      this.selectedPlanForTrial = planId;
    }
  }

  isTrialSelected(plan: SubscriptionPlanDto): boolean {
    return plan.hasTrial && plan.trialDays > 0 && this.selectedPlanForTrial === plan.id;
  }

  selectGateway(gateway: PaymentGateway) {
    if (this.selectedGateway() === gateway) return;

    this.selectedGateway.set(gateway);
    this.paymentError.set(null);

    if (gateway === 'PayPal') {
      this.unmountStripe();
    } else if (gateway === 'Stripe') {
      this.mountStripe();
    }
  }

  private mountStripe() {
    setTimeout(async () => {
      if (this.cardContainer) {
        const result = await this.stripeService.createAndMountCard(this.cardContainer.nativeElement);
        if (result) {
          this.cardElement = result.card;

          // Listen for validation errors
          this.cardElement.on('change', (event) => {
            if (event.error) {
              this.paymentError.set(event.error.message);
            } else {
              this.paymentError.set(null);
            }
          });
        }
      }
    }, 50);
  }

  cancelPayment() {
    this.showPaymentForm.set(false);
    this.selectedPlan.set(null);
    this.unmountStripe();
  }

  private unmountStripe() {
    if (this.cardElement) {
      this.cardElement.destroy();
      this.cardElement = null;
    }
  }

  async processPayment() {
    if (this.isPaying() || !this.selectedPlan()) return;

    this.isPaying.set(true);
    this.paymentError.set(null);

    try {
      const returnUrl = `${window.location.origin}/payment/callback`;
      const cancelUrl = `${window.location.origin}/subscription`;

      const plan = this.selectedPlan()!;
      const trialActive = this.isTrialSelected(plan);

      // 1. Call our backend to create the subscription
      const subRes = await userSubscriptionApi.subscribe({
        subscriptionPlanId: plan.id,
        billingCycle: this.billingCycle(),
        autoRenew: this.autoRenew(),
        gateway: this.selectedGateway(),
        paymentMethodId: null,
        returnUrl,
        cancelUrl,
        isTrial: trialActive
      });

      if (!subRes.data.succeeded) {
        // Track "already used trial" at session level
        if (trialActive && subRes.data.message?.includes('already used the free trial')) {
          this.usedTrialPlanIds.add(plan.id);
          this.selectedPlanForTrial = null;
        }
        this.paymentError.set(subRes.data.message || 'Subscription failed.');
        this.isPaying.set(false);
        return;
      }

      const newSub = subRes.data.data;

      if (this.selectedGateway() === 'Stripe') {
        if (newSub?.clientSecret && this.cardElement) {
          // ── Critical branching: Trial vs Paid Stripe confirmation ──
          // Trial  → confirmCardSetup  (saves card, $0 charge today)
          // Paid   → confirmCardPayment (charges card immediately)
          if (newSub.isSetupIntent) {
            // Trial flow — save card without charging
            const setupRes = await this.stripeService.confirmCardSetup(newSub.clientSecret, this.cardElement);
            if (setupRes.error) {
              this.paymentError.set(setupRes.error);
              this.isPaying.set(false);
              return;
            }
          } else {
            // Normal paid flow — charge card now
            const stripeRes = await this.stripeService.confirmPayment(newSub.clientSecret, this.cardElement);
            if (stripeRes.error) {
              this.paymentError.set(stripeRes.error);
              this.isPaying.set(false);
              return;
            }
          }
        }

        // Success — begin polling
        this.cancelPayment();
        let attempts = 0;
        const maxAttempts = 10;
        this.pollInterval = setInterval(async () => {
          attempts++;
          try {
            const subRes = await userSubscriptionApi.getCurrent();
            const status = subRes.data.data?.status;
            
            if (status === 'Trialing') {
              // Trial started successfully
              clearInterval(this.pollInterval);
              this.toastService.show(
                `🎉 Your ${plan.trialDays}-day free trial has started! Enjoy ${plan.name}.`,
                'success'
              );
              await this.loadData();
            } else if (status === 'Active') {
              // Normal paid subscription activated
              clearInterval(this.pollInterval);
              this.toastService.show('Payment confirmed successfully!', 'success');
              await this.loadData();
            } else if (status === 'Expired' || status === 'Canceled') {
              clearInterval(this.pollInterval);
              this.toastService.show('Payment failed or was canceled.', 'error');
              this.isPaying.set(false);
              await this.loadData();
            } else if (attempts >= maxAttempts) {
              clearInterval(this.pollInterval);
              this.toastService.show('Your payment is processing — this page will update automatically', 'success');
              this.isPaying.set(false);
              await this.loadData();
            }
          } catch (err) {
            if (attempts >= maxAttempts) {
              clearInterval(this.pollInterval);
              await this.loadData();
            }
          }
        }, 3000);

      } else if (this.selectedGateway() === 'PayPal') {
        const approvalUrl = newSub?.clientSecret; // For PayPal, clientSecret contains the approval URL
        if (!approvalUrl) {
          this.toastService.show('PayPal approval URL not received. Please try again.', 'error');
          this.isPaying.set(false);
          return;
        }
        try {
          await this.paypalService.initiatePayment(approvalUrl);
        } catch (error) {
          this.toastService.show('Failed to initiate PayPal payment.', 'error');
          this.isPaying.set(false);
        }
      }

    } catch (err: any) {
      const msg = err.response?.data?.message || 'An error occurred during payment.';
      // Track "already used trial" at session level (from error response)
      if (this.selectedPlan() && msg.includes('already used the free trial')) {
        this.usedTrialPlanIds.add(this.selectedPlan()!.id);
        this.selectedPlanForTrial = null;
      }
      this.paymentError.set(msg);
      this.isPaying.set(false);
    }
  }

  // --- Cancel Subscription Flow ---

  showCancelButton(): boolean {
    const sub = this.currentSub();
    const plan = this.plans().find(p => p.id === sub?.subscriptionPlanId);
    if (!sub || !plan) return false;
    
    return (sub.status === 'Active' || sub.status === 'Trialing') &&
           plan.monthlyPrice > 0 &&
           !sub.cancelAtPeriodEnd;
  }

  initiateCancel() {
    this.showCancelConfirm.set(true);
  }

  abortCancel() {
    this.showCancelConfirm.set(false);
  }

  async confirmCancel() {
    const sub = this.currentSub();
    if (!sub || this.isCanceling()) return;

    this.isCanceling.set(true);

    try {
      await userSubscriptionApi.cancel(sub.id);
      this.toastService.show('Subscription canceled successfully.', 'success');
      this.showCancelConfirm.set(false);
      await this.loadData();
    } catch (err: any) {
      this.toastService.show(err.response?.data?.message || 'Failed to cancel subscription.', 'error');
    } finally {
      this.isCanceling.set(false);
    }
  }

  // --- Free Plan Flow ---

  cancelFreeConfirm() {
    this.showFreeConfirm.set(null);
    this.paymentError.set(null);
  }

  async confirmFreePlan() {
    const plan = this.showFreeConfirm();
    if (!plan || this.isPaying()) return;

    this.isPaying.set(true);
    this.paymentError.set(null);

    try {
      const subRes = await userSubscriptionApi.subscribe({
        subscriptionPlanId: plan.id,
        billingCycle: 'Monthly',
        autoRenew: false,
        gateway: undefined as any,
        paymentMethodId: undefined,
        returnUrl: undefined,
        cancelUrl: undefined
      });

      if (!subRes.data.succeeded) {
        this.paymentError.set(subRes.data.message || 'Failed to switch to Free plan.');
        this.isPaying.set(false);
        return;
      }

      this.toastService.show('✓ You are now on the Free plan', 'success');
      this.showFreeConfirm.set(null);
      await this.loadData();
    } catch (err: any) {
      const msg = err.response?.data?.message || 'An error occurred during switch.';
      this.paymentError.set(msg);
    } finally {
      this.isPaying.set(false);
    }
  }
}
