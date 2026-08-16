import { Component, Input, Output, EventEmitter, signal, computed, inject, OnInit, OnChanges, SimpleChanges, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AiProjectService } from '../../shared/api/ai-project.service';
import { ProjectChatApi } from '../../shared/api/projectChat.api';
import { ToastService } from '../../shared/services/toast.service';
import { extractApiError } from '../../shared/api/auth.api';
import { AiChatMessageDto, SendAiMessageDto } from '../../shared/models/ai-chat.models';
import { detectTextDir } from '../../shared/utils/text-direction.util';

@Component({
  selector: 'app-project-ai-chat',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './project-ai-chat.component.html',
  styleUrls: ['./project-ai-chat.component.scss']
})
export class ProjectAiChatComponent implements OnInit, OnChanges {
  @Input() projectId?: string;
  @Input() projectName: string = 'New Project';
  @Input() isOpen: boolean = false;
  @Output() closeChat = new EventEmitter<void>();
  @Output() backlogUpdated = new EventEmitter<void>();

  private aiService = inject(AiProjectService);
  private projectChatApi = inject(ProjectChatApi);
  private toastService = inject(ToastService);

  @ViewChild('scrollContainer') scrollContainer!: ElementRef;

  messages = signal<AiChatMessageDto[]>([]);
  inputText = signal<string>('');
  isLoading = signal<boolean>(false);
  completenessScore = signal<number>(0);
  isReadyToGenerate = signal<boolean>(false);
  isTyping = signal<boolean>(false);

  detectTextDir = detectTextDir;
  
  completenessLabel = computed(() => {
    const score = this.completenessScore();
    if (score >= 85 && score < 100) {
      const history = this.messages();
      for (let i = history.length - 1; i >= 0; i--) {
        if (history[i].role === 'user') {
          return detectTextDir(history[i].content) === 'rtl' ? 'اكتمال قريب' : 'Almost Complete';
        }
      }
      return 'Almost Complete';
    }

    const history = this.messages();
    for (let i = history.length - 1; i >= 0; i--) {
      if (history[i].role === 'user') {
        return detectTextDir(history[i].content) === 'rtl' ? 'اكتمال المتطلبات' : 'Completeness Score';
      }
    }
    return 'Completeness Score';
  });

  ngOnInit(): void {
    if (this.isOpen && this.projectId) {
      this.loadSession();
    }
  }

  private scrollToBottom(): void {
    try {
      this.scrollContainer.nativeElement.scrollTop = 
        this.scrollContainer.nativeElement.scrollHeight;
    } catch (e) {}
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['isOpen'] && changes['isOpen'].currentValue === true) {
      if (this.projectId) {
        this.loadSession();
      } else {
        // Issue 1: Pre-fill the initial BRD question for a new project
        this.messages.set([
          {
            role: 'assistant',
            content: "Do you have a Business Requirement Document (BRD) you'd like to upload?",
            sequenceIndex: 1,
            timestamp: new Date().toISOString()
          }
        ]);
      }
    }
  }

  async loadSession() {
    if (!this.projectId) return;
    this.isLoading.set(true);
    
    try {
      const result = await this.projectChatApi.getSession(this.projectId);
      if (result.succeeded && result.data) {
        const mappedMessages = result.data.messages.map(m => ({
          role: ((m as any).role || (m as any).Role || 'assistant').toLowerCase(),
          content: (m as any).content || (m as any).Content || '',
          sequenceIndex: (m as any).sequenceIndex || (m as any).SequenceIndex || 0,
          timestamp: (m as any).timestamp || (m as any).Timestamp || new Date().toISOString()
        }));
        this.messages.set(mappedMessages);
        setTimeout(() => this.scrollToBottom(), 0);
      } else {
        this.messages.set([]);
      }
    } catch (error) {
      this.messages.set([]);
    } finally {
      this.isLoading.set(false);
    }
  }

  onFileSelected(event: any) {
    const file: File = event.target.files[0];
    if (file) {
      this.isLoading.set(true);
      this.aiService.uploadBrd(file).subscribe({
        next: (result) => {
          if (result.succeeded && result.data) {
            this.completenessScore.set(result.data.completenessScore);
            this.isReadyToGenerate.set(result.data.completenessScore >= 100);
            // Add a system message locally to show it was parsed
            const msg: AiChatMessageDto = {
              role: 'assistant',
              content: `I've analyzed your BRD. Completeness score is ${result.data.completenessScore}%. Let's chat to fill in the gaps!`,
              sequenceIndex: this.messages().length + 1,
              timestamp: new Date().toISOString()
            };
            this.messages.update(m => [...m, msg]);
          }
          this.isLoading.set(false);
        },
        error: () => this.isLoading.set(false)
      });
    }
  }

  async sendMessage() {
    const text = this.inputText().trim();
    if (!text) return;

    const tempUserMessage: AiChatMessageDto = {
        role: 'user',
        content: text,
        sequenceIndex: this.messages().length + 1,
        timestamp: new Date().toISOString()
    };

    this.messages.update(m => [...m, tempUserMessage]);
    this.inputText.set('');
    this.isTyping.set(true);
    this.isLoading.set(true);
    setTimeout(() => this.scrollToBottom(), 0);

    if (this.projectId) {
      try {
        const result = await this.projectChatApi.sendMessage(this.projectId, { message: text });
        if (result.succeeded && result.data) {
          const aiMessage: AiChatMessageDto = {
            role: 'assistant',
            content: result.data,
            sequenceIndex: this.messages().length + 1,
            timestamp: new Date().toISOString()
          };
          this.messages.update(m => [...m, aiMessage]);
          setTimeout(() => this.scrollToBottom(), 0);
        }
      } catch (error: any) {
        this.toastService.show(extractApiError(error) || 'Failed to get AI response.', 'error');
      } finally {
        this.isTyping.set(false);
        this.isLoading.set(false);
      }
    } else {
      const request: SendAiMessageDto = {
        message: text,
        chatHistory: this.messages()
      };

      this.aiService.processChat(request).subscribe({
        next: (result) => {
          if (result.succeeded && result.data) {
            const responseContent = typeof result.data === 'string' ? result.data : (result.data.message || '');
            const aiMessage: AiChatMessageDto = {
              role: 'assistant',
              content: responseContent,
              sequenceIndex: this.messages().length + 1,
              timestamp: new Date().toISOString()
            };
            this.messages.update(m => [...m, aiMessage]);
            setTimeout(() => this.scrollToBottom(), 0);
            if (result.data && typeof result.data !== 'string' && result.data.completenessScore !== undefined) {
              this.completenessScore.set(result.data.completenessScore);
              this.isReadyToGenerate.set(result.data.isReadyToGenerate || result.data.completenessScore >= 85);
            }
          }
          this.isTyping.set(false);
          this.isLoading.set(false);
        },
        error: (error: any) => {
          this.toastService.show(extractApiError(error) || 'Failed to get AI response.', 'error');
          this.isTyping.set(false);
          this.isLoading.set(false);
        }
      });
    }
  }

  close() {
    this.closeChat.emit();
  }

  async generateBacklog() {
    if (this.projectId) {
      this.isLoading.set(true);
      try {
        const result = await this.projectChatApi.confirmBacklog(this.projectId);
        if (result.succeeded) {
          this.backlogUpdated.emit();
          this.close();
        }
      } catch (error: any) {
        this.toastService.show(extractApiError(error) || 'Failed to generate backlog.', 'error');
      } finally {
        this.isLoading.set(false);
      }
      return;
    }

    this.isLoading.set(true);
    this.aiService.generateProject({
      projectId: this.projectId || '',
      projectName: this.projectName
    }).subscribe({
      next: (result) => {
        if (result.succeeded) {
          this.backlogUpdated.emit();
          this.close();
        }
        this.isLoading.set(false);
      },
      error: (error: any) => {
        this.toastService.show(extractApiError(error) || 'Failed to generate backlog.', 'error');
        this.isLoading.set(false);
      }
    });
  }
}
