import { Injectable, signal } from '@angular/core';

export interface ChatMessage {
  text: string;
  sender: 'user' | 'ai';
  timestamp: Date;
}

@Injectable({
  providedIn: 'root'
})
export class AiChatStateService {
  isLocalAiChatOpen = signal(false);

  chatId = signal<string | null>(null);
  completenessScore = signal(0);
  isReadyForFinalization = signal(false);
  clarifyingQuestions = signal<string[]>([]);
  chatHistory = signal<ChatMessage[]>([]);

  suggestedSprintDuration = signal<number | null>(null);
  suggestedTargetHours = signal<number | null>(null);

  showNamePrompt = signal(false);
  projectNameInput = signal('');
  projectNameArInput = signal('');
  projectDescriptionEnInput = signal('');
  projectDescriptionArInput = signal('');
  sprintDurationInput = signal<number | null>(null);
  targetSprintHoursInput = signal<number | null>(null);

  clearChat() {
    this.isLocalAiChatOpen.set(false);
    this.chatId.set(null);
    this.completenessScore.set(0);
    this.isReadyForFinalization.set(false);
    this.clarifyingQuestions.set([]);
    this.chatHistory.set([]);
    this.suggestedSprintDuration.set(null);
    this.suggestedTargetHours.set(null);
    this.showNamePrompt.set(false);
    this.projectNameInput.set('');
    this.projectNameArInput.set('');
    this.projectDescriptionEnInput.set('');
    this.projectDescriptionArInput.set('');
    this.sprintDurationInput.set(null);
    this.targetSprintHoursInput.set(null);
  }
}
