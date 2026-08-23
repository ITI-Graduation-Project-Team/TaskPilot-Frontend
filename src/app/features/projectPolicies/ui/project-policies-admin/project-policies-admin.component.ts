import { Component, ChangeDetectionStrategy, signal, inject, ViewChild, ElementRef, AfterViewChecked, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { ProjectPoliciesService, ProjectPolicyDocument } from '../../../../shared/api/project-policies.service';
import { ProjectStateService } from '../../../../shared/services/project-state.service';
import { ToastService } from '../../../../shared/services/toast.service';
import { ConfirmDialogService } from '../../../../shared/services/confirm-dialog.service';
import { PolicyChatCacheMessage, PolicyChatCacheService } from '../../../../shared/services/policy-chat-cache.service';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

@Component({
  selector: 'app-project-policies-admin',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="h-full flex flex-col md:flex-row gap-6 bg-background text-text-primary font-dashboard" [attr.dir]="isRtl() ? 'rtl' : 'ltr'">
      
      <!-- Sidebar Links -->
      <aside class="w-full md:w-64 shrink-0 flex flex-row md:flex-col gap-3 overflow-x-auto md:overflow-visible pb-2 md:pb-0">
        <button (click)="activeTab.set('documents')"
                [ngClass]="activeTab() === 'documents' ? 'bg-primary text-white shadow-md border-primary' : 'bg-surface text-text-secondary hover:bg-surface-hover hover:text-text-primary border-border'"
                class="flex-1 md:flex-none flex items-center gap-3 p-4 rounded-2xl border transition-all text-start cursor-pointer group">
          <div [ngClass]="activeTab() === 'documents' ? 'bg-white/20' : 'bg-primary/10 text-primary group-hover:bg-primary/20'" class="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors">
            <!-- Icon Document -->
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
          </div>
          <div class="min-w-0">
            <h3 class="text-sm font-bold font-display truncate" [ngClass]="activeTab() === 'documents' ? 'text-white' : 'text-text-primary'">{{ 'PROJECT_POLICIES.DOCUMENTS' | translate }}</h3>
            <p class="text-xs mt-0.5 truncate" [ngClass]="activeTab() === 'documents' ? 'text-white/80' : 'text-text-secondary'">{{ 'PROJECT_POLICIES.DOCUMENTS_SUB' | translate }}</p>
          </div>
        </button>

        <button (click)="activeTab.set('chat')"
                [ngClass]="activeTab() === 'chat' ? 'bg-primary text-white shadow-md border-primary' : 'bg-surface text-text-secondary hover:bg-surface-hover hover:text-text-primary border-border'"
                class="flex-1 md:flex-none flex items-center gap-3 p-4 rounded-2xl border transition-all text-start cursor-pointer group">
          <div [ngClass]="activeTab() === 'chat' ? 'bg-white/20' : 'bg-primary/10 text-primary group-hover:bg-primary/20'" class="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors">
            <!-- Icon Chat -->
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
          </div>
          <div class="min-w-0">
            <h3 class="text-sm font-bold font-display truncate" [ngClass]="activeTab() === 'chat' ? 'text-white' : 'text-text-primary'">{{ 'PROJECT_POLICIES.CHAT_TITLE' | translate }}</h3>
            <p class="text-xs mt-0.5 truncate" [ngClass]="activeTab() === 'chat' ? 'text-white/80' : 'text-text-secondary'">{{ 'PROJECT_POLICIES.CHAT_SUB' | translate }}</p>
          </div>
        </button>
      </aside>

      <!-- Main Content Area -->
      <div class="flex-1 flex flex-col min-h-0 bg-surface rounded-3xl border border-border shadow-sm overflow-hidden animate-[fadeIn_0.3s_ease_both]">
        
        <!-- Documents Tab Content -->
        @if (activeTab() === 'documents') {
          <div class="px-6 py-5 border-b border-border bg-sidebar/50 shrink-0">
            <h3 class="text-base font-bold text-text-primary font-display">{{ 'PROJECT_POLICIES.DOCUMENTS' | translate }}</h3>
            <p class="text-xs text-text-secondary mt-1">{{ 'PROJECT_POLICIES.DOCUMENTS_SUB' | translate }}</p>
          </div>
          
          <div class="flex-1 overflow-y-auto p-6 space-y-6">
            <!-- Upload Area -->
            <div class="relative group">
              <div class="w-full flex flex-col items-center justify-center p-8 border-2 border-dashed border-border rounded-2xl bg-background/50 hover:bg-primary/5 hover:border-primary/40 transition-colors cursor-pointer"
                   (click)="fileInput.click()">
                <div class="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-3">
                  <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                </div>
                <p class="text-sm font-semibold text-text-primary">{{ 'PROJECT_POLICIES.UPLOAD_TITLE' | translate }}</p>
                <p class="text-xs text-text-secondary mt-1">{{ 'PROJECT_POLICIES.UPLOAD_DESC' | translate }}</p>
              </div>
              <input #fileInput type="file" class="hidden" (change)="onFileSelected($event)" accept=".pdf,.doc,.docx,.txt" />
              @if (isUploading()) {
                <div class="absolute inset-0 bg-surface/80 backdrop-blur-sm flex items-center justify-center rounded-2xl">
                  <div class="w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
                </div>
              }
            </div>

            <!-- Documents List -->
            <div>
              <h4 class="text-sm font-bold text-text-primary mb-4">{{ 'PROJECT_POLICIES.UPLOADED_FILES' | translate }}</h4>
              @if (isLoadingDocs()) {
                <div class="flex justify-center p-4">
                  <div class="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                </div>
              } @else if (documents().length === 0) {
                <div class="text-center p-6 border border-border rounded-xl bg-background/30 text-text-secondary text-sm">
                  {{ 'PROJECT_POLICIES.NO_DOCS' | translate }}
                </div>
              } @else {
                <div class="space-y-3">
                  @for (doc of documents(); track doc.policyId) {
                    <div class="flex items-center justify-between p-3.5 bg-background border border-border rounded-xl hover:border-primary/30 transition-colors">
                      <div class="flex items-center gap-3 min-w-0">
                        <div class="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                          </svg>
                        </div>
                        <div class="min-w-0">
                          <p class="text-sm font-bold text-text-primary truncate" [title]="doc.fileName">{{ doc.fileName }}</p>
                          <p class="text-[10px] text-text-secondary">{{ doc.uploadDate | date:'mediumDate' }}</p>
                        </div>
                      </div>
                      <button (click)="deleteDocument(doc.policyId)" class="w-8 h-8 flex items-center justify-center text-text-secondary hover:text-error hover:bg-error/10 rounded-lg transition-colors shrink-0" [title]="'PROJECT_POLICIES.DELETE' | translate">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  }
                </div>
              }
            </div>
          </div>
        }

        <!-- Chat Tab Content -->
        @if (activeTab() === 'chat') {
          <div class="px-6 py-5 border-b border-border bg-sidebar/50 flex items-center justify-between shrink-0">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
              </div>
              <div>
                <h3 class="text-base font-bold text-text-primary font-display">{{ 'PROJECT_POLICIES.CHAT_TITLE' | translate }}</h3>
                <p class="text-xs text-text-secondary mt-0.5">{{ 'PROJECT_POLICIES.CHAT_SUB' | translate }}</p>
              </div>
            </div>
            <button (click)="clearChat()" class="text-[11px] font-bold text-text-secondary hover:text-error transition-colors px-3 py-1.5 rounded-lg hover:bg-error/10">
              {{ 'PROJECT_POLICIES.CLEAR' | translate }}
            </button>
          </div>

          <div class="flex-1 overflow-y-auto p-6 space-y-6 bg-background/30" #scrollContainer>
            @if (messages().length === 0) {
              <div class="h-full flex flex-col items-center justify-center text-center max-w-sm mx-auto opacity-70">
                <svg class="w-12 h-12 text-primary/60 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <h4 class="text-sm font-bold text-text-primary">{{ 'PROJECT_POLICIES.CHAT_EMPTY_TITLE' | translate }}</h4>
                <p class="text-xs text-text-secondary mt-2">{{ 'PROJECT_POLICIES.CHAT_EMPTY_DESC' | translate }}</p>
              </div>
            }

            @for (msg of messages(); track msg.id) {
              <div class="flex flex-col animate-[fadeIn_0.3s_ease_both]" [class.items-end]="msg.role === 'user'" [class.items-start]="msg.role === 'assistant'">
                <div class="flex items-end gap-2 max-w-[85%] md:max-w-[75%]" [class.flex-row-reverse]="msg.role === 'user'">
                  <div class="w-8 h-8 rounded-full flex items-center justify-center shrink-0 mb-1"
                       [class.bg-primary]="msg.role === 'user'" [class.text-white]="msg.role === 'user'"
                       [class.bg-sidebar]="msg.role === 'assistant'" [class.border]="msg.role === 'assistant'" [class.border-border]="msg.role === 'assistant'" [class.text-primary]="msg.role === 'assistant'">
                    @if (msg.role === 'user') {
                      <span class="text-xs font-extrabold">U</span>
                    } @else {
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
                    }
                  </div>
                  
                  <div class="px-4 py-3 rounded-2xl text-[13px] leading-relaxed shadow-sm whitespace-pre-wrap"
                       [class.bg-primary]="msg.role === 'user'" [class.text-white]="msg.role === 'user'" [class.rounded-br-sm]="msg.role === 'user'"
                       [class.bg-surface]="msg.role === 'assistant'" [class.border]="msg.role === 'assistant'" [class.border-border]="msg.role === 'assistant'" [class.text-text-primary]="msg.role === 'assistant'" [class.rounded-bl-sm]="msg.role === 'assistant'">
                    {{ msg.content }}
                  </div>
                </div>
                <span class="text-[9px] text-text-secondary mt-1" [class.me-10]="msg.role === 'user'" [class.ms-10]="msg.role === 'assistant'">
                  {{ msg.timestamp | date:'shortTime' }}
                </span>
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

          <div class="p-4 bg-surface border-t border-border shrink-0">
            <!-- Inline Hint -->
            @if (documents().length === 0) {
              <div class="mb-3 px-3 py-2 bg-warning/10 border border-warning/20 rounded-xl flex items-center gap-2">
                <svg class="w-4 h-4 text-warning shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
                <span class="text-xs font-semibold text-warning-dark">{{ 'PROJECT_POLICIES.HINT_EMPTY' | translate }}</span>
              </div>
            }
            
            <form (submit)="sendMessage($event)" class="relative flex items-end gap-2">
              <textarea
                [(ngModel)]="currentInput"
                name="chatInput"
                rows="1"
                [disabled]="documents().length === 0"
                [placeholder]="(documents().length === 0 ? 'PROJECT_POLICIES.ASK_PLACEHOLDER_EMPTY' : 'PROJECT_POLICIES.ASK_PLACEHOLDER') | translate"
                (keydown.enter)="onEnterPressed($event)"
                class="w-full bg-background border border-border rounded-xl pl-4 pr-12 py-3 text-sm text-text-primary placeholder:text-text-secondary outline-none focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all resize-none max-h-32 min-h-[44px] disabled:opacity-60 disabled:cursor-not-allowed disabled:bg-sidebar"
                [attr.dir]="isRtl() ? 'rtl' : 'ltr'"
              ></textarea>
              
              <button type="submit" [disabled]="!currentInput.trim() || isTyping() || documents().length === 0"
                      class="absolute end-2 bottom-2 w-8 h-8 flex items-center justify-center bg-primary hover:bg-primary-hover disabled:bg-sidebar disabled:text-text-secondary text-white rounded-lg transition-all shadow-sm">
                <svg class="w-4 h-4 rtl:-scale-x-100" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 19V5m0 0l-7 7m7-7l7 7"/></svg>
              </button>
            </form>
          </div>
        }
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
export class ProjectPoliciesAdminComponent implements AfterViewChecked {
  @ViewChild('scrollContainer') private scrollContainer!: ElementRef;
  
  private policyService = inject(ProjectPoliciesService);
  private projectState = inject(ProjectStateService);
  private toastService = inject(ToastService);
  private confirmDialog = inject(ConfirmDialogService);
  private translate = inject(TranslateService);
  private chatCache = inject(PolicyChatCacheService);

  documents = signal<ProjectPolicyDocument[]>([]);
  isLoadingDocs = signal(false);
  isUploading = signal(false);

  messages = signal<ChatMessage[]>([]);
  currentInput = '';
  isTyping = signal(false);
  activeTab = signal<'documents' | 'chat'>('documents');

  isRtl() {
    return this.translate.currentLang() === 'ar';
  }

  constructor() {
    effect(() => {
      const id = this.projectState.selectedProjectId();
      if (id) {
        this.loadDocuments(id);
      }
    });

    effect(() => {
      const id = this.projectState.selectedProjectId();
      const userId = this.projectState.userId();
      const cached = id && userId
        ? this.chatCache.load('project', id, userId)
        : [];
      this.messages.set(cached.map(message => ({
        id: message.id,
        role: message.sender === 'user' ? 'user' : 'assistant',
        content: message.text,
        timestamp: message.timestamp
      })));
    });
  }

  ngAfterViewChecked() {
    this.scrollToBottom();
  }

  private scrollToBottom(): void {
    try {
      if (this.scrollContainer) {
        this.scrollContainer.nativeElement.scrollTop = this.scrollContainer.nativeElement.scrollHeight;
      }
    } catch(err) { }
  }

  async loadDocuments(projectId: string) {
    this.isLoadingDocs.set(true);
    try {
      const docs = await this.policyService.getDocuments(projectId, this.translate.currentLang() || 'en');
      this.documents.set(docs);
    } catch (err) {
      this.toastService.show(this.translate.instant('PROJECT_POLICIES.LOAD_ERROR'), 'error');
    } finally {
      this.isLoadingDocs.set(false);
    }
  }

  async onFileSelected(event: any) {
    const file = event.target.files?.[0];
    if (!file) return;

    const projectId = this.projectState.selectedProjectId();
    if (!projectId) {
      this.toastService.show(this.translate.instant('PROJECT_POLICIES.NO_PROJECT'), 'error');
      return;
    }

    this.isUploading.set(true);
    try {
      await this.policyService.uploadDocument(projectId, file, undefined, this.translate.currentLang() || 'en');
      this.toastService.show(this.translate.instant('PROJECT_POLICIES.UPLOAD_SUCCESS'), 'success');
      await this.loadDocuments(projectId);
    } catch (error) {
      this.toastService.show(this.translate.instant('PROJECT_POLICIES.UPLOAD_ERROR'), 'error');
    } finally {
      this.isUploading.set(false);
      event.target.value = '';
    }
  }

  async deleteDocument(id: string) {
    const projectId = this.projectState.selectedProjectId();
    if (!projectId) return;

    const confirmed = await this.confirmDialog.confirm({
      title: this.translate.instant('PROJECT_POLICIES.DELETE_TITLE'),
      message: this.translate.instant('PROJECT_POLICIES.DELETE_CONFIRM'),
      confirmLabel: this.translate.instant('PROJECT_POLICIES.DELETE_BTN'),
      cancelLabel: this.translate.instant('PROJECT_POLICIES.CANCEL_BTN'),
      type: 'danger'
    });

    if (confirmed) {
      try {
        await this.policyService.deleteDocument(projectId, id, this.translate.currentLang() || 'en');
        this.toastService.show(this.translate.instant('PROJECT_POLICIES.DELETE_SUCCESS'), 'success');
        await this.loadDocuments(projectId);
      } catch (err) {
        this.toastService.show(this.translate.instant('PROJECT_POLICIES.DELETE_ERROR'), 'error');
      }
    }
  }

  onEnterPressed(event: any) {
    if (!event.shiftKey) {
      event.preventDefault();
      this.sendMessage(event);
    }
  }

  async clearChat() {
    const confirmed = await this.confirmDialog.confirm({
      title: this.translate.instant('PROJECT_POLICIES.CLEAR_TITLE'),
      message: this.translate.instant('PROJECT_POLICIES.CLEAR_CONFIRM'),
      confirmLabel: this.translate.instant('PROJECT_POLICIES.CLEAR_BTN'),
      cancelLabel: this.translate.instant('PROJECT_POLICIES.CANCEL_BTN'),
      type: 'danger'
    });
    if (confirmed) {
      this.messages.set([]);
      const projectId = this.projectState.selectedProjectId();
      const userId = this.projectState.userId();
      if (projectId && userId) {
        this.chatCache.clear('project', projectId, userId);
      }
    }
  }

  async sendMessage(event?: Event) {
    if (event) event.preventDefault();
    
    const text = this.currentInput.trim();
    if (!text || this.isTyping()) return;

    const projectId = this.projectState.selectedProjectId();
    if (!projectId) {
      this.toastService.show(this.translate.instant('PROJECT_POLICIES.NO_PROJECT'), 'error');
      return;
    }

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      timestamp: new Date()
    };
    
    this.messages.update(m => [...m, userMsg]);
    this.saveMessages(projectId);
    this.currentInput = '';
    this.isTyping.set(true);

    try {
      const history = this.messages().slice(0, -1).map(m => ({
        role: m.role,
        content: m.content
      }));

      const answer = await this.policyService.askPolicyQuestion({
        projectId,
        question: text,
        history
      }, this.translate.currentLang() || 'en');

      const aiMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: answer || this.translate.instant('PROJECT_POLICIES.NO_ANSWER'),
        timestamp: new Date()
      };
      
      this.messages.update(m => [...m, aiMsg]);
      this.saveMessages(projectId);
    } catch (error) {
      const errorMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: this.translate.instant('PROJECT_POLICIES.CHAT_ERROR'),
        timestamp: new Date()
      };
      this.messages.update(m => [...m, errorMsg]);
      this.saveMessages(projectId);
    } finally {
      this.isTyping.set(false);
    }
  }

  private saveMessages(projectId: string): void {
    const userId = this.projectState.userId();
    if (!userId) return;

    const cached: PolicyChatCacheMessage[] = this.messages().map(message => ({
      id: message.id,
      sender: message.role === 'user' ? 'user' : 'ai',
      text: message.content,
      timestamp: message.timestamp
    }));
    this.chatCache.save('project', projectId, userId, cached);
  }
}
