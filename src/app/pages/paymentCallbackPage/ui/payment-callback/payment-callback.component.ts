import { Component, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { userSubscriptionApi } from '../../../../shared/api/user-subscription.api';

type CallbackState = 'loading' | 'pending' | 'processing' | 'cancel';

@Component({
  selector: 'app-payment-callback',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './payment-callback.component.html',
  styleUrls: ['./payment-callback.component.scss']
})
export class PaymentCallbackComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  state = signal<CallbackState>('loading');
  private pollInterval: any;

  ngOnInit() {
    const status = this.route.snapshot.queryParamMap.get('status');
    const payerId = this.route.snapshot.queryParamMap.get('PayerID');

    if (status === 'cancel') {
      this.state.set('cancel');
    } else if (status === 'success' || payerId) {
      this.verifySubscription();
    } else {
      // Fallback for unknown parameters
      this.state.set('pending');
    }
  }

  ngOnDestroy() {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
    }
  }

  async verifySubscription() {
    let attempts = 0;
    const maxAttempts = 10;
    this.pollInterval = setInterval(async () => {
      attempts++;
      try {
        const res = await userSubscriptionApi.getCurrent();
        const status = res.data.data?.status;
        
        if (res.data.succeeded && (status === 'Active' || status === 'Trialing')) {
          clearInterval(this.pollInterval);
          this.router.navigate(['/subscription'], { queryParams: { paymentSuccess: 'true' } });
        } else if (res.data.succeeded && (status === 'Expired' || status === 'Canceled')) {
          clearInterval(this.pollInterval);
          this.state.set('cancel');
        } else if (attempts >= maxAttempts) {
          clearInterval(this.pollInterval);
          if (status === 'Pending') {
            this.state.set('processing');
          } else {
            this.state.set('pending');
          }
        }
      } catch (err) {
        if (attempts >= maxAttempts) {
          clearInterval(this.pollInterval);
          this.state.set('pending');
        }
      }
    }, 3000);
  }

  goToSubscription() {
    this.router.navigate(['/subscription']);
  }
}
