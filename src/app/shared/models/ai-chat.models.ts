export interface AiChatMessageDto { role: string; content: string; sequenceIndex: number; timestamp: string; }
export interface AiChatResponseDto { message: string; completenessScore: number; answeredQuestions: string[]; isReadyToGenerate: boolean; }
export interface BrdUploadResultDto { extractedText: string; detectedGaps: string[]; completenessScore: number; }
export interface GenerateProjectDto { projectId: string; projectName: string; }
export interface ProjectChatHistoryDto { projectId: string; messages: AiChatMessageDto[]; }
export interface SendAiMessageDto { projectId?: string; message: string; chatHistory: AiChatMessageDto[]; }
