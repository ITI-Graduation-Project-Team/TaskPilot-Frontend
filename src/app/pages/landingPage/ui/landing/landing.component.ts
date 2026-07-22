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

  // Quotes logic
  quotes = [
    { text: 'landing.quote1', author: 'TaskPilot' },
    { text: 'landing.quote2', author: 'Agile Team' },
    { text: 'landing.quote3', author: 'Productivity' }
  ];
  currentQuoteIndex = signal(0);
  isFading = signal(false);
  private quoteInterval: any;

  // Tabs logic for Features Section
  tabIds = ['ai', 'projects', 'digital', 'operations', 'client'];
  activeTabId = signal('ai');

  selectTab(id: string) {
    this.activeTabId.set(id);
  }

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
    this.startQuoteRotation();
  }

  ngOnDestroy() {
    if (this.quoteInterval) {
      clearInterval(this.quoteInterval);
    }
  }

  private startQuoteRotation() {
    // Rotate every 5 seconds
    this.quoteInterval = setInterval(() => {
      // Trigger fade out
      this.isFading.set(true);
      
      // Wait for fade out animation to finish (e.g., 500ms), then change quote and fade in
      setTimeout(() => {
        this.currentQuoteIndex.update(idx => (idx + 1) % this.quotes.length);
        this.isFading.set(false);
      }, 500);
    }, 5000);
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
