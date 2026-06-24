import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { authApi, extractApiError } from '../../../../shared/api/auth.api';

type PageState = 'idle' | 'loading' | 'success' | 'error';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './forgot-password.component.html',
  styleUrls: ['./forgot-password.component.scss'],
})
export class ForgotPasswordComponent {
  email = signal('');
  state = signal<PageState>('idle');
  errorMessage = signal('');

  constructor(private router: Router) {}

  get isLoading() {
    return this.state() === 'loading';
  }

  get isSuccess() {
    return this.state() === 'success';
  }

  async onSubmit() {
    const emailVal = this.email().trim();

    if (!emailVal) {
      this.state.set('error');
      this.errorMessage.set('Please enter your email address.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailVal)) {
      this.state.set('error');
      this.errorMessage.set('Please enter a valid email address.');
      return;
    }

    this.state.set('loading');
    this.errorMessage.set('');

    try {
      await authApi.forgotPassword({ email: emailVal });
      this.state.set('success');
      // Navigate to reset password after 1.5 s, passing email via state
      setTimeout(() => {
        this.router.navigate(['/reset-password'], {
          state: { email: emailVal },
        });
      }, 1500);
    } catch (err: any) {
      this.state.set('error');
      this.errorMessage.set(extractApiError(err));
    }
  }
}
