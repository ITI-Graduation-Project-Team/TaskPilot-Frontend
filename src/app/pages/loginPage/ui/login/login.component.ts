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
import { getRedirectForRole } from '../../../../shared/lib/auth/role-redirect';

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
  private googleInitialized = false;

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
    if (this.googleInitialized) return;

    if (typeof google === 'undefined' || !google.accounts || !google.accounts.id) {
      setTimeout(() => this.initializeGoogleSignIn(), 200);
      return;
    }

    this.googleInitialized = true;
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
            localStorage.removeItem('userRole');
            this.cookieService.set(environment.auth.tokenKey, res.data.token, 7, '/');
            // Ensure it's in localStorage so the new profile.service.ts can read it
            localStorage.setItem(environment.auth.tokenKey, res.data.token);

            this.successMessage.set(res.message || 'Signed in successfully! Redirecting…');
            this.state.set('success');

            const role = this.authService.getUserRole();
            if (role) {
              localStorage.setItem('userRole', role);
            }
            const route = role === 'Employee' ? ['/complete-profile'] : [getRedirectForRole(role)];
            setTimeout(() => this.router.navigate(route), 1800);
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
          data.errors?.map((e: any) => e.description).join(' ') || data.message
        );
        return;
      }

      localStorage.removeItem('userRole');

      const tokenData = data.data as any;
      const accessToken = tokenData?.accessToken || tokenData?.token;
      const refreshToken = tokenData?.refreshToken;
      const role = tokenData?.roles?.[0] || tokenData?.role || '';

      if (accessToken && refreshToken) {
        saveTokens(accessToken, refreshToken);
        // Ensure it's in localStorage so the new profile.service.ts can read it
        localStorage.setItem(environment.auth.tokenKey, accessToken);
      }
      if (role) {
        localStorage.setItem('userRole', role);
      }

      this.successMessage.set(data.message || 'Signed in successfully! Redirecting…');
      this.state.set('success');

      const userRole = this.authService.getUserRole() || role;
      const route = userRole === 'Employee' ? ['/complete-profile'] : [getRedirectForRole(userRole)];
      setTimeout(() => this.router.navigate(route), 1800);
    } catch (err: any) {
      this.state.set('error');
      this.errorMessage.set(extractApiError(err));
    }
  }
}