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
            // Save token to cookie — AuthService will decode role from it
            this.cookieService.set(environment.auth.tokenKey, res.data.token, 7, '/');

            this.successMessage.set(res.message || 'Signed in successfully! Redirecting…');
            this.state.set('success');

            // Role is now read from the JWT itself via AuthService
            const role = this.authService.getUserRole();
            const isProfileCompleted = (res.data as any).isProfileCompleted;
            
            const invToken = sessionStorage.getItem('invitationToken');
            if (invToken) {
              authApi.completeInvitation(invToken).then(() => {
                sessionStorage.removeItem('invitationToken');
                setTimeout(() => this.router.navigate(['/dashboard']), 1800);
              }).catch(e => {
                console.error("Failed to complete invitation", e);
                setTimeout(() => this.router.navigate([getRedirectForRole(role, isProfileCompleted)]), 1800);
              });
            } else {
              setTimeout(() => this.router.navigate([getRedirectForRole(role, isProfileCompleted)]), 1800);
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

      const tokenData = data.data as any;
      const accessToken = tokenData?.accessToken || tokenData?.token;
      const refreshToken = tokenData?.refreshToken;
      const isProfileCompleted = tokenData?.isProfileCompleted;

      if (accessToken && refreshToken) {
        saveTokens(accessToken, refreshToken);
      }

      this.successMessage.set(data.message || 'Signed in successfully! Redirecting…');
      this.state.set('success');

      // Role is decoded from the saved JWT — no localStorage needed
      const role = this.authService.getUserRole();
      
      const invToken = sessionStorage.getItem('invitationToken');
      if (invToken) {
        try {
          await authApi.completeInvitation(invToken);
          sessionStorage.removeItem('invitationToken');
          setTimeout(() => this.router.navigate(['/dashboard']), 1800);
        } catch (e) {
          console.error("Failed to complete invitation", e);
          setTimeout(() => this.router.navigate([getRedirectForRole(role, isProfileCompleted)]), 1800);
        }
      } else {
        setTimeout(() => this.router.navigate([getRedirectForRole(role, isProfileCompleted)]), 1800);
      }
    } catch (err: any) {
      this.state.set('error');
      this.errorMessage.set(extractApiError(err));
    }
  }
}