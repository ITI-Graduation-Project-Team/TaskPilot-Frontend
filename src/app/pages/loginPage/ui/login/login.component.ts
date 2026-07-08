import { Component, signal, AfterViewInit, NgZone, OnInit, inject } from '@angular/core';
import { CommonModule, DOCUMENT } from '@angular/common';
import { Inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
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
export class LoginComponent implements AfterViewInit, OnInit {
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

  private route = inject(ActivatedRoute);

  ngOnInit() {
    const emailParam = this.route.snapshot.queryParamMap.get('email');
    if (emailParam) {
      this.email.set(emailParam);
    }
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
            const token = res.data.token;
            const refreshToken = res.data.refreshToken;
            if (token && refreshToken) {
              saveTokens(token, refreshToken);
            } else if (token) {
              this.cookieService.set(environment.auth.tokenKey, token, 7, '/');
            }
            // Ensure it's in localStorage so the new profile.service.ts can read it
            localStorage.setItem(environment.auth.tokenKey, token);

            const role = this.authService.getUserRole();
            if (role) {
              localStorage.setItem('userRole', role);
            }
            const fullName = (res.data as any).fullName;
            if (fullName) {
              localStorage.setItem('userFullName', fullName);
            }
            const isProfileCompleted = (res.data as any).isProfileCompleted === true;

            const invToken = sessionStorage.getItem('invitationToken');
            if (invToken) {
              authApi.completeInvitation(invToken).then(() => {
                sessionStorage.removeItem('invitationToken');
                this.router.navigate(['/dashboard']);
              }).catch(e => {
                console.error("Failed to complete invitation", e);
                this.router.navigate(this.getRouteForRole(role, isProfileCompleted));
              });
            } else {
              this.router.navigate(this.getRouteForRole(role, isProfileCompleted));
            }
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
      if (tokenData?.fullName) {
        localStorage.setItem('userFullName', tokenData.fullName);
      }

      this.successMessage.set(data.message || 'Signed in successfully! Redirecting…');
      this.state.set('success');

      const userRole = this.authService.getUserRole() || role;
      const isProfileCompleted = tokenData?.isProfileCompleted === true;

      const invToken = sessionStorage.getItem('invitationToken');
      if (invToken) {
        try {
          await authApi.completeInvitation(invToken);
          sessionStorage.removeItem('invitationToken');
          setTimeout(() => this.router.navigate(['/dashboard']), 1800);
        } catch (e) {
          console.error("Failed to complete invitation", e);
          setTimeout(() => this.router.navigate(this.getRouteForRole(userRole, isProfileCompleted)), 1800);
        }
      } else {
        setTimeout(() => this.router.navigate(this.getRouteForRole(userRole, isProfileCompleted)), 1800);
      }
    } catch (err: any) {
      this.state.set('error');
      this.errorMessage.set(extractApiError(err));
    }
  }

  getRouteForRole(role: string | null, isProfileCompleted: boolean): string[] {
    let route = ['/dashboard'];
    if (role === 'Employee') {
      route = isProfileCompleted ? ['/dashboard'] : ['/complete-profile'];
    } else if (role === 'ProjectManager') {
      route = isProfileCompleted ? ['/dashboard'] : ['/company-setup'];
    } else if (role) {
      route = [getRedirectForRole(role)];
    }
    return route;
  }
}