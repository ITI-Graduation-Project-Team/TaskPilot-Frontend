import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { authApi, extractApiError } from '../../../../shared/api/auth.api';
import { saveTokens } from '../../../../shared/lib/auth/cookie.helper';

type PageState = 'idle' | 'loading' | 'success' | 'error';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent {
  email = signal('');
  password = signal('');
  showPassword = signal(false);
  rememberMe = signal(false);
  state = signal<PageState>('idle');
  errorMessage = signal('');
  successMessage = signal('');

  constructor(private router: Router) { }

  get isLoading() { return this.state() === 'loading'; }
  get isSuccess() { return this.state() === 'success'; }

  togglePassword() { this.showPassword.update((v) => !v); }

  async onSubmit() {
    if (!this.email().trim() || !this.password()) {
      this.state.set('error');
      this.errorMessage.set('Email and password are required.');
      return;
    }

    this.state.set('loading');
    this.errorMessage.set('');

    try {
      const { data } = await authApi.login({
        email: this.email().trim(),
        password: this.password(),
      });

      if (data.succeeded === false) {
        this.state.set('error');
        this.errorMessage.set(
          data.errors?.map((e) => e.description).join(' ') || data.message
        );
        return;
      }

      const tokenData = data.data as any;
      const accessToken = tokenData?.accessToken || tokenData?.token;
      const refreshToken = tokenData?.refreshToken;

      if (accessToken && refreshToken) {
        saveTokens(accessToken, refreshToken);
      }
      this.successMessage.set(data.message || 'Signed in successfully! Redirecting…');
      this.state.set('success');
      setTimeout(() => this.router.navigate(['/']), 1800);
    } catch (err: any) {
      this.state.set('error');
      this.errorMessage.set(extractApiError(err));
    }
  }
}
