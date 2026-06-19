import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-board',
  standalone: true,
  imports: [CommonModule],
  // استخدام الـ Inline Template لتفادي أي مشاكل في مسارات ملفات الـ HTML
  template: `
    <div class="bg-brandWhite p-6 rounded-xl shadow-sm border border-brandAccent min-h-[400px]">
      <h2 class="text-2xl font-bold text-brandSecondary mb-6">Current Sprint Tasks</h2>
      <div class="text-gray-500">
        Task Board is working! (Entities and Features will be added here later).
      </div>
    </div>
  `
})
export class BoardComponent { // <--- تم تصحيح اسم الكلاس هنا
  
}