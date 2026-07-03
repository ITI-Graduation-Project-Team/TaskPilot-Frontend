import { Component, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { authApi, extractApiError } from '../../../../shared/api/auth.api';

type PageState = 'idle' | 'loading' | 'success' | 'error';

@Component({
  selector: 'app-confirm-email',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './confirm-email.component.html',
  styleUrls: ['./confirm-email.component.scss'],
})
export class ConfirmEmailComponent implements OnInit {
  email        = signal('');
  otp          = signal('');
  state        = signal<PageState>('idle');
  errorMessage = signal('');
  resendState  = signal<'idle' | 'loading' | 'sent'>('idle');

  /** Individual OTP digit signals for the 6-box UI */
  digits = signal<string[]>(['', '', '', '', '', '']);

  constructor(private route: ActivatedRoute, private router: Router) {}

  ngOnInit() {
    const email = this.route.snapshot.queryParamMap.get('email') ?? '';
    this.email.set(email);
  }

  get isLoading()  { return this.state() === 'loading'; }
  get isSuccess()  { return this.state() === 'success'; }
  get maskedEmail() {
    const e = this.email();
    const [local, domain] = e.split('@');
    if (!local || !domain) return e;
    return local.slice(0, 2) + '***@' + domain;
  }

  /** Called when a digit box changes */
  onDigitInput(index: number, event: Event) {
    const input = event.target as HTMLInputElement;
    let val = input.value.replace(/\D/g, '');
    if (val.length > 0) {
      val = val.substring(val.length - 1);
    }
    
    const d = [...this.digits()];
    d[index] = val;
    this.digits.set(d);
    this.otp.set(d.join(''));

    // Explicitly set the input value to prevent double character display
    input.value = val;

    // Auto-focus next box using setTimeout to prevent key event bleeding
    if (val && index < 5) {
      setTimeout(() => {
        const next = document.getElementById(`otp-${index + 1}`) as HTMLInputElement;
        next?.focus();
        next?.select();
      }, 0);
    }
  }

  onDigitKeydown(index: number, event: KeyboardEvent) {
    if (event.key === 'Backspace') {
      const d = [...this.digits()];
      if (d[index]) {
        d[index] = '';
        this.digits.set(d);
        this.otp.set(d.join(''));
        event.preventDefault();
      } else if (index > 0) {
        d[index - 1] = '';
        this.digits.set(d);
        this.otp.set(d.join(''));
        setTimeout(() => {
          const prev = document.getElementById(`otp-${index - 1}`) as HTMLInputElement;
          prev?.focus();
        }, 0);
        event.preventDefault();
      }
    }
  }

  onDigitPaste(event: ClipboardEvent) {
    const text = event.clipboardData?.getData('text') ?? '';
    const nums = text.replace(/\D/g, '').slice(0, 6).split('');
    const d = [...this.digits()];
    nums.forEach((n, i) => { d[i] = n; });
    this.digits.set(d);
    this.otp.set(d.join(''));
    event.preventDefault();
    
    // Focus last filled or last box using setTimeout
    const lastIdx = Math.min(nums.length, 5);
    setTimeout(() => {
      const el = document.getElementById(`otp-${lastIdx}`) as HTMLInputElement;
      el?.focus();
    }, 0);
  }

  async onSubmit() {
    const code = this.digits().join('');
    if (code.length < 6) {
      this.state.set('error');
      this.errorMessage.set('Please enter the complete 6-digit code.');
      return;
    }
    if (!this.email()) {
      this.state.set('error');
      this.errorMessage.set('Email address is missing. Please go back and register again.');
      return;
    }

    this.state.set('loading');
    this.errorMessage.set('');

    try {
      const { data } = await authApi.confirmEmail({ email: this.email(), otp: code });
      if (data.succeeded === false) {
        this.state.set('error');
        this.errorMessage.set(
          data.errors?.map((e) => e.description).join(' ') || data.message
        );
        return;
      }
      this.state.set('success');
      setTimeout(() => this.router.navigate(['/login']), 2000);
    } catch (err: any) {
      this.state.set('error');
      this.errorMessage.set(extractApiError(err));
    }
  }
}
