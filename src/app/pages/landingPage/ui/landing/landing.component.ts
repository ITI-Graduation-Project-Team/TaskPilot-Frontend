import { Component, signal, OnInit, Inject, inject } from '@angular/core';
import { CommonModule, DOCUMENT } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [CommonModule, RouterLink, TranslatePipe],
  templateUrl: './landing.component.html',
  styleUrls: ['./landing.component.scss'],
})
export class LandingComponent implements OnInit {
  theme = signal<'light' | 'dark'>('light');
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
    // Theme initialization
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const initialTheme = savedTheme || (prefersDark ? 'dark' : 'light');

    this.theme.set(initialTheme as 'light' | 'dark');
    this.applyTheme(initialTheme);
  }

  toggleTheme() {
    const newTheme = this.theme() === 'light' ? 'dark' : 'light';
    this.theme.set(newTheme);
    localStorage.setItem('theme', newTheme);
    this.applyTheme(newTheme);
  }

  private applyTheme(theme: string) {
    if (theme === 'dark') {
      this.document.documentElement.classList.add('dark');
    } else {
      this.document.documentElement.classList.remove('dark');
    }
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
