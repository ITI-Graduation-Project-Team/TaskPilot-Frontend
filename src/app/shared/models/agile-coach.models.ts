export interface CitationDto {
  sourceDocument: string;
  sourceDocumentDisplayName: string;
  chunkExcerpt: string;
}

export interface AgileCoachSummaryResponse {
  id: string;
  taskItemId: string;
  codebaseNotes: string;
  relatedPastTasks: string;
  techStackContext: string;
  suggestedImplementationGuidance: string;
  citations: CitationDto[];
  generatedAt: string;
  isNewlyGenerated: boolean;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface AgileCoachChatRequest {
  taskItemId: string;
  message: string;
  history: ChatMessage[];
}
