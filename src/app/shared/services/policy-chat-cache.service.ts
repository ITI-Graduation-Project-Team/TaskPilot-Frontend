import { Injectable } from '@angular/core';

export type PolicyChatSender = 'user' | 'ai';
export type PolicyChatScope = 'company' | 'project';

export interface PolicyChatCacheMessage {
  id: string;
  sender: PolicyChatSender;
  text: string;
  timestamp: Date;
}

interface StoredPolicyChatMessage extends Omit<PolicyChatCacheMessage, 'timestamp'> {
  timestamp: string;
}

@Injectable({ providedIn: 'root' })
export class PolicyChatCacheService {
  private readonly storagePrefix = 'taskpilot.policy-chat.v1';
  private readonly maxMessagesPerChat = 200;

  load(scope: PolicyChatScope, scopeId: string, userId: string): PolicyChatCacheMessage[] {
    try {
      const raw = localStorage.getItem(this.getKey(scope, scopeId, userId));
      if (!raw) return [];

      const stored = JSON.parse(raw) as unknown;
      if (!Array.isArray(stored)) return [];

      return stored.flatMap((message): PolicyChatCacheMessage[] => {
        if (!this.isStoredMessage(message)) return [];

        const timestamp = new Date(message.timestamp);
        if (Number.isNaN(timestamp.getTime())) return [];

        return [{ ...message, timestamp }];
      });
    } catch {
      return [];
    }
  }

  save(
    scope: PolicyChatScope,
    scopeId: string,
    userId: string,
    messages: PolicyChatCacheMessage[]
  ): void {
    try {
      const stored: StoredPolicyChatMessage[] = messages
        .slice(-this.maxMessagesPerChat)
        .map(message => ({
          ...message,
          timestamp: message.timestamp.toISOString()
        }));

      localStorage.setItem(this.getKey(scope, scopeId, userId), JSON.stringify(stored));
    } catch {
      // Chat caching is best-effort and must never prevent sending a message.
    }
  }

  clear(scope: PolicyChatScope, scopeId: string, userId: string): void {
    try {
      localStorage.removeItem(this.getKey(scope, scopeId, userId));
    } catch {
      // Ignore unavailable browser storage.
    }
  }

  private getKey(scope: PolicyChatScope, scopeId: string, userId: string): string {
    return [this.storagePrefix, scope, userId, scopeId]
      .map(part => part.toLowerCase())
      .join(':');
  }

  private isStoredMessage(value: unknown): value is StoredPolicyChatMessage {
    if (!value || typeof value !== 'object') return false;

    const message = value as Partial<StoredPolicyChatMessage>;
    return typeof message.id === 'string'
      && (message.sender === 'user' || message.sender === 'ai')
      && typeof message.text === 'string'
      && typeof message.timestamp === 'string';
  }
}
