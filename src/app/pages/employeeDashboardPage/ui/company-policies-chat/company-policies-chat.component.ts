import { Component, ChangeDetectionStrategy, signal, inject, ViewChild, ElementRef, AfterViewChecked, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { AiChatService } from '../../../../shared/api/ai-chat.service';
import { ProjectStateService } from '../../../../shared/services/project-state.service';
import { PolicyChatCacheService } from '../../../../shared/services/policy-chat-cache.service';

interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: Date;
}

@Component({
  selector: 'app-company-policies-chat',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, TranslatePipe],
  template: `
    <div class="flex flex-col h-full bg-surface border border-border rounded-2xl shadow-sm overflow-hidden font-dashboard" 
         [attr.dir]="isRtl() ? 'rtl' : 'ltr'">
      
      <!-- Header -->
      <div class="px-6 py-4 border-b border-border bg-sidebar/50 backdrop-blur-md shrink-0 flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <div>
            <h2 class="text-lg font-extrabold text-text-primary">{{ 'employee.chat.title' | translate }}</h2>
            <p class="text-xs text-text-secondary">{{ 'employee.chat.subtitle' | translate }}</p>
          </div>
        </div>
      </div>

      <!-- Messages Area -->
      <div class="flex-1 overflow-y-auto p-6 space-y-6 scroll-smooth" #messagesContainer>
        @if (messages().length === 0) {
          <div class="flex flex-col items-center justify-center h-full text-center max-w-md mx-auto animate-[fadeUp_0.4s_ease_both]">
            <div class="w-20 h-20 rounded-2xl bg-primary/5 flex items-center justify-center mb-6">
              <svg class="w-10 h-10 text-primary opacity-80" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
            </div>
            <h3 class="text-xl font-extrabold text-text-primary mb-2">{{ 'employee.chat.welcomeTitle' | translate }}</h3>
            <p class="text-sm text-text-secondary leading-relaxed">{{ 'employee.chat.welcomeDesc' | translate }}</p>
          </div>
        } @else {
          @for (msg of messages(); track msg.id) {
            <div class="flex" [class.justify-end]="msg.sender === 'user'">
              <div class="max-w-[85%] md:max-w-[75%] rounded-2xl p-4 shadow-sm"
                   [ngClass]="msg.sender === 'user' ? 'bg-primary text-white rounded-tr-sm' : 'bg-sidebar border border-border text-text-primary rounded-tl-sm'">
                <p class="text-sm leading-relaxed whitespace-pre-wrap font-medium" [class.opacity-90]="msg.sender === 'user'">{{ msg.text }}</p>
                <div class="mt-2 text-[10px] opacity-70 flex justify-end">
                  {{ msg.timestamp | date:'shortTime' }}
                </div>
              </div>
            </div>
          }
          
          @if (isTyping()) {
            <div class="flex justify-start">
              <div class="px-4 py-3 rounded-2xl rounded-bl-sm bg-surface border border-border shadow-sm flex items-center justify-center gap-1 min-w-[50px] min-h-[38px]">
                <div class="typing-dot"></div>
                <div class="typing-dot"></div>
                <div class="typing-dot"></div>
              </div>
            </div>
          }
        }
      </div>

      <!-- Input Area -->
      <div class="p-4 border-t border-border bg-surface shrink-0">
        <form (ngSubmit)="sendMessage()" class="relative flex items-end gap-2 max-w-4xl mx-auto">
          <div class="relative flex-1 bg-background rounded-xl border border-border focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 transition-all duration-200">
            <textarea
              #chatInput
              [(ngModel)]="currentInput"
              name="currentInput"
              rows="1"
              class="w-full bg-transparent border-0 focus:ring-0 resize-none py-3 px-4 text-sm text-text-primary placeholder:text-text-secondary disabled:opacity-50"
              [placeholder]="'employee.chat.placeholder' | translate"
              (keydown.enter)="onEnter($event)"
              (input)="adjustTextareaHeight($event)"
              [disabled]="isTyping()"
              style="min-height: 44px; max-height: 120px;"
            ></textarea>
          </div>
          
          <button type="submit" 
                  [disabled]="!currentInput().trim() || isTyping()"
                  class="shrink-0 w-[44px] h-[44px] flex items-center justify-center rounded-xl bg-primary text-white hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm">
            <svg class="w-5 h-5 rtl:-scale-x-100" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </form>
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
export class CompanyPoliciesChatComponent implements AfterViewChecked {
  @ViewChild('messagesContainer') private messagesContainer!: ElementRef;
  @ViewChild('chatInput') private chatInput!: ElementRef;

  private aiChatService = inject(AiChatService);
  private translate = inject(TranslateService);
  private projectState = inject(ProjectStateService);
  private chatCache = inject(PolicyChatCacheService);

  messages = signal<ChatMessage[]>([]);
  isTyping = signal(false);
  currentInput = signal('');

  constructor() {
    effect(() => {
      const companyId = this.projectState.userCompanyId();
      const userId = this.projectState.userId();
      this.messages.set(companyId && userId
        ? this.chatCache.load('company', companyId, userId)
        : []);
    });
  }

  isRtl() {
    return this.translate.currentLang() === 'ar';
  }

  ngAfterViewChecked() {
    this.scrollToBottom();
  }

  private scrollToBottom(): void {
    try {
      if (this.messagesContainer) {
        this.messagesContainer.nativeElement.scrollTop = this.messagesContainer.nativeElement.scrollHeight;
      }
    } catch (err) {}
  }

  adjustTextareaHeight(event: Event) {
    const textarea = event.target as HTMLTextAreaElement;
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
  }

  onEnter(event: Event) {
    const keyboardEvent = event as KeyboardEvent;
    if (!keyboardEvent.shiftKey) {
      keyboardEvent.preventDefault();
      this.sendMessage();
    }
  }

  async sendMessage() {
    const text = this.currentInput().trim();
    if (!text || this.isTyping()) return;

    // Reset input
    this.currentInput.set('');
    if (this.chatInput) {
      this.chatInput.nativeElement.style.height = 'auto';
    }

    // Add user message
    this.addMessage('user', text);
    this.isTyping.set(true);

    try {
      const response = await this.aiChatService.askPolicyQuestion(text);
      this.isTyping.set(false);
      
      if (response && response.succeeded) {
        this.addMessage('ai', response.data || this.translate.instant('employee.chat.defaultAnswer'));
      } else {
        this.addMessage('ai', this.translate.instant('employee.chat.errorAnswer'));
      }
    } catch (error) {
      this.isTyping.set(false);
      this.addMessage('ai', this.translate.instant('employee.chat.errorAnswer'));
    }
  }

  private addMessage(sender: 'user' | 'ai', text: string) {
    this.messages.update(msgs => {
      const next = [
        ...msgs,
        { id: crypto.randomUUID(), sender, text, timestamp: new Date() }
      ];
      const companyId = this.projectState.userCompanyId();
      const userId = this.projectState.userId();
      if (companyId && userId) {
        this.chatCache.save('company', companyId, userId, next);
      }
      return next;
    });
  }
}
