import { Component, ChangeDetectionStrategy, signal, computed, inject, input, Output, EventEmitter, ElementRef, ViewChild, AfterViewChecked } from '@angular/core';
import { detectTextDir } from '../../../../shared/utils/text-direction.util';
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
    <div class="flex items-center justify-center animate-[fadeIn_0.2s_ease_both]" [class.fixed]="!embedded()" [class.inset-0]="!embedded()" [class.z-50]="!embedded()" [class.p-4]="!embedded()" [class.bg-black\/60]="!embedded()" [class.backdrop-blur-sm]="!embedded()" [class.w-full]="embedded()">
      <div class="bg-surface border border-border rounded-3xl w-full flex flex-col shadow-sm overflow-hidden animate-[scaleUp_0.25s_ease_both]" [class.max-w-3xl]="!embedded()" [class.h-[85vh]]="!embedded()" [class.max-w-none]="embedded()" [class.min-h-[520px]]="embedded()">
        
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

        <!-- Progress Tracker (PM Only) -->
        @if (projectState.isProjectManager()) {
          <div class="px-6 py-4 bg-primary/5 border-b border-primary/10 shrink-0 flex items-center justify-between gap-4">
            <div class="flex-1">
              <div class="flex items-center justify-between text-xs font-bold text-primary mb-1">
                <span>{{ completenessLabel() }}</span>
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
        }

        <!-- Chat Area -->
        <div class="flex-1 overflow-y-auto p-6 space-y-4" [class.max-h-[360px]]="embedded()" #chatScrollContainer>
          
          <!-- Welcome Message -->
          <div class="flex gap-3 max-w-[85%]">
            <div class="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">🤖</div>
            <div class="p-4 bg-sidebar border border-border rounded-2xl text-sm text-text-primary rounded-tl-none leading-relaxed">
              Hello! I am your AI assistant. 
              @if (projectState.isProjectManager()) {
                Tell me about the project you want to build. You can describe it in text, upload technical documentation, or specify platforms and stack you prefer.
              } @else {
                I can help you understand project requirements, explain tasks, or assist with any technical questions you have. How can I help you today?
              }
            </div>
          </div>

          <!-- Chat History -->
          @for (msg of chatHistory(); track msg.timestamp) {
            <div class="flex gap-3 max-w-[85%] animate-[fadeUp_0.2s_ease_both]"
                 [ngClass]="msg.sender === 'user' ? 'ml-auto flex-row-reverse' : ''"
                 [dir]="detectTextDir(msg.text)"
                 [class.text-right]="detectTextDir(msg.text) === 'rtl'">
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

          <!-- AI Suggested Questions list (PM Only) -->
          @if (clarifyingQuestions().length > 0 && projectState.isProjectManager()) {
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
              إرفاق مستند
            </button>
            @if (selectedFileName()) {
              <span class="text-xs text-primary font-semibold truncate max-w-xs">{{ selectedFileName() }}</span>
              <button (click)="clearFile()" class="text-xs text-red-500 font-bold hover:underline">Remove</button>
            }
          </div>

          <form (submit)="onSendMessage($event)" class="flex gap-2 items-end">
            <textarea [(ngModel)]="messageInput" name="message" autocomplete="off" rows="2"
                    (keydown)="onKeyDown($event)"
                    placeholder="Describe your project requirements, goals, or preferred tech stack (e.g. A food delivery app with real-time tracking...)" 
                    class="flex-1 bg-background border border-border rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all resize-none"></textarea>
            <button type="submit" 
                    [disabled]="isLoading() || (!messageInput.trim() && !selectedFile())"
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
            <div class="bg-surface border border-border rounded-3xl w-full max-w-2xl p-6 shadow-2xl flex flex-col gap-5 animate-[scaleUp_0.25s_ease_both] overflow-hidden">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 bg-primary/10 text-primary rounded-xl flex items-center justify-center text-lg font-bold">📂</div>
                <div>
                  <h4 class="text-base font-bold text-text-primary">Configure & Initialize Project Workspace</h4>
                  <p class="text-xs text-text-secondary">Provide initial metadata and sprint settings to create the workspace.</p>
                </div>
              </div>
              
              <div class="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label class="block text-[11px] font-extrabold text-text-secondary mb-1 uppercase tracking-wider">Project Name (English)</label>
                    <input type="text" [value]="projectNameInput()" (input)="projectNameInput.set(nameEnField.value)" #nameEnField
                           [disabled]="isGeneratingDraft()"
                           class="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all font-semibold disabled:opacity-50"
                           placeholder="e.g. E-Commerce App, Marketing Dashboard...">
                  </div>

                  <div>
                    <label class="block text-[11px] font-extrabold text-text-secondary mb-1 uppercase tracking-wider">اسم المشروع (عربي)</label>
                    <input type="text" [value]="projectNameArInput()" (input)="projectNameArInput.set(nameArField.value)" #nameArField dir="rtl"
                           [disabled]="isGeneratingDraft()"
                           class="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all font-semibold disabled:opacity-50 text-right font-display"
                           placeholder="مثال: تطبيق التجارة الإلكترونية...">
                  </div>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label class="block text-[11px] font-extrabold text-text-secondary mb-1 uppercase tracking-wider">Description (English)</label>
                     <textarea [value]="projectDescriptionEnInput()" (input)="projectDescriptionEnInput.set(descEnField.value)" #descEnField rows="3"
                               [disabled]="isGeneratingDraft()"
                               class="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20 resize-none transition-all font-medium disabled:opacity-50"
                               placeholder="Describe the project goal, core features, and target audience..."></textarea>
                  </div>

                  <div>
                    <label class="block text-[11px] font-extrabold text-text-secondary mb-1 uppercase tracking-wider">الوصف (عربي)</label>
                     <textarea [value]="projectDescriptionArInput()" (input)="projectDescriptionArInput.set(descArField.value)" #descArField rows="3" dir="rtl"
                               [disabled]="isGeneratingDraft()"
                               class="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20 resize-none transition-all font-medium disabled:opacity-50 text-right"
                               placeholder="اكتب وصفاً مختصراً لأهداف ومميزات هذا المشروع..."></textarea>
                  </div>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-border/60 pt-4">
                  <div>
                    <label class="block text-[11px] font-extrabold text-text-secondary mb-1 uppercase tracking-wider">Sprint Duration (Days)</label>
                    <input type="number" [value]="sprintDurationInput() ?? ''" (input)="sprintDurationInput.set(+durationField.value || null)" #durationField
                           [disabled]="isGeneratingDraft()" min="1" max="90"
                           [placeholder]="'e.g. ' + sprintDurationPlaceholder()"
                           class="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all font-semibold disabled:opacity-50">
                  </div>

                  <div>
                    <label class="block text-[11px] font-extrabold text-text-secondary mb-1 uppercase tracking-wider">Target Sprint Hours</label>
                    <input type="number" [value]="targetSprintHoursInput() ?? ''" (input)="targetSprintHoursInput.set(+hoursField.value || null)" #hoursField
                           [disabled]="isGeneratingDraft()" min="1" max="1000"
                           [placeholder]="'e.g. ' + targetSprintHoursPlaceholder()"
                           class="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all font-semibold disabled:opacity-50">
                  </div>
                </div>
              </div>
              
              <div class="flex items-center justify-end gap-2.5 mt-2 border-t border-border/60 pt-4 shrink-0">
                <button (click)="showNamePrompt.set(false)" [disabled]="isGeneratingDraft()"
                        class="px-4 py-2.5 border border-border text-text-secondary hover:text-text-primary text-xs font-bold rounded-xl transition-all disabled:opacity-50">
                  Cancel
                </button>
                <button (click)="submitFinalization()" [disabled]="isGeneratingDraft()"
                        class="px-5 py-2.5 bg-primary hover:bg-primary-hover text-white text-xs font-bold rounded-xl shadow-md transition-all disabled:opacity-50 flex items-center gap-1.5 min-w-[140px] justify-center">
                  @if (isGeneratingDraft()) {
                    <span class="w-3.5 h-3.5 rounded-full border-2 border-white border-t-transparent animate-spin inline-block"></span>
                    <span>Generating...</span>
                  } @else {
                    <span>Confirm & Save</span>
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
  embedded = input(false);
  @Output() close = new EventEmitter<void>();
  @Output() draftGenerated = new EventEmitter<{ projectId: string; chatId: string; draft: any }>();

  @ViewChild('chatScrollContainer') private chatScrollContainer!: ElementRef;

  private aiRequirements = inject(AiRequirementsService);
  projectState = inject(ProjectStateService);
  toastService = inject(ToastService);

  chatId = signal<string | null>(null);
  completenessScore = signal(0);
  
  detectTextDir = detectTextDir;
  completenessLabel = computed(() => {
    const history = this.chatHistory();
    for (let i = history.length - 1; i >= 0; i--) {
      if (history[i].sender === 'user') {
        return detectTextDir(history[i].text) === 'rtl' ? 'اكتمال المتطلبات' : 'Requirements Completeness';
      }
    }
    return 'Requirements Completeness';
  });
  isReadyForFinalization = signal(false);
  clarifyingQuestions = signal<string[]>([]);
  chatHistory = signal<ChatMessage[]>([]);

  messageInput = '';
  selectedFile = signal<File | null>(null);
  selectedFileName = signal<string>('');
  // Persist document info even after clearFile() so onGenerateDraft can use it
  lastUploadedFileName = signal<string>('');
  lastUploadedDocText = signal<string>('');

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
    if (this.isLoading() || (!this.messageInput.trim() && !this.selectedFile())) return;

    const userText = this.messageInput.trim();
    this.messageInput = '';

    // Add user message locally
    if (userText) {
      this.chatHistory.update(history => [...history, {
        text: userText,
        sender: 'user',
        timestamp: new Date()
      }]);
    } else if (this.selectedFile()) {
      this.chatHistory.update(history => [...history, {
        text: `📎 Attached document: ${this.selectedFile()?.name}`,
        sender: 'user',
        timestamp: new Date()
      }]);
    }

    this.isLoading.set(true);

    try {
      // Send message and file
      const res = await this.aiRequirements.startOrContinueSession(userText, this.selectedFile(), this.chatId());
      const currentChatId = res.data?.sessionId || res.sessionId || res.data?.SessionId || res.SessionId || this.chatId();
      this.chatId.set(currentChatId);

      // Extract direct AI reply from backend response if available
      const resData = res.data || res;
      const aiReply = resData.reply || resData.Reply || resData.aiResponse || resData.AiResponse || resData.message || resData.Message || resData.response || resData.Response;

      if (aiReply && typeof aiReply === 'string' && aiReply.trim()) {
        this.chatHistory.update(history => [...history, {
          text: aiReply.trim(),
          sender: 'ai',
          timestamp: new Date()
        }]);
      }

      this.clearFile();

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
      // Persist the name so onGenerateDraft can use it as a project name hint
      const nameWithoutExt = file.name.replace(/\.[^.]+$/, '');
      this.lastUploadedFileName.set(nameWithoutExt);
      // For plain-text files, read the content to use as description
      if (file.type === 'text/plain' || file.name.endsWith('.txt')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          this.lastUploadedDocText.set((e.target?.result as string) || '');
        };
        reader.readAsText(file);
      } else {
        // PDF/DOCX: we can't parse content on the frontend — clear any previous text
        this.lastUploadedDocText.set('');
      }
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

        // Cache sprint config suggestions from session status if the backend provides them
        const sprintDays = data.suggestedSprintDurationInDays || data.sprintDurationInDays || data.SprintDurationInDays || null;
        const sprintHours = data.suggestedTargetSprintHours || data.targetSprintHours || data.TargetSprintHours || null;
        if (sprintDays) this.suggestedSprintDuration.set(sprintDays);
        if (sprintHours) this.suggestedTargetHours.set(sprintHours);

        // Update chat stream status message
        const history = this.chatHistory();
        const lastMsg = history[history.length - 1];

        if (questionsList.length > 0) {
          // Combine ALL unanswered questions into one AI message
          const isArabic = questionsList.length > 0 && detectTextDir(questionsList[0]) === 'rtl';
          const prefix = isArabic ? 'يرجى الإجابة على الأسئلة التالية:\n' : 'Please answer the following questions:\n';
          const allQuestions = questionsList.length === 1
            ? questionsList[0]
            : prefix +
              questionsList.map((q: string, i: number) => `${i + 1}. ${q}`).join('\n');

          if (!lastMsg || lastMsg.text !== allQuestions || lastMsg.sender !== 'ai') {
            this.chatHistory.update(h => [...h, {
              text: allQuestions,
              sender: 'ai',
              timestamp: new Date()
            }]);
          }
        }
         else if (lastMsg && lastMsg.sender === 'user') {
          // If no direct textual reply was added from backend POST response, provide a clean acknowledgment
          const ackMsg = `Thank you! Requirements updated (${scorePercentage}% completeness). Please check the remaining clarifying questions below to reach 100%.`;
          this.chatHistory.update(h => [...h, {
            text: ackMsg,
            sender: 'ai',
            timestamp: new Date()
          }]);
        }
        else {
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

  // AI-suggested sprint config extracted from session status
  private suggestedSprintDuration = signal<number | null>(null);
  private suggestedTargetHours = signal<number | null>(null);
  showNamePrompt = signal(false);
  projectNameInput = signal('');
  projectNameArInput = signal('');
  projectDescriptionEnInput = signal('');
  projectDescriptionArInput = signal('');
  sprintDurationInput = signal<number | null>(null);
  targetSprintHoursInput = signal<number | null>(null);
  sprintDurationPlaceholder = signal('14');
  targetSprintHoursPlaceholder = signal('80');

  onGenerateDraft() {
    const activeChatId = this.chatId();
    const companyId = this.projectState.userCompanyId();
    const managerId = this.projectState.userId();

    if (!activeChatId || !companyId || !managerId) return;

    const suggestedDuration = this.suggestedSprintDuration() ?? 14;
    const suggestedHours = this.suggestedTargetHours() ?? 80;

    this.projectNameInput.set('');
    this.projectNameArInput.set('');
    this.projectDescriptionEnInput.set('');
    this.projectDescriptionArInput.set('');
    this.sprintDurationInput.set(suggestedDuration);
    this.targetSprintHoursInput.set(suggestedHours);

    this.showNamePrompt.set(true);
  }

  async submitFinalization() {
    const activeChatId = this.chatId();
    const companyId = this.projectState.userCompanyId();
    const managerId = this.projectState.userId();

    // Use typed input, or fall back to simple defaults if left empty
    const nameEn = this.projectNameInput().trim() || 'New AI Project';
    const nameAr = this.projectNameArInput().trim() || nameEn;
    const descEn = this.projectDescriptionEnInput().trim() || 'Project requirements collected via AI Assistant.';
    const descAr = this.projectDescriptionArInput().trim() || descEn;
    const sprintDuration = this.sprintDurationInput() ?? (this.suggestedSprintDuration() ?? 14);
    const targetHours = this.targetSprintHoursInput() ?? (this.suggestedTargetHours() ?? 80);

    if (!activeChatId || !companyId || !managerId) return;

    this.isGeneratingDraft.set(true);
    
    try {
      // Step 1: Finalize session and save project draft with user-defined configuration DTO
      const res = await this.aiRequirements.finalizeSession(activeChatId, {
        projectNameEn: nameEn,
        projectNameAr: nameAr,
        companyId: companyId,
        sprintDurationInDays: sprintDuration || 0,
        targetSprintHours: targetHours || 0,
        descriptionEn: descEn,
        descriptionAr: descAr
      });
      const finalizeResult = res.data || res;
      
      if (finalizeResult && finalizeResult.projectId) {
        await this.projectState.loadProjects();
        this.showNamePrompt.set(false);
        this.draftGenerated.emit({ projectId: finalizeResult.projectId, draft: finalizeResult, chatId: activeChatId });
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
