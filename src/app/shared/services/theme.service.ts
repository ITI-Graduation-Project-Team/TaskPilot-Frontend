import { Injectable, signal, effect, inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';

const THEME_KEY = 'theme'; // Single source of truth for theme key

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private document = inject(DOCUMENT);

  isDark = signal<boolean>(this.loadInitialTheme());

  constructor() {
    // Apply theme immediately on service creation
    this.applyTheme(this.isDark());

    // Reactively apply whenever isDark changes
    effect(() => {
      this.applyTheme(this.isDark());
    });
  }

  private loadInitialTheme(): boolean {
    const saved = localStorage.getItem(THEME_KEY);
    if (saved) return saved === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  }

  private applyTheme(dark: boolean) {
    if (dark) {
      this.document.documentElement.classList.add('dark');
      this.document.documentElement.classList.remove('light-mode');
    } else {
      this.document.documentElement.classList.remove('dark');
      this.document.documentElement.classList.add('light-mode');
    }
    localStorage.setItem(THEME_KEY, dark ? 'dark' : 'light');
  }

  toggle() {
    this.isDark.update(v => !v);
  }

  setDark(dark: boolean) {
    this.isDark.set(dark);
  }
}
