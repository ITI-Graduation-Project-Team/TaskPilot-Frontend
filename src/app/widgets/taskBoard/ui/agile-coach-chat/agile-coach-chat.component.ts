import { Component, ChangeDetectionStrategy, signal, inject, input, output, OnDestroy, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AgileCoachService } from '../../../../shared/api/agile-coach.service';
import { ChatMessage, AgileCoachChatRequest } from '../../../../shared/models/agile-coach.models';

@Component({
  selector: 'app-agile-coach-chat',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule],
  templateUrl: './agile-coach-chat.component.html',
  styleUrls: ['./agile-coach-chat.component.scss']
})
export class AgileCoachChatComponent implements OnDestroy {
  taskItemId = input.required<string>();
  lang = input.required<string>();
  isOpen = input.required<boolean>();
  loadInitialSummary = input<boolean>(false);
  taskTitle = input<string>('');

  closed = output<void>();

  private agileCoachService = inject(AgileCoachService);

  messages = signal<ChatMessage[]>([]);
  streamingContent = signal<string>('');
  isStreaming = signal(false);
  isLoadingSummary = signal(false);
  summaryFailed = signal(false);
  summaryAttempted = signal(false); // ← tracks if we already tried (prevents infinite loop)
  summary = signal<{ content: string } | null>(null);
  inputText = signal<string>('');

  private abortStream?: () => void;

  constructor() {
    effect(() => {
      const _ = this.taskItemId();
      this.resetChat();
    }, { allowSignalWrites: true });

    effect(async () => {
      if (this.isOpen()) {
        // Only attempt once — summaryAttempted prevents infinite re-runs on failure
        if (!this.summaryAttempted() && !this.isLoadingSummary()) {
          await this.loadHistory();
        }
      } else {
        this.abortStream?.();
        this.isStreaming.set(false);
      }
    }, { allowSignalWrites: true });
  }

  ngOnDestroy(): void {
    this.abortStream?.();
  }

  async retryLoadSummary(): Promise<void> {
    this.summaryAttempted.set(false); // allow retry
    this.summaryFailed.set(false);
    await this.loadHistory();
  }

  private async loadHistory(): Promise<void> {
    try {
      this.isLoadingSummary.set(true);
      this.summaryAttempted.set(true);
      this.summaryFailed.set(false);

      const history = await this.agileCoachService.getChatHistory(this.taskItemId());
      
      if (this.loadInitialSummary()) {
        await this.loadSummary();
      }

      if (history && history.length > 0) {
        this.messages.set(history);
        this.scrollToBottom();
      }
    } catch {
      this.summaryFailed.set(true);
    } finally {
      this.isLoadingSummary.set(false);
    }
  }

  private async loadSummary(): Promise<void> {
    try {
      this.isLoadingSummary.set(true);
      this.summaryFailed.set(false);

      const summaryRes = await this.agileCoachService.getSummary(this.taskItemId());

      this.summary.set({
        content: summaryRes.content || 'Summary is ready. Ask me anything about this task!'
      });
      this.scrollToBottom();
    } catch {
      this.summaryFailed.set(true);
    } finally {
      this.isLoadingSummary.set(false);
    }
  }

  private resetChat(): void {
    this.abortStream?.();
    this.messages.set([]);
    this.summary.set(null);
    this.streamingContent.set('');
    this.isStreaming.set(false);
    this.isLoadingSummary.set(false);
    this.summaryFailed.set(false);
    this.summaryAttempted.set(false);
    this.inputText.set('');
  }

  sendMessage(): void {
    if (this.isStreaming() || this.isLoadingSummary() || !this.inputText().trim()) return;

    const userMessage = this.inputText().trim();
    this.inputText.set('');

    this.messages.update(msgs => [...msgs, { role: 'user', content: userMessage }]);
    this.isStreaming.set(true);
    this.streamingContent.set('');

    const request: AgileCoachChatRequest = {
      taskItemId: this.taskItemId(),
      message: userMessage,
      history: this.messages().slice(0, -1)
    };

    this.abortStream = this.agileCoachService.streamChat(
      request,
      (token) => {
        this.streamingContent.update(c => c + token);
        this.scrollToBottom();
      },
      () => {
        this.messages.update(msgs => [
          ...msgs,
          { role: 'assistant', content: this.streamingContent() }
        ]);
        this.streamingContent.set('');
        this.isStreaming.set(false);
        this.scrollToBottom();
      },
      () => {
        // Show inline error in the message thread
        this.messages.update(msgs => [
          ...msgs,
          { role: 'assistant', content: '__error__' }
        ]);
        this.isStreaming.set(false);
        this.streamingContent.set('');
      }
    );
  }

  isErrorMessage(content: string): boolean {
    return content === '__error__';
  }

  private scrollToBottom(): void {
    setTimeout(() => {
      const el = document.getElementById('agile-chat-messages');
      if (el) el.scrollTop = el.scrollHeight;
    }, 0);
  }
}
