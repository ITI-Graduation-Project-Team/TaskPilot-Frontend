import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-admin-coming-soon',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="min-h-screen bg-gray-50 dark:bg-[#121212] flex flex-col items-center justify-center p-6 transition-colors duration-300">
      <div class="max-w-md w-full bg-white dark:bg-[#1e1e1e] rounded-2xl shadow-sm dark:shadow-none border border-gray-100 dark:border-gray-800 p-8 text-center">
        <div class="w-16 h-16 bg-blue-50 dark:bg-blue-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg class="w-8 h-8 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path>
          </svg>
        </div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white mb-3">
          Subscription Plan Management
        </h1>
        <p class="text-gray-500 dark:text-gray-400 mb-2">
          This feature is coming soon.
        </p>
        <p class="text-sm text-gray-400 dark:text-gray-500">
          You will be able to create, edit, and manage subscription plans here.
        </p>
      </div>
    </div>
  `
})
export class AdminComingSoonComponent {}
