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
  | 'SprintRiskDetected';

export interface NotificationDto {
  id: string;
  messageEn: string;
  messageAr: string;
  type: NotificationType;
  url: string | null;
  isRead: boolean;
  createdAt: string;
}
