import { Component, signal, inject } from '@angular/core';
import { CommonModule, DOCUMENT } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { AuthService } from '../../../../shared/api/auth.service';
import { saveTokens } from '../../../../shared/lib/auth/cookie.helper';

@Component({
  selector: 'app-select-role',
  standalone: true,
  imports: [CommonModule, RouterModule, TranslatePipe],
  templateUrl: './select-role.html',
  styleUrls: ['./select-role.scss']
})
export class SelectRoleComponent {
  private router = inject(Router);
  private translate = inject(TranslateService);
  private authService = inject(AuthService);
  private document = inject(DOCUMENT);

  public currentLang = signal('en');

  constructor() {
    const savedLang = localStorage.getItem('app_lang') || 'en';
    this.currentLang.set(savedLang);
    this.translate.use(savedLang);
  }

  toggleLanguage() {
    const newLang = this.currentLang() === 'en' ? 'ar' : 'en';
    this.currentLang.set(newLang);
    this.translate.use(newLang);
    localStorage.setItem('app_lang', newLang);
    this.document.documentElement.dir = newLang === 'ar' ? 'rtl' : 'ltr';
  }

  selectRole(role: 'Employee' | 'ProjectManager') {
    const idToken = sessionStorage.getItem('googleIdToken');
    if (!idToken) {
      this.router.navigate(['/login']);
      return;
    }

    this.authService.googleCompleteSignup(idToken, role).subscribe({
      next: (res) => {
        if (res.succeeded && res.data) {
          const token = res.data.token;
          const refreshToken = res.data.refreshToken;
          if (token && refreshToken) {
            saveTokens(token, refreshToken);
          }
          localStorage.setItem('userRole', role);
          localStorage.setItem('isProfileCompleted', 'false');
          sessionStorage.removeItem('googleIdToken');
          
          const isProfileCompleted = false; // Fresh signup

          // Navigation logic
          if (role === 'ProjectManager') {
            this.router.navigate(['/company-setup']);
          } else {
            this.router.navigate(['/complete-profile']);
          }
        }
      },
      error: (err) => {
        console.error('Failed to complete Google signup:', err);
        this.router.navigate(['/login']);
      }
    });
  }
}
