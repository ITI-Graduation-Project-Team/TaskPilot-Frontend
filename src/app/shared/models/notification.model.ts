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

export type ProjectSetupStage = 'Wbs' | 'SkillEnrichment';
export type ProjectSetupBackgroundStatus =
  | 'NotStarted'
  | 'Queued'
  | 'Running'
  | 'Succeeded'
  | 'PartiallySucceeded'
  | 'Failed';

export interface ProjectSetupStatusChangedDto {
  projectId: string;
  stage: ProjectSetupStage;
  status: ProjectSetupBackgroundStatus;
  occurredAt: string;
}

export type TaskItemStatus = 'ToDo' | 'InProgress' | 'Review' | 'Done';

export interface TaskStatusChangedDto {
  projectId: string;
  sprintId: string;
  taskId: string;
  taskTitle: string;
  previousStatus: TaskItemStatus;
  newStatus: TaskItemStatus;
  occurredAt: string;
}
