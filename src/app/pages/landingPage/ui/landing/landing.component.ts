import { Component, signal, OnInit, Inject, inject } from '@angular/core';
import { CommonModule, DOCUMENT } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { ThemeService } from '../../../../shared/services/theme.service';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [CommonModule, RouterLink, TranslatePipe],
  templateUrl: './landing.component.html',
  styleUrls: ['./landing.component.scss'],
})
export class LandingComponent implements OnInit {
  themeService = inject(ThemeService);
  currentLang = signal('en');

  private router = inject(Router);

  constructor(
    private translate: TranslateService,
    @Inject(DOCUMENT) private document: Document
  ) {
    const savedLang = localStorage.getItem('app_lang') || 'en';
    this.currentLang.set(savedLang);
    this.translate.use(savedLang);
    this.updateLanguageMeta(savedLang);
  }

  ngOnInit() {
    // ThemeService handles initialization automatically
  }

  toggleTheme() {
    this.themeService.toggle();
  }

  // Expose for template binding - returns 'dark' | 'light' compatible with existing HTML
  theme(): 'light' | 'dark' {
    return this.themeService.isDark() ? 'dark' : 'light';
  }

  get isDark(): boolean {
    return this.themeService.isDark();
  }

  toggleLanguage() {
    const newLang = this.currentLang() === 'en' ? 'ar' : 'en';
    this.currentLang.set(newLang);
    localStorage.setItem('app_lang', newLang);
    this.translate.use(newLang);
    this.updateLanguageMeta(newLang);
  }

  private updateLanguageMeta(lang: string) {
    this.document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    this.document.documentElement.lang = lang;
  }
}
