import { Component, signal, OnInit, OnDestroy, Inject, inject } from '@angular/core';
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
export class LandingComponent implements OnInit, OnDestroy {
  themeService = inject(ThemeService);
  currentLang = signal('en');

  // Quotation rotator
  quotes = ['landing.quote1', 'landing.quote2', 'landing.quote3'];
  activeQuoteIndex = signal(0);
  isFadingOut = signal(false);
  private quoteInterval: any;

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
    this.startQuoteRotator();
  }

  ngOnDestroy() {
    if (this.quoteInterval) {
      clearInterval(this.quoteInterval);
    }
  }

  private startQuoteRotator() {
    this.quoteInterval = setInterval(() => {
      this.isFadingOut.set(true);
      setTimeout(() => {
        this.activeQuoteIndex.update(i => (i + 1) % this.quotes.length);
        this.isFadingOut.set(false);
      }, 500); // 500ms fade duration
    }, 4500);
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
