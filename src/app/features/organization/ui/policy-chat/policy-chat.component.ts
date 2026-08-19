import { Component, ChangeDetectionStrategy, signal, inject, ViewChild, ElementRef, AfterViewChecked, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { CompanyPoliciesService } from '../../../../shared/api/company-policies.service';
import { ProjectStateService } from '../../../../shared/services/project-state.service';
import { ToastService } from '../../../../shared/services/toast.service';
import { ConfirmDialogService } from '../../../../shared/services/confirm-dialog.service';
import { TranslateService } from '@ngx-translate/core';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

@Component({
  selector: 'app-policy-chat',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex flex-col h-[650px] max-h-[75vh] bg-surface rounded-3xl border border-border shadow-sm overflow-hidden relative">
      
      <!-- Header -->
      <div class="px-6 py-5 border-b border-border bg-sidebar/50 flex items-center justify-between shrink-0">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-sm border border-primary/20">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"/></svg>
          </div>
          <div>
            <h3 class="text-base font-bold text-text-primary font-display">
              {{ currentLang === 'ar' ? 'محادث السياسات' : 'HR Policy Assistant' }}
            </h3>
            <p class="text-xs text-text-secondary">
              {{ currentLang === 'ar' ? 'اسأل عن إرشادات الشركة وسياسات الإجازات وغيرها.' : 'Ask questions about company guidelines, leave policies, etc.' }}
            </p>
          </div>
        </div>
        <button (click)="clearChat()" class="text-[11px] font-bold text-text-secondary hover:text-error transition-colors px-3 py-1.5 rounded-lg hover:bg-error/10">
          {{ currentLang === 'ar' ? 'مسح المحادثة' : 'Clear Chat' }}
        </button>
      </div>

      <!-- Chat Messages Area -->
      <div class="flex-1 overflow-y-auto p-6 space-y-6 bg-background/30" #scrollContainer>
        @if (messages().length === 0) {
          <div class="h-full flex flex-col items-center justify-center text-center max-w-md mx-auto animate-[fadeIn_0.5s_ease_both]">
            <div class="w-16 h-16 rounded-full bg-primary/5 border-2 border-primary/10 flex items-center justify-center text-primary mb-4">
              <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/></svg>
            </div>
            <h4 class="text-lg font-bold text-text-primary mb-2 font-display">
              {{ currentLang === 'ar' ? 'كيف يمكنني مساعدتك اليوم؟' : 'How can I help you today?' }}
            </h4>
            <p class="text-sm text-text-secondary mb-6">
              {{ currentLang === 'ar' ? 'لقد قرأت جميع سياسات الشركة. اسألني عن الإجازات، العمل عن بعد، أو قواعد السلوك.' : 'I have read all the company policies uploaded by your manager. Ask me anything about vacations, remote work, or code of conduct.' }}
            </p>
            
            @if (hasDocuments()) {
              <div class="flex flex-wrap justify-center gap-2">
                <button (click)="suggestQuestion(currentLang === 'ar' ? 'كم عدد أيام الإجازة المتاحة لي؟' : 'How many vacation days do I have?')" class="px-4 py-2 bg-surface border border-border hover:border-primary/40 rounded-xl text-xs font-semibold text-text-secondary hover:text-primary transition-all">
                  {{ currentLang === 'ar' ? 'أيام الإجازة' : 'Vacation days' }}
                </button>
                <button (click)="suggestQuestion(currentLang === 'ar' ? 'ما هي سياسة العمل عن بعد؟' : 'What is the remote work policy?')" class="px-4 py-2 bg-surface border border-border hover:border-primary/40 rounded-xl text-xs font-semibold text-text-secondary hover:text-primary transition-all">
                  {{ currentLang === 'ar' ? 'العمل عن بعد' : 'Remote work' }}
                </button>
                <button (click)="suggestQuestion(currentLang === 'ar' ? 'كيف يمكنني طلب تحديث للمعدات؟' : 'How do I request an equipment upgrade?')" class="px-4 py-2 bg-surface border border-border hover:border-primary/40 rounded-xl text-xs font-semibold text-text-secondary hover:text-primary transition-all">
                  {{ currentLang === 'ar' ? 'تحديث المعدات' : 'Equipment upgrade' }}
                </button>
              </div>
            }
          </div>
        }

        @for (msg of messages(); track msg.id) {
          <div class="flex flex-col animate-[fadeIn_0.3s_ease_both]" [class.items-end]="msg.role === 'user'" [class.items-start]="msg.role === 'assistant'">
            <div class="flex items-end gap-2 max-w-[85%] md:max-w-[75%]" [class.flex-row-reverse]="msg.role === 'user'">
              <!-- Avatar -->
              <div class="w-8 h-8 rounded-full flex items-center justify-center shrink-0 mb-1"
                   [class.bg-primary]="msg.role === 'user'" [class.text-white]="msg.role === 'user'"
                   [class.bg-sidebar]="msg.role === 'assistant'" [class.border]="msg.role === 'assistant'" [class.border-border]="msg.role === 'assistant'" [class.text-primary]="msg.role === 'assistant'">
                @if (msg.role === 'user') {
                  <span class="text-xs font-extrabold">{{ userInitial() }}</span>
                } @else {
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
                }
              </div>
              
              <!-- Bubble -->
              <div class="px-5 py-3.5 rounded-2xl text-[14px] leading-relaxed shadow-sm"
                   [class.bg-primary]="msg.role === 'user'" [class.text-white]="msg.role === 'user'" [class.rounded-br-sm]="msg.role === 'user'"
                   [class.bg-surface]="msg.role === 'assistant'" [class.border]="msg.role === 'assistant'" [class.border-border]="msg.role === 'assistant'" [class.text-text-primary]="msg.role === 'assistant'" [class.rounded-bl-sm]="msg.role === 'assistant'">
                <span class="whitespace-pre-wrap">{{ msg.content }}</span>
              </div>
            </div>
            <span class="text-[10px] text-text-secondary mt-1 px-10">{{ msg.timestamp | date:'shortTime' }}</span>
          </div>
        }

        @if (isTyping()) {
          <div class="flex items-end gap-2 max-w-[85%] md:max-w-[75%] animate-[fadeIn_0.3s_ease_both]">
            <div class="w-8 h-8 rounded-full bg-sidebar border border-border text-primary flex items-center justify-center shrink-0 mb-1">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
            </div>
            <div class="px-4 py-3 rounded-2xl rounded-bl-sm bg-surface border border-border shadow-sm flex items-center justify-center gap-1 min-w-[50px] min-h-[38px]">
              <div class="typing-dot"></div>
              <div class="typing-dot"></div>
              <div class="typing-dot"></div>
            </div>
          </div>
        }
      </div>

      <!-- Input Area -->
      <div class="p-4 bg-surface border-t border-border shrink-0">
        <!-- Inline Hint -->
        @if (!hasDocuments()) {
          <div class="mb-3 px-3 py-2 bg-warning/10 border border-warning/20 rounded-xl flex items-center gap-2 max-w-4xl mx-auto">
            <svg class="w-4 h-4 text-warning shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
            <span class="text-xs font-semibold text-warning-dark">{{ 'COMPANY_POLICIES.HINT_EMPTY' | translate }}</span>
          </div>
        }
        
        <form (submit)="sendMessage($event)" class="relative flex items-end gap-2 max-w-4xl mx-auto">
          <textarea
            #chatInput
            [(ngModel)]="currentInput"
            name="chatInput"
            rows="1"
            [disabled]="!hasDocuments()"
            [placeholder]="(!hasDocuments() ? 'COMPANY_POLICIES.ASK_PLACEHOLDER_EMPTY' : 'COMPANY_POLICIES.ASK_PLACEHOLDER') | translate"
            (keydown.enter)="onEnterPressed($event)"
            class="w-full bg-background border border-border rounded-2xl pl-5 pr-14 py-3.5 text-sm text-text-primary placeholder:text-text-secondary outline-none focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all resize-none max-h-32 min-h-[52px] disabled:opacity-60 disabled:cursor-not-allowed disabled:bg-sidebar"
            [attr.dir]="currentLang === 'ar' ? 'rtl' : 'ltr'"
          ></textarea>
          
          <button type="submit" [disabled]="!currentInput.trim() || isTyping() || !hasDocuments()"
                  class="absolute right-2 bottom-2 w-9 h-9 flex items-center justify-center bg-primary hover:bg-primary-hover disabled:bg-sidebar disabled:text-text-secondary text-white rounded-xl transition-all shadow-sm group">
            <svg class="w-4 h-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 rtl:-scale-x-100" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 19V5m0 0l-7 7m7-7l7 7"/></svg>
          </button>
        </form>
        <div class="text-center mt-2">
          <span class="text-[9px] font-semibold text-text-secondary/70">
            {{ currentLang === 'ar' ? 'قد يخطئ الذكاء الاصطناعي. تحقق دائمًا من مستندات الموارد البشرية الرسمية.' : 'AI can make mistakes. Always verify with official HR documents.' }}
          </span>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .typing-dot {
      width: 6px;
      height: 6px;
      background-color: var(--text-secondary);
      border-radius: 50%;
      animation: typingBounce 1.4s infinite ease-in-out both;
    }
    .typing-dot:nth-child(1) { animation-delay: -0.32s; }
    .typing-dot:nth-child(2) { animation-delay: -0.16s; }
    
    @keyframes typingBounce {
      0%, 80%, 100% { transform: scale(0); }
      40% { transform: scale(1); }
    }
  `]
})
export class PolicyChatComponent implements AfterViewChecked, OnInit {
  @ViewChild('scrollContainer') private scrollContainer!: ElementRef;
  
  policyService = inject(CompanyPoliciesService);
  projectState = inject(ProjectStateService);
  toastService = inject(ToastService);
  confirmDialog = inject(ConfirmDialogService);
  translate = inject(TranslateService);

  messages = signal<ChatMessage[]>([]);
  currentInput = '';
  isTyping = signal(false);
  hasDocuments = signal(true); // default to true to avoid initial flash

  userInitial = () => 'U'; // Could fetch from actual user profile if available in projectState

  get currentLang(): string {
    return localStorage?.getItem('app_lang') || 'en';
  }

  async ngOnInit() {
    const companyId = this.projectState.userCompanyId();
    if (companyId) {
      try {
        const docs = await this.policyService.getDocuments(companyId);
        this.hasDocuments.set(docs.length > 0);
      } catch (err) {
        console.error('Failed to fetch company documents for chat state', err);
      }
    }
  }

  ngAfterViewChecked() {
    this.scrollToBottom();
  }

  scrollToBottom(): void {
    try {
      if (this.scrollContainer) {
        this.scrollContainer.nativeElement.scrollTop = this.scrollContainer.nativeElement.scrollHeight;
      }
    } catch(err) { }
  }

  suggestQuestion(q: string) {
    this.currentInput = q;
    this.sendMessage(new Event('submit'));
  }

  onEnterPressed(event: any) {
    if (!event.shiftKey) {
      event.preventDefault();
      this.sendMessage(event);
    }
  }

  async clearChat() {
    const confirmed = await this.confirmDialog.confirm({
      title: this.translate.instant('COMPANY_POLICIES.CLEAR_TITLE'),
      message: this.translate.instant('COMPANY_POLICIES.CLEAR_CONFIRM'),
      confirmLabel: this.translate.instant('COMPANY_POLICIES.CLEAR_BTN'),
      cancelLabel: this.translate.instant('COMPANY_POLICIES.CANCEL_BTN'),
      type: 'danger'
    });
    if (confirmed) {
      this.messages.set([]);
    }
  }

  async sendMessage(event?: Event) {
    if (event) {
      event.preventDefault();
    }
    
    const text = this.currentInput.trim();
    if (!text || this.isTyping()) return;

    const companyId = this.projectState.userCompanyId();
    if (!companyId) {
      this.toastService.show(this.currentLang === 'ar' ? 'سياق الشركة مفقود.' : 'Company context missing.', 'error');
      return;
    }

    // Add User Message
    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      timestamp: new Date()
    };
    this.messages.update(m => [...m, userMsg]);
    this.currentInput = '';
    this.isTyping.set(true);

    try {
      // Create history mapping for context if backend supports it
      const history = this.messages().slice(0, -1).map(m => ({
        role: m.role,
        content: m.content
      }));

      const answer = await this.policyService.askPolicyQuestion({
        companyId,
        question: text,
        history
      });

      const aiMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: answer || (this.currentLang === 'ar' ? 'لم أتمكن من العثور على إجابة في مستندات السياسة.' : "I couldn't find an answer to that in the policy documents."),
        timestamp: new Date()
      };
      
      this.messages.update(m => [...m, aiMsg]);
    } catch (error) {
      console.error('Chat error:', error);
      const errorMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: this.currentLang === 'ar' ? 'عذراً، فشل في الحصول على رد من الذكاء الاصطناعي.' : 'Sorry, failed to get a response from the AI.',
        timestamp: new Date()
      };
      this.messages.update(m => [...m, errorMsg]);
    } finally {
      this.isTyping.set(false);
    }
  }
}
