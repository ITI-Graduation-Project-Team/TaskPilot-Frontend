import { Component, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { authApi, extractApiError } from '../../../../shared/api/auth.api';

type PageState = 'idle' | 'loading' | 'success' | 'error';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './reset-password.component.html',
  styleUrls: ['./reset-password.component.scss'],
})
export class ResetPasswordComponent implements OnInit {
  otp = signal('');
  email = signal('');
  password = signal('');
  confirmPassword = signal('');
  showPassword = signal(false);
  showConfirm = signal(false);
  state = signal<PageState>('idle');
  errorMessage = signal('');

  constructor(private router: Router) {}

  ngOnInit() {
    // Retrieve email passed from forgot-password page
    const nav = this.router.getCurrentNavigation();
    const stateEmail = nav?.extras?.state?.['email'] as string | undefined;
    if (stateEmail) {
      this.email.set(stateEmail);
    }
  }

  get isLoading() {
    return this.state() === 'loading';
  }

  get isSuccess() {
    return this.state() === 'success';
  }

  get passwordStrength(): 'weak' | 'medium' | 'strong' | null {
    const p = this.password();
    if (!p) return null;
    const hasUpper = /[A-Z]/.test(p);
    const hasLower = /[a-z]/.test(p);
    const hasNum = /\d/.test(p);
    const hasSpecial = /[^A-Za-z0-9]/.test(p);
    const score = [hasUpper, hasLower, hasNum, hasSpecial].filter(Boolean).length;
    if (p.length < 6) return 'weak';
    if (score <= 2) return 'weak';
    if (score === 3) return 'medium';
    return 'strong';
  }

  togglePassword() {
    this.showPassword.update((v) => !v);
  }

  toggleConfirm() {
    this.showConfirm.update((v) => !v);
  }

  async onSubmit() {
    const otpVal = this.otp().trim();
    const emailVal = this.email().trim();
    const passVal = this.password();
    const confirmVal = this.confirmPassword();

    // Validation
    if (!otpVal || !emailVal || !passVal || !confirmVal) {
      this.state.set('error');
      this.errorMessage.set('All fields are required.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailVal)) {
      this.state.set('error');
      this.errorMessage.set('Please enter a valid email address.');
      return;
    }

    if (passVal.length < 6) {
      this.state.set('error');
      this.errorMessage.set('Password must be at least 6 characters.');
      return;
    }

    if (passVal !== confirmVal) {
      this.state.set('error');
      this.errorMessage.set('Passwords do not match.');
      return;
    }

    this.state.set('loading');
    this.errorMessage.set('');

    try {
      const { data } = await authApi.resetPassword({ otp: otpVal, email: emailVal, password: passVal });
      if (data.succeeded === false) {
        this.state.set('error');
        this.errorMessage.set(
          data.errors?.map((e) => e.description).join(' ') || data.message
        );
        return;
      }
      this.state.set('success');
      setTimeout(() => {
        this.router.navigate(['/login']);
      }, 2000);
    } catch (err: any) {
      this.state.set('error');
      this.errorMessage.set(extractApiError(err));
    }
  }
}
