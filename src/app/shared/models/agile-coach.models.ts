
export interface AgileCoachSummaryResponse {
  id: string;
  taskItemId: string;
  content: string;
  generatedAt: string;
  isNewlyGenerated: boolean;
}

export interface ChatMessage {
  id?: string;
  role: 'user' | 'assistant';
  content: string;
  lang?: string;
  createdAt?: string;
}

export interface AgileCoachChatRequest {
  taskItemId: string;
  message: string;
  history: ChatMessage[];
}
