export interface ProjectChatMessageDto {
  id: string;
  sessionId: string;
  role: string;
  content: string;
  sentAt: string;
}

export interface ProjectChatSessionDto {
  id: string;
  projectId: string;
  messages: ProjectChatMessageDto[];
}

export interface SendChatMessageDto {
  message: string;
}
