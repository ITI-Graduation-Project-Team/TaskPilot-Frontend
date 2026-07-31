import { Component, signal, OnInit, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { authApi, extractApiError } from '../../../../shared/api/auth.api';
import { TranslateService, TranslatePipe } from '@ngx-translate/core';
import { DOCUMENT } from '@angular/common';

type PageState = 'idle' | 'loading' | 'success' | 'error';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, TranslatePipe],
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
  currentLang = signal('en');

  constructor(
    private router: Router,
    private translate: TranslateService,
    @Inject(DOCUMENT) private document: Document
  ) {
    const savedLang = localStorage.getItem('app_lang') || 'en';
    this.currentLang.set(savedLang);
    this.translate.use(savedLang);
    this.document.documentElement.dir = savedLang === 'ar' ? 'rtl' : 'ltr';
    this.document.documentElement.lang = savedLang;
  }

  toggleLanguage() {
    const newLang = this.currentLang() === 'en' ? 'ar' : 'en';
    this.currentLang.set(newLang);
    localStorage.setItem('app_lang', newLang);
    this.translate.use(newLang);
    this.document.documentElement.dir = newLang === 'ar' ? 'rtl' : 'ltr';
    this.document.documentElement.lang = newLang;
  }

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
    const confPassVal = this.confirmPassword();

    // Validation
    if (!emailVal || !otpVal || !passVal || !confPassVal) {
      this.state.set('error');
      this.errorMessage.set(this.translate.instant('resetPassword.errAllRequired'));
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailVal)) {
      this.state.set('error');
      this.errorMessage.set(this.translate.instant('resetPassword.errInvalidEmail'));
      return;
    }

    if (passVal.length < 6) {
      this.state.set('error');
      this.errorMessage.set(this.translate.instant('resetPassword.errPasswordLength'));
      return;
    }

    if (passVal !== confPassVal) {
      this.state.set('error');
      this.errorMessage.set(this.translate.instant('resetPassword.errPasswordMatch'));
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
