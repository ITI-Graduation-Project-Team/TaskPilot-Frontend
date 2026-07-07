import { Component, ChangeDetectionStrategy, signal, inject, input, output, OnDestroy, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AgileCoachService } from '../../../../shared/api/agile-coach.service';
import { ToastService } from '../../../../shared/services/toast.service';
import { ChatMessage, CitationDto, AgileCoachChatRequest } from '../../../../shared/models/agile-coach.models';

@Component({
  selector: 'app-agile-coach-chat',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [],
  templateUrl: './agile-coach-chat.component.html',
  styleUrls: ['./agile-coach-chat.component.scss']
})
export class AgileCoachChatComponent implements OnDestroy {
  taskItemId = input.required<string>();
  lang = input.required<string>();
  isOpen = input.required<boolean>();

  closed = output<void>();

  private agileCoachService = inject(AgileCoachService);
  private toastService = inject(ToastService);

  messages = signal<ChatMessage[]>([]);
  streamingContent = signal<string>('');
  isStreaming = signal(false);
  citations = signal<CitationDto[]>([]);
  inputText = signal<string>('');

  private abortStream?: () => void;

  constructor() {
    effect(() => {
      const _ = this.taskItemId(); // read to track
      this.resetChat();
    }, { allowSignalWrites: true });

    effect(() => {
      if (!this.isOpen()) {
        this.abortStream?.();
        this.isStreaming.set(false);
      }
    }, { allowSignalWrites: true });
  }

  ngOnDestroy(): void {
    this.abortStream?.();
  }

  private resetChat(): void {
    this.abortStream?.();
    this.messages.set([]);
    this.streamingContent.set('');
    this.isStreaming.set(false);
    this.citations.set([]);
    this.inputText.set('');
  }

  sendMessage(): void {
    if (this.isStreaming() || !this.inputText().trim()) return;

    const userMessage = this.inputText().trim();
    this.inputText.set('');

    this.messages.update(msgs => [
      ...msgs,
      { role: 'user', content: userMessage }
    ]);

    this.isStreaming.set(true);
    this.streamingContent.set('');
    this.citations.set([]);

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
      (errorCode) => {
        this.isStreaming.set(false);
        this.streamingContent.set('');
        this.toastService.show(`Chat error: ${errorCode}`, 'error');
      }
    );
  }

  private scrollToBottom(): void {
    setTimeout(() => {
      const el = document.getElementById('agile-chat-messages');
      if (el) el.scrollTop = el.scrollHeight;
    }, 0);
  }
}
