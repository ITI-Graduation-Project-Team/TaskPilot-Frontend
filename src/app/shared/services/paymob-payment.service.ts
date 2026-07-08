import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class PaymobPaymentService {

  initiatePayment(iframeUrl: string): void {
    if (!iframeUrl) {
      console.error('Paymob: iframe URL is empty');
      return;
    }
    // Redirect to Paymob hosted payment page
    window.location.href = iframeUrl;
  }
}
