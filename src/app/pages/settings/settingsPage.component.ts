import { Component, CUSTOM_ELEMENTS_SCHEMA, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { ToastService } from '../../shared/services/toast.service';
import { AiTelemetryComponent } from './ui/ai-telemetry/ai-telemetry.component';

@Component({
  selector: 'app-settings-page',
  standalone: true,
  imports: [CommonModule, RouterOutlet, TranslatePipe, AiTelemetryComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `
    <div class="w-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white min-h-[calc(100vh-4rem)] rounded-tl-3xl relative">
      
      <!-- Page Content -->
      <main class="p-4 sm:p-6 md:p-8 animate-fade-in relative z-0">
        <!-- Background decorative element for the main area -->
        <div class="absolute top-0 left-0 right-0 h-64 bg-gradient-to-b from-indigo-50/50 to-transparent dark:from-indigo-900/10 dark:to-transparent pointer-events-none -z-10"></div>
        
        <div class="max-w-5xl mx-auto space-y-8">
          <!-- [My Wallet Task] بداية قسم المحفظة الخاص بمدير المشروع فقط -->
          <!-- تم إخفاء الواجهة عبر التعليقات كما طلبت -->
          @if (false) {
          <section class="bg-white dark:bg-slate-900 rounded-3xl shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-200 dark:border-slate-800 overflow-hidden transition-all duration-300 hover:shadow-2xl hover:shadow-emerald-500/5 group">
            
            <!-- [My Wallet Task] الشريط العلوي الخاص بعنوان المحفظة -->
            <div class="px-8 py-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 backdrop-blur-xl flex items-center justify-between">
              <h2 class="font-bold text-slate-800 dark:text-white text-xl flex items-center gap-3">
                <span class="p-2 bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-xl">
                  <!-- [My Wallet Task] أيقونة المحفظة -->
                  <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                  </svg>
                </span>
                My Wallet
              </h2>
              <span class="text-xs font-semibold px-3 py-1 bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400 rounded-full uppercase tracking-wider">{{ 'EMPLOYEES.ACTIVE' | translate }}</span>
            </div>
            
            <div class="p-8">
              <!-- [My Wallet Task] بطاقة عرض الرصيد وتفاصيل الشحن -->
              <div class="relative flex flex-col md:flex-row md:items-center justify-between gap-6 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-emerald-50/50 dark:hover:bg-slate-800/50 transition-all duration-300">
                <!-- [My Wallet Task] تأثير التدرج اللوني عند تمرير الماوس -->
                <div class="absolute inset-0 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 opacity-0 group-hover:opacity-10 transition-opacity duration-300 pointer-events-none -z-10"></div>
                
                <div class="flex items-start gap-5">
                  <!-- [My Wallet Task] الأيقونة بجانب الرصيد الحالي -->
                  <div class="w-16 h-16 rounded-2xl bg-white shadow-md shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-700 flex items-center justify-center shrink-0 transform group-hover:scale-105 group-hover:-rotate-3 transition-transform duration-300">
                    <svg class="w-9 h-9 text-emerald-500" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M11.8 10.9c-2.27-.59-3-1.2-3-2.15 0-1.09 1.01-1.85 2.7-1.85 1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81V3h-3v2.16c-1.94.42-3.5 1.68-3.5 3.61 0 2.31 1.91 3.46 4.7 4.13 2.5.6 3 1.48 3 2.41 0 .69-.49 1.79-2.7 1.79-2.06 0-2.87-.92-2.98-2.1h-2.2c.12 2.19 1.76 3.42 3.68 3.83V21h3v-2.15c1.95-.37 3.5-1.5 3.5-3.55 0-2.84-2.43-3.81-4.7-4.4z"/>
                    </svg>
                  </div>
                  <div class="text-left rtl:text-right">
                    <h3 class="font-bold text-slate-900 dark:text-white text-lg tracking-tight group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors duration-200">
                      Current Balance
                    </h3>
                    <div class="flex items-baseline gap-1 mt-1">
                      <!-- [My Wallet Task] عرض الرصيد وتنسيقه كأرقام بـ 2 علامات عشرية -->
                      <span class="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">&#36;{{ balance() | number:'1.2-2' }}</span>
                      <span class="text-sm text-slate-500 dark:text-slate-400 font-medium">USD</span>
                    </div>
                    <p class="text-sm text-slate-500 dark:text-slate-400 mt-2 leading-relaxed max-w-xl">
                      Manage your wallet balance to cover premium API costs, priority support, or unlock special features.
                    </p>
                  </div>
                </div>
                
                <!-- [My Wallet Task] زر الشحن التفاعلي (يرتبط بدالة rechargeWallet) -->
                <button 
                  (click)="rechargeWallet()" 
                  [disabled]="isRecharging()"
                  class="shrink-0 relative overflow-hidden inline-flex items-center justify-center px-8 py-3.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-emerald-600 dark:hover:bg-emerald-500 text-sm font-bold rounded-xl shadow-lg shadow-slate-900/20 dark:shadow-white/10 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-emerald-500/30 disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none focus:outline-none focus:ring-4 focus:ring-emerald-500/30">
                  
                  <span class="absolute inset-0 bg-white/20 dark:bg-black/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out"></span>
                  
                  <!-- [My Wallet Task] إذا كان الشحن قيد التنفيذ، يتم إظهار دائرة التحميل -->
                  @if (isRecharging()) {
                    <svg class="animate-spin -ml-1 mr-3 rtl:ml-3 rtl:-mr-1 h-5 w-5 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Processing...</span>
                  } @else {
                    <!-- [My Wallet Task] الحالة العادية لزر الشحن -->
                    <span class="relative flex items-center gap-2">
                      <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
                      </svg>
                      Recharge Wallet
                    </span>
                  }
                </button>
              </div>
            </div>
          </section>
          }
          <!-- [My Wallet Task] نهاية قسم المحفظة -->

          <!-- AI Telemetry Section -->
          <div class="relative z-10 animate-fade-in" style="animation-delay: 100ms;">
            <app-ai-telemetry></app-ai-telemetry>
          </div>

          <!-- Nested Settings Routes -->
          <div class="relative z-10">
            <router-outlet></router-outlet>
          </div>
        </div>
        
      </main>
    </div>
  `
})
export class SettingsPageComponent {
  // تم إعادة تفعيل هذه الأكواد فقط لتجنب أخطاء الكومبايلر (Angular Compiler Errors)
  // الواجهة ستظل مخفية بفضل استخدام @if(false) في الـ HTML

  // [My Wallet Task] استدعاء خدمة الإشعارات لعرض رسائل نجاح الشحن
  private toastService = inject(ToastService);

  // [My Wallet Task] متغير تفاعلي يخزن رصيد المحفظة الحالي (الافتراضي 150 دولار)
  balance = signal(150.00);
  
  // [My Wallet Task] متغير تفاعلي يتتبع حالة زر الشحن (إذا كان قيد التنفيذ أم لا)
  isRecharging = signal(false);

  // [My Wallet Task] الدالة المسؤولة عن محاكاة عملية شحن المحفظة
  rechargeWallet() {
    this.isRecharging.set(true); // تغيير حالة الزر لـ "جاري المعالجة"

    // [My Wallet Task] محاكاة اتصال وهمي بالـ API يستغرق ثانية ونصف
    setTimeout(() => {
      this.balance.update(b => b + 50.00); // إضافة 50 دولار إلى الرصيد
      this.isRecharging.set(false); // إرجاع الزر لحالته الطبيعية
      this.toastService.show('Successfully recharged $50.00 to your wallet!', 'success'); // عرض رسالة منبثقة بنجاح الشحن
    }, 1500);
  }
}
