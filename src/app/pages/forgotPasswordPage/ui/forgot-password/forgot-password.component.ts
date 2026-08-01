import { Component, signal, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { authApi, extractApiError } from '../../../../shared/api/auth.api';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { DOCUMENT } from '@angular/common';

type PageState = 'idle' | 'loading' | 'success' | 'error';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, TranslatePipe],
  templateUrl: './forgot-password.component.html',
  styleUrls: ['./forgot-password.component.scss'],
})
export class ForgotPasswordComponent {
  email = signal('');
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
      this.errorMessage.set(this.translate.instant('forgotPassword.errRequired'));
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailVal)) {
      this.state.set('error');
      this.errorMessage.set(this.translate.instant('forgotPassword.errInvalid'));
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
