import { Component, signal, OnInit, AfterViewInit, ChangeDetectionStrategy, Injector, Inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { authApi, extractApiError } from '../../../../shared/api/auth.api';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { DOCUMENT, CommonModule } from '@angular/common';
import { saveTokens } from '../../../../shared/lib/auth/cookie.helper';
import { environment } from '../../../../../environments/environment';

type PageState = 'idle' | 'loading' | 'success' | 'error';

@Component({
  selector: 'app-confirm-email',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, TranslatePipe],
  templateUrl: './confirm-email.component.html',
  styleUrls: ['./confirm-email.component.scss'],
})
export class ConfirmEmailComponent implements OnInit, AfterViewInit {
  email        = signal('');
  otp          = signal('');
  state        = signal<PageState>('idle');
  errorMessage = signal('');
  resendState  = signal<'idle' | 'loading' | 'sent'>('idle');
  currentLang = signal('en');

  /** Individual OTP digit signals for the 6-box UI */
  digits = signal<string[]>(['', '', '', '', '', '']);

  constructor(
    private route: ActivatedRoute, 
    private router: Router, 
    private injector: Injector,
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
    const email = this.route.snapshot.queryParamMap.get('email') ?? '';
    this.email.set(email);
  }

  ngAfterViewInit() {
    setTimeout(() => {
      const firstInput = document.getElementById('otp-0') as HTMLInputElement;
      firstInput?.focus();
    }, 100);
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
    if (event.key === 'Enter') {
      event.preventDefault();
      this.onSubmit();
      return;
    }
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
    const emailVal = this.email();
    if (!emailVal) {
      this.state.set('error');
      this.errorMessage.set(this.translate.instant('confirmEmail.errEmailMissing'));
      return;
    }
    const otpVal = this.otp().trim();
    if (otpVal.length < 6) {
      this.state.set('error');
      this.errorMessage.set(this.translate.instant('confirmEmail.errCodeRequired'));
      return;
    }

    this.state.set('loading');
    this.errorMessage.set('');

    try {
      const { data } = await authApi.confirmEmail({ email: this.email(), otp: otpVal });
      if (data.succeeded === false) {
        this.state.set('error');
        this.errorMessage.set(
          data.errors?.map((e) => e.description).join(' ') || data.message
        );
        return;
      }

      // Save tokens exactly as login does
      const tokenData = data.data as any;
      const accessToken = tokenData?.accessToken || tokenData?.token;
      const refreshToken = tokenData?.refreshToken;
      const role = tokenData?.roles?.[0] || tokenData?.role || '';

      if (accessToken && refreshToken) {
        saveTokens(accessToken, refreshToken);
        localStorage.setItem(environment.auth.tokenKey, accessToken);
      }
      if (role) {
        localStorage.setItem('userRole', role);
      }
      const isProfileCompleted = tokenData?.isProfileCompleted === true;
      localStorage.setItem('isProfileCompleted', isProfileCompleted ? 'true' : 'false');

      this.state.set('success');
      
      const invToken = sessionStorage.getItem('invitationToken');
      import('../../../../shared/api/auth.service').then(m => {
        const authServiceRef = this.injector.get(m.AuthService);
        const currentRole = authServiceRef.getUserRole();
        const routePath = currentRole === 'Employee' ? '/complete-profile' : '/company-setup';

        if (invToken) {
          authApi.completeInvitation(invToken)
            .then((completeRes) => {
              if (completeRes.data?.succeeded === false) {
                console.error('Failed to complete invitation:', completeRes.data?.message);
              }
              sessionStorage.removeItem('invitationToken');
              setTimeout(() => this.router.navigate([routePath]), 2000);
            })
            .catch((e) => {
              console.error('Failed to complete invitation', e);
              setTimeout(() => this.router.navigate([routePath]), 2000);
            });
        } else {
          setTimeout(() => this.router.navigate([routePath]), 2000);
        }
      });
    } catch (err: any) {
      this.state.set('error');
      this.errorMessage.set(extractApiError(err));
    }
  }

  async onResend() {
    if (!this.email()) return;
    this.resendState.set('loading');
    this.state.set('idle');
    this.errorMessage.set('');

    try {
      const res = await authApi.resendConfirmation({ email: this.email() });
      if (res.data.succeeded) {
        this.resendState.set('sent');
        // Reset state after a few seconds so they can resend again if needed
        setTimeout(() => this.resendState.set('idle'), 5000);
      } else {
        this.resendState.set('idle');
        this.state.set('error');
        this.errorMessage.set(res.data.message || 'Failed to resend confirmation email.');
      }
    } catch (err: any) {
      this.resendState.set('idle');
      this.state.set('error');
      this.errorMessage.set(extractApiError(err) || 'Error resending confirmation email.');
    }
  }
}
