export type NotificationType =
  | 'TaskAssigned'
  | 'TaskUpdated'
  | 'TaskCompleted'
  | 'TaskOverdue'
  | 'UserStoryUpdated'
  | 'SprintStarted'
  | 'SprintEnded'
  | 'ProjectCreated'
  | 'ProjectUpdated'
  | 'CommentAdded'
  | 'UserAddedToProject'
  | 'SubscriptionExpiring'
  | 'PaymentSuccess'
  | 'PaymentFailed'
  | 'BugReported'
  | 'SprintRiskDetected'
  | 'BacklogGenerated'
  | 'ProjectSetupCompleted'
  | 'ProjectSetupFailed';

export interface NotificationDto {
  id: string;
  messageEn: string;
  messageAr: string;
  type: NotificationType;
  url: string | null;
  isRead: boolean;
  createdAt: string;
}
