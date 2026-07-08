import { Component, ChangeDetectionStrategy, signal, inject, Output, EventEmitter, ElementRef, ViewChild, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AiRequirementsService } from '../../../../shared/api/ai-requirements.service';
import { ProjectStateService } from '../../../../shared/services/project-state.service';
import { ToastService } from '../../../../shared/services/toast.service';

interface ChatMessage {
  text: string;
  sender: 'user' | 'ai';
  timestamp: Date;
}

@Component({
  selector: 'app-ai-chat-modal',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-[fadeIn_0.2s_ease_both]">
      <div class="bg-surface border border-border rounded-3xl w-full max-w-3xl h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-[scaleUp_0.25s_ease_both]">
        
        <!-- Header -->
        <div class="p-5 border-b border-border bg-sidebar flex items-center justify-between shrink-0">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 bg-primary/10 text-primary rounded-xl flex items-center justify-center">
              <svg class="w-5.5 h-5.5 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <h3 class="text-base font-bold text-text-primary">AI Project Assistant</h3>
              <p class="text-xs text-text-secondary">Describe your project requirements to generate WBS & user stories</p>
            </div>
          </div>
          <button (click)="close.emit()" class="p-2 hover:bg-border rounded-full transition-colors text-text-secondary">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>

        <!-- Progress Tracker -->
        <div class="px-6 py-4 bg-primary/5 border-b border-primary/10 shrink-0 flex items-center justify-between gap-4">
          <div class="flex-1">
            <div class="flex items-center justify-between text-xs font-bold text-primary mb-1">
              <span>Requirements Completeness</span>
              <span>{{ completenessScore() }}%</span>
            </div>
            <div class="w-full h-2.5 bg-border rounded-full overflow-hidden">
              <div class="h-full bg-primary transition-all duration-500 rounded-full" [style.width.%]="completenessScore()"></div>
            </div>
          </div>
          @if (isReadyForFinalization()) {
            <button (click)="onGenerateDraft()" 
                    class="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md transition-all shrink-0 animate-bounce">
              Generate Project Draft
            </button>
          }
        </div>

        <!-- Chat Area -->
        <div class="flex-1 overflow-y-auto p-6 space-y-4" #chatScrollContainer>
          
          <!-- Welcome Message -->
          <div class="flex gap-3 max-w-[85%]">
            <div class="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">🤖</div>
            <div class="p-4 bg-sidebar border border-border rounded-2xl text-sm text-text-primary rounded-tl-none leading-relaxed">
              Hello! I am your AI assistant. Tell me about the project you want to build. You can describe it in text, upload technical documentation, or specify platforms and stack you prefer.
            </div>
          </div>

          <!-- Chat History -->
          @for (msg of chatHistory(); track msg.timestamp) {
            <div class="flex gap-3 max-w-[85%] animate-[fadeUp_0.2s_ease_both]"
                 [ngClass]="msg.sender === 'user' ? 'ml-auto flex-row-reverse' : ''">
              <div class="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                   [ngClass]="msg.sender === 'user' ? 'bg-primary text-white font-bold' : 'bg-primary/10 text-primary'">
                {{ msg.sender === 'user' ? 'PM' : '🤖' }}
              </div>
              <div class="p-4 rounded-2xl text-sm leading-relaxed border"
                   [ngClass]="msg.sender === 'user' 
                     ? 'bg-primary/10 border-primary/20 text-text-primary rounded-tr-none' 
                     : 'bg-sidebar border-border text-text-primary rounded-tl-none'">
                {{ msg.text }}
              </div>
            </div>
          }

          <!-- AI Suggested Questions list -->
          @if (clarifyingQuestions().length > 0) {
            <div class="p-5 bg-warning/5 border border-warning/20 rounded-2xl space-y-2.5 animate-[fadeIn_0.3s_ease_both]">
              <h4 class="text-xs font-bold text-warning uppercase tracking-wider flex items-center gap-1.5">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                Clarifying Questions (Answer these to hit 100%):
              </h4>
              <ul class="space-y-1.5 text-xs text-text-secondary list-disc pl-5">
                @for (q of clarifyingQuestions(); track q) {
                  <li>{{ q }}</li>
                }
              </ul>
            </div>
          }

          @if (isGeneratingDraft()) {
            <div class="flex items-center gap-2 text-primary font-semibold text-sm animate-pulse p-4">
              <div class="w-4 h-4 rounded-full border-2 border-primary border-t-transparent animate-spin"></div>
              Analyzing requirements and creating project draft structure...
            </div>
          }
        </div>

        <!-- Footer / Input -->
        <div class="p-4 border-t border-border bg-sidebar shrink-0 space-y-3">
          <!-- Quick document uploader -->
          <div class="flex items-center gap-2">
            <input type="file" #fileInput (change)="onFileSelected($event)" class="hidden" accept=".pdf,.docx,.txt">
            <button (click)="fileInput.click()" 
                    [disabled]="!chatId()"
                    [title]="!chatId() ? 'Send a message first to start session' : 'Upload requirements document'"
                    class="p-2 border border-border text-text-secondary hover:text-text-primary rounded-xl hover:bg-background transition-colors flex items-center gap-1.5 text-xs font-semibold disabled:opacity-50">
              <svg class="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"/></svg>
              Attach Document
            </button>
            @if (selectedFileName()) {
              <span class="text-xs text-primary font-semibold truncate max-w-xs">{{ selectedFileName() }}</span>
              <button (click)="clearFile()" class="text-xs text-red-500 font-bold hover:underline">Remove</button>
            }
          </div>

          <form (submit)="onSendMessage($event)" class="flex gap-2 items-end">
            <textarea [(ngModel)]="messageInput" name="message" required autocomplete="off" rows="2"
                    (keydown)="onKeyDown($event)"
                    placeholder="e.g. A food delivery app with real-time tracking, written in Flutter..." 
                    class="flex-1 bg-background border border-border rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all resize-none"></textarea>
            <button type="submit" 
                    [disabled]="isLoading() || !messageInput.trim()"
                    class="px-5 py-3 h-[46px] bg-primary hover:bg-primary-hover text-white font-bold rounded-xl shadow-md transition-all flex items-center justify-center disabled:opacity-50 shrink-0">
              @if (isLoading()) {
                <div class="w-5 h-5 rounded-full border-2 border-white border-t-transparent animate-spin"></div>
              } @else {
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3"/></svg>
              }
            </button>
          </form>
        </div>

        <!-- Custom Beautiful Naming Modal -->
        @if (showNamePrompt()) {
          <div class="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-[fadeIn_0.2s_ease_both]">
            <div class="bg-surface border border-border rounded-3xl w-full max-w-md p-6 shadow-2xl flex flex-col gap-4 animate-[scaleUp_0.25s_ease_both]">
              <div class="flex items-center gap-3">
                <div class="w-9 h-9 bg-primary/10 text-primary rounded-xl flex items-center justify-center text-lg font-bold">📂</div>
                <div>
                  <h4 class="text-sm font-bold text-text-primary">Name Your Project</h4>
                  <p class="text-xs text-text-secondary">Provide a custom name for this generated workspace.</p>
                </div>
              </div>
              
              <div>
                <input type="text" [value]="projectNameInput()" (input)="projectNameInput.set(nameField.value)" #nameField
                       [disabled]="isGeneratingDraft()"
                       class="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all font-semibold disabled:opacity-50"
                       placeholder="e.g. E-Commerce App, Marketing Dashboard..." (keyup.enter)="!isGeneratingDraft() && submitFinalization()">
              </div>
              
              <div class="flex items-center justify-end gap-2.5 mt-2">
                <button (click)="showNamePrompt.set(false)" [disabled]="isGeneratingDraft()"
                        class="px-4 py-2 border border-border text-text-secondary hover:text-text-primary text-xs font-bold rounded-xl transition-all disabled:opacity-50">
                  Cancel
                </button>
                <button (click)="submitFinalization()" [disabled]="isGeneratingDraft() || !projectNameInput().trim()"
                        class="px-5 py-2 bg-primary hover:bg-primary-hover text-white text-xs font-bold rounded-xl shadow-md transition-all disabled:opacity-50 flex items-center gap-1.5 min-w-[120px] justify-center">
                  @if (isGeneratingDraft()) {
                    <div class="w-3.5 h-3.5 rounded-full border-2 border-white border-t-transparent animate-spin"></div>
                    Generating...
                  } @else {
                    Confirm & Save
                  }
                </button>
              </div>
            </div>
          </div>
        }

      </div>
    </div>
  `,
  styles: [`
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    @keyframes scaleUp { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }
    @keyframes fadeUp { from { transform: translateY(8px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
  `]
})
export class AiChatModalComponent implements AfterViewChecked {
  @Output() close = new EventEmitter<void>();
  @Output() draftGenerated = new EventEmitter<{ draft: any; chatId: string }>();

  @ViewChild('chatScrollContainer') private chatScrollContainer!: ElementRef;

  private aiRequirements = inject(AiRequirementsService);
  private projectState = inject(ProjectStateService);
  private toastService = inject(ToastService);

  chatId = signal<string | null>(null);
  completenessScore = signal(0);
  isReadyForFinalization = signal(false);
  clarifyingQuestions = signal<string[]>([]);
  chatHistory = signal<ChatMessage[]>([]);

  messageInput = '';
  selectedFile = signal<File | null>(null);
  selectedFileName = signal<string>('');

  isLoading = signal(false);
  isGeneratingDraft = signal(false);

  ngAfterViewChecked() {
    this.scrollToBottom();
  }

  private scrollToBottom(): void {
    try {
      this.chatScrollContainer.nativeElement.scrollTop = this.chatScrollContainer.nativeElement.scrollHeight;
    } catch(err) { }
  }

  onKeyDown(event: KeyboardEvent) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.onSendMessage(event);
    }
  }

  async onSendMessage(event: Event) {
    event.preventDefault();
    if (this.isLoading() || !this.messageInput.trim()) return;

    const userText = this.messageInput.trim();
    this.messageInput = '';

    // Add user message locally
    this.chatHistory.update(history => [...history, {
      text: userText,
      sender: 'user',
      timestamp: new Date()
    }]);

    this.isLoading.set(true);

    try {
      // Send message
      const res = await this.aiRequirements.startOrContinueSession(userText, this.chatId());
      const currentChatId = res.data?.sessionId || res.sessionId || res.data?.SessionId || res.SessionId || this.chatId();
      this.chatId.set(currentChatId);

      // Upload file if selected
      if (this.selectedFile() && currentChatId) {
        await this.aiRequirements.uploadDocument(this.selectedFile()!, currentChatId);
        this.clearFile();
      }

      // Query status
      await this.pollStatus(currentChatId);

    } catch (e) {
      console.error(e);
      this.chatHistory.update(history => [...history, {
        text: 'Error: Failed to process message. Please check connection and try again.',
        sender: 'ai',
        timestamp: new Date()
      }]);
    } finally {
      this.isLoading.set(false);
    }
  }

  onFileSelected(event: any) {
    const file = event.target.files?.[0];
    if (file) {
      this.selectedFile.set(file);
      this.selectedFileName.set(file.name);
    }
  }

  clearFile() {
    this.selectedFile.set(null);
    this.selectedFileName.set('');
  }

  async pollStatus(chatId: string) {
    try {
      const res = await this.aiRequirements.getSessionStatus(chatId);
      const data = res.data || res;
      if (data) {
        // Map CompletenessReport Score (0.0 to 1.0) to percentage
        const scorePercentage = Math.round((data.completenessReport?.score || data.CompletenessReport?.Score || 0) * 100);
        this.completenessScore.set(scorePercentage);

        // Extract unanswered questions from QuestionPool
        const pool = data.questionPool || data.QuestionPool || [];
        const unanswered = pool.filter((q: any) => !q.isAnswered && !q.IsAnswered);
        const questionsList = unanswered.map((q: any) => q.question || q.Question);
        
        this.clarifyingQuestions.set(questionsList);

        // Check if ready for finalization (status is Planning, score is high, or all questions are answered)
        const isReady = data.status === 'Planning' || data.Status === 'Planning' || unanswered.length === 0 || scorePercentage >= 85;
        this.isReadyForFinalization.set(isReady);

        // Retrieve AI clarifying response or follow-up without duplicating
        const history = this.chatHistory();
        const lastMsg = history[history.length - 1];

        if (questionsList.length > 0) {
          const nextQuestion = questionsList[0];
          if (!lastMsg || lastMsg.text !== nextQuestion || lastMsg.sender !== 'ai') {
            this.chatHistory.update(h => [...h, {
              text: nextQuestion,
              sender: 'ai',
              timestamp: new Date()
            }]);
          }
        } else {
          const completionMsg = `Requirements gathering is complete (${scorePercentage}%). You can now finalize and generate your project draft!`;
          if (!lastMsg || lastMsg.text !== completionMsg || lastMsg.sender !== 'ai') {
            this.chatHistory.update(h => [...h, {
              text: completionMsg,
              sender: 'ai',
              timestamp: new Date()
            }]);
          }
        }
      }
    } catch (err) {
      console.warn('Failed to fetch session completeness status:', err);
    }
  }

  showNamePrompt = signal(false);
  projectNameInput = signal('My Awesome AI Project');

  onGenerateDraft() {
    const activeChatId = this.chatId();
    const companyId = this.projectState.userCompanyId();
    const managerId = this.projectState.userId();

    if (!activeChatId || !companyId || !managerId) return;
    
    // Open custom name input dialog
    this.projectNameInput.set('My Awesome AI Project');
    this.showNamePrompt.set(true);
  }

  async submitFinalization() {
    const activeChatId = this.chatId();
    const companyId = this.projectState.userCompanyId();
    const managerId = this.projectState.userId();
    const name = this.projectNameInput().trim();

    if (!activeChatId || !companyId || !managerId || !name) return;

    this.isGeneratingDraft.set(true);
    
    try {
      // Step 1: Finalize session and save project draft with user-defined name
      const res = await this.aiRequirements.finalizeSession(activeChatId, {
        projectNameEn: name,
        companyId,
        managerId
      });
      const finalizeResult = res.data || res;
      
      if (finalizeResult && finalizeResult.projectId) {
        // Step 2: Automatically generate and persist WBS/Backlog
        await this.aiRequirements.generateWbs(finalizeResult.projectId);
        
        // Refresh project state to display the newly created project
        await this.projectState.loadProjects();
        
        // Hide modal only on success
        this.showNamePrompt.set(false);
        
        // Notify parent that project creation is complete
        this.draftGenerated.emit({ draft: finalizeResult, chatId: activeChatId });
      }
    } catch (err: any) {
      console.error(err);
      const backendError = err?.response?.data?.message || err?.response?.data?.error?.message || err?.message || 'Please check and try again.';
      this.toastService.show(`Failed to finalize requirements: ${backendError}`, 'error');
    } finally {
      this.isGeneratingDraft.set(false);
    }
  }
}
