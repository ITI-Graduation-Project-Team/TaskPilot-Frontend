import { Component, signal, AfterViewInit, NgZone } from '@angular/core';
import { CommonModule, DOCUMENT } from '@angular/common';
import { Inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { authApi, extractApiError } from '../../../../shared/api/auth.api';
import { saveTokens } from '../../../../shared/lib/auth/cookie.helper';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { AuthService } from '../../../../shared/api/auth.service';
import { CookieService } from 'ngx-cookie-service';
import { environment } from '../../../../../environments/environment';

type PageState = 'idle' | 'loading' | 'success' | 'error';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, TranslatePipe],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent implements AfterViewInit {
  email = signal('');
  password = signal('');
  showPassword = signal(false);
  rememberMe = signal(false);
  state = signal<PageState>('idle');
  errorMessage = signal('');
  successMessage = signal('');

  currentLang = signal('en');

  constructor(
    private router: Router,
    private translate: TranslateService,
    private authService: AuthService,
    private cookieService: CookieService,
    private ngZone: NgZone,
    @Inject(DOCUMENT) private document: Document
  ) {
    const savedLang = localStorage.getItem('app_lang') || 'en';
    this.currentLang.set(savedLang);
    this.translate.use(savedLang);
    this.document.documentElement.dir = savedLang === 'ar' ? 'rtl' : 'ltr';
    this.document.documentElement.lang = savedLang;
  }

  ngAfterViewInit() {
    this.initializeGoogleSignIn();
  }

  private initializeGoogleSignIn() {
    if (typeof google === 'undefined' || !google.accounts || !google.accounts.id) {
      setTimeout(() => this.initializeGoogleSignIn(), 200);
      return;
    }

    google.accounts.id.initialize({
      client_id: environment.googleClientId || '586738650387-koc3m0suvmmc1bsndim8mqls2rpvj9td.apps.googleusercontent.com',
      callback: this.handleGoogleCredential.bind(this)
    });

    const buttonContainer = document.getElementById('google-btn-container');
    if (buttonContainer) {
      google.accounts.id.renderButton(buttonContainer, {
        theme: 'outline',
        size: 'large',
        width: buttonContainer.offsetWidth || 300,
        text: 'continue_with'
      });
    }
  }

  handleGoogleCredential(response: any) {
    this.ngZone.run(() => {
      this.state.set('loading');
      this.errorMessage.set('');

      this.authService.googleLogin(response.credential).subscribe({
        next: (res) => {
          if (res.succeeded && res.data) {
            this.cookieService.set(environment.auth.tokenKey, res.data.token, 7, '/');
            if (res.data.roles && res.data.roles.length > 0) {
              localStorage.setItem('userRole', res.data.roles[0]);
            }
            this.successMessage.set(res.message || 'Signed in successfully! Redirecting…');
            this.state.set('success');
            setTimeout(() => this.router.navigate(['/']), 1800);
          } else {
            this.state.set('error');
            this.errorMessage.set(res.message || 'Google Sign-In failed');
          }
        },
        error: (err) => {
          this.state.set('error');
          this.errorMessage.set(extractApiError(err) || 'Google Sign-In failed');
        }
      });
    });
  }

  onGoogleSignIn() {
    if (typeof google !== 'undefined' && google.accounts && google.accounts.id) {
      google.accounts.id.prompt();
    }
  }

  toggleLanguage() {
    const newLang = this.currentLang() === 'en' ? 'ar' : 'en';
    this.currentLang.set(newLang);
    localStorage.setItem('app_lang', newLang);
    this.translate.use(newLang);
    this.document.documentElement.dir = newLang === 'ar' ? 'rtl' : 'ltr';
    this.document.documentElement.lang = newLang;
  }

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