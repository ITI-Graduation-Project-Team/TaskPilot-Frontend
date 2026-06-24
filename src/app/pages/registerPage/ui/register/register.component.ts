import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { authApi, RegisterPayload, extractApiError } from '../../../../shared/api/auth.api';

export type RegisterRole = 'Employee' | 'ProjectManager';
type PageState = 'idle' | 'loading' | 'success' | 'error';
type Step = 'role' | 'form';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss'],
})
export class RegisterComponent {
  step           = signal<Step>('role');
  selectedRole   = signal<RegisterRole | null>(null);

  firstNameEn    = signal('');
  lastNameEn     = signal('');
  firstNameAr    = signal('');
  lastNameAr     = signal('');
  email          = signal('');
  password       = signal('');
  confirmPassword = signal('');
  showPassword   = signal(false);
  showConfirm    = signal(false);
  state          = signal<PageState>('idle');
  errorMessage   = signal('');

  constructor(private router: Router) {}

  get isLoading() { return this.state() === 'loading'; }
  get isSuccess()  { return this.state() === 'success'; }

  get passwordStrength(): 'weak' | 'medium' | 'strong' | null {
    const p = this.password();
    if (!p) return null;
    const score = [/[A-Z]/, /[a-z]/, /\d/, /[^A-Za-z0-9]/].filter((r) => r.test(p)).length;
    if (p.length < 6 || score <= 1) return 'weak';
    if (score === 2 || score === 3) return 'medium';
    return 'strong';
  }

  selectRole(role: RegisterRole) {
    this.selectedRole.set(role);
    this.step.set('form');
  }

  goBackToRole() {
    this.step.set('role');
    this.state.set('idle');
    this.errorMessage.set('');
  }

  togglePassword() { this.showPassword.update((v) => !v); }
  toggleConfirm()  { this.showConfirm.update((v) => !v); }

  async onSubmit() {
    const p = this.password();
    const cp = this.confirmPassword();

    if (!this.firstNameEn() || !this.lastNameEn() || !this.firstNameAr() ||
        !this.lastNameAr() || !this.email() || !p || !cp) {
      this.state.set('error');
      this.errorMessage.set('All fields are required.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.email())) {
      this.state.set('error');
      this.errorMessage.set('Please enter a valid email address.');
      return;
    }
    if (p !== cp) {
      this.state.set('error');
      this.errorMessage.set('Passwords do not match.');
      return;
    }

    this.state.set('loading');
    this.errorMessage.set('');

    const payload: RegisterPayload = {
      firstNameEn: this.firstNameEn().trim(),
      lastNameEn:  this.lastNameEn().trim(),
      firstNameAr: this.firstNameAr().trim(),
      lastNameAr:  this.lastNameAr().trim(),
      email:       this.email().trim(),
      password:    p,
    };

    const role = this.selectedRole()!;

    try {
      const { data } = await authApi.register(payload, role);
      if (data.succeeded === false) {
        this.state.set('error');
        this.errorMessage.set(
          data.errors?.map((e) => e.description).join(' ') || data.message
        );
        return;
      }
      this.state.set('success');
      setTimeout(() =>
        this.router.navigate(['/confirm-email'], {
          queryParams: { email: this.email().trim() },
        }), 1200);
    } catch (err: any) {
      this.state.set('error');
      this.errorMessage.set(extractApiError(err));
    }
  }
}
