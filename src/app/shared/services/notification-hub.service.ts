import { Injectable, computed, signal } from '@angular/core';
import {
  HubConnection,
  HubConnectionBuilder,
  HubConnectionState,
  IRetryPolicy,
  LogLevel,
  RetryContext
} from '@microsoft/signalr';
import { environment } from '../../../environments/environment';
import { NotificationDto, ProjectSetupStatusChangedDto, TaskStatusChangedDto } from '../models/notification.model';
import { notificationApi } from '../api/notification.api';
import { getAccessToken } from '../lib/auth/cookie.helper';

const reconnectPolicy: IRetryPolicy = {
  nextRetryDelayInMilliseconds(context: RetryContext): number {
    const delays = [0, 2_000, 5_000, 10_000, 30_000];
    return delays[Math.min(context.previousRetryCount, delays.length - 1)];
  }
};

const initialRetryDelays = [1_000, 2_000, 5_000, 10_000, 30_000];

export type NotificationHubConnectionState =
  | 'connecting'
  | 'connected'
  | 'reconnecting'
  | 'disconnected';

@Injectable({ providedIn: 'root' })
export class NotificationHubService {
  private hubConnection: HubConnection | null = null;
  private connectionPromise: Promise<void> | null = null;
  private initialRetryHandle: ReturnType<typeof setTimeout> | null = null;
  private initialRetryCount = 0;
  private stopping = false;

  private _notifications = signal<NotificationDto[]>([]);
  readonly notifications = this._notifications.asReadonly();

  private _latestNotification = signal<NotificationDto | null>(null);
  readonly latestNotification = this._latestNotification.asReadonly();

  private _latestProjectSetupStatusChange = signal<ProjectSetupStatusChangedDto | null>(null);
  readonly latestProjectSetupStatusChange = this._latestProjectSetupStatusChange.asReadonly();

  private _latestTaskStatusChange = signal<TaskStatusChangedDto | null>(null);
  readonly latestTaskStatusChange = this._latestTaskStatusChange.asReadonly();

  private _connectionRevision = signal(0);
  readonly connectionRevision = this._connectionRevision.asReadonly();

  private _connectionState = signal<NotificationHubConnectionState>('disconnected');
  readonly connectionState = this._connectionState.asReadonly();

  readonly unreadCount = computed(() => this._notifications().filter(notification => !notification.isRead).length);

  startConnection(): Promise<void> {
    this.stopping = false;
    if (this.hubConnection?.state === HubConnectionState.Connected
      || this.hubConnection?.state === HubConnectionState.Reconnecting) {
      return Promise.resolve();
    }

    if (this.connectionPromise) return this.connectionPromise;

    if (!getAccessToken()) {
      console.warn('Cannot connect to NotificationHub: No access token found.');
      return Promise.resolve();
    }

    this.clearInitialRetry();
    this._connectionState.set('connecting');
    this.connectionPromise = this.connect()
      .then(() => { this.initialRetryCount = 0; })
      .catch(error => {
        this._connectionState.set('disconnected');
        console.error('Error connecting to NotificationHub:', error);
        this.scheduleInitialRetry();
      })
      .finally(() => { this.connectionPromise = null; });

    return this.connectionPromise;
  }

  private async connect(): Promise<void> {
    const connection = this.ensureConnection();
    if (connection.state === HubConnectionState.Disconnected) {
      await connection.start();
      this._connectionState.set('connected');
      console.log('SignalR NotificationHub connected.');
    }

    // Connect first so notifications created while the initial list loads are received live.
    await this.syncNotifications();
    this._connectionRevision.update(revision => revision + 1);
  }

  private ensureConnection(): HubConnection {
    if (this.hubConnection) return this.hubConnection;

    const connection = new HubConnectionBuilder()
      .withUrl(environment.hubUrl, {
        accessTokenFactory: () => getAccessToken() ?? ''
      })
      .configureLogging(LogLevel.Information)
      .withAutomaticReconnect(reconnectPolicy)
      .build();

    connection.on('ReceiveNotification', (notification: NotificationDto) => {
      this.mergeNotifications([notification]);
    });

    connection.on('ProjectSetupStatusChanged', (change: ProjectSetupStatusChangedDto) => {
      this._latestProjectSetupStatusChange.set(this.normalizeProjectSetupStatusChange(change));
    });

    connection.on('TaskStatusChanged', (change: TaskStatusChangedDto) => {
      this._latestTaskStatusChange.set(this.normalizeTaskStatusChange(change));
    });

    connection.onreconnected(() => {
      this._connectionState.set('connected');
      void this.syncNotifications().finally(() => {
        this._connectionRevision.update(revision => revision + 1);
      });
    });

    connection.onreconnecting(() => {
      this._connectionState.set('reconnecting');
    });

    connection.onclose(error => {
      this._connectionState.set('disconnected');
      if (error) console.error('SignalR NotificationHub disconnected:', error);
      this.scheduleInitialRetry();
    });

    this.hubConnection = connection;
    return connection;
  }

  private scheduleInitialRetry(): void {
    if (this.stopping || this.initialRetryHandle || !getAccessToken()) return;

    const delay = initialRetryDelays[
      Math.min(this.initialRetryCount, initialRetryDelays.length - 1)
    ];
    this.initialRetryCount += 1;
    this.initialRetryHandle = setTimeout(() => {
      this.initialRetryHandle = null;
      void this.startConnection();
    }, delay);
  }

  private clearInitialRetry(): void {
    if (!this.initialRetryHandle) return;
    clearTimeout(this.initialRetryHandle);
    this.initialRetryHandle = null;
  }

  private async syncNotifications(): Promise<void> {
    try {
      const response = await notificationApi.getNotifications(false);
      if (response.data?.succeeded && response.data.data) {
        this.mergeNotifications(response.data.data as NotificationDto[]);
      }
    } catch (error) {
      // The live connection remains useful even if the historical sync fails.
      console.error('Failed to synchronize notifications:', error);
    }
  }

  private mergeNotifications(incoming: NotificationDto[]): void {
    const existingIds = new Set(this._notifications().map(notification => notification.id));
    const normalizedIncoming = incoming.map(notification => this.normalize(notification));
    const merged = new Map<string, NotificationDto>();

    for (const notification of [...normalizedIncoming, ...this._notifications()]) {
      if (!merged.has(notification.id)) merged.set(notification.id, notification);
    }

    this._notifications.set(
      [...merged.values()].sort((left, right) => Date.parse(right.createdAt) - Date.parse(left.createdAt))
    );

    const newestUnseen = normalizedIncoming.find(notification => !existingIds.has(notification.id));
    if (newestUnseen) this._latestNotification.set(newestUnseen);
  }

  private normalize(notification: NotificationDto): NotificationDto {
    return {
      ...notification,
      createdAt: notification.createdAt.endsWith('Z') ? notification.createdAt : `${notification.createdAt}Z`
    };
  }

  private normalizeProjectSetupStatusChange(change: ProjectSetupStatusChangedDto): ProjectSetupStatusChangedDto {
    const source = change as ProjectSetupStatusChangedDto & {
      ProjectId?: string;
      Stage?: ProjectSetupStatusChangedDto['stage'];
      Status?: ProjectSetupStatusChangedDto['status'];
      OccurredAt?: string;
    };
    return {
      projectId: source.projectId ?? source.ProjectId ?? '',
      stage: source.stage ?? source.Stage ?? 'Wbs',
      status: source.status ?? source.Status ?? 'NotStarted',
      occurredAt: source.occurredAt ?? source.OccurredAt ?? new Date().toISOString(),
    };
  }

  private normalizeTaskStatusChange(change: TaskStatusChangedDto): TaskStatusChangedDto {
    const source = change as TaskStatusChangedDto & {
      ProjectId?: string;
      SprintId?: string;
      TaskId?: string;
      TaskTitle?: string;
      PreviousStatus?: TaskStatusChangedDto['previousStatus'];
      NewStatus?: TaskStatusChangedDto['newStatus'];
      OccurredAt?: string;
    };
    const occurredAt = source.occurredAt ?? source.OccurredAt ?? new Date().toISOString();
    return {
      projectId: source.projectId ?? source.ProjectId ?? '',
      sprintId: source.sprintId ?? source.SprintId ?? '',
      taskId: source.taskId ?? source.TaskId ?? '',
      taskTitle: source.taskTitle ?? source.TaskTitle ?? '',
      previousStatus: source.previousStatus ?? source.PreviousStatus ?? 'ToDo',
      newStatus: source.newStatus ?? source.NewStatus ?? 'ToDo',
      occurredAt: occurredAt.endsWith('Z') ? occurredAt : `${occurredAt}Z`,
    };
  }

  async stopConnection(): Promise<void> {
    this.stopping = true;
    this.clearInitialRetry();
    if (this.connectionPromise) await this.connectionPromise;

    if (this.hubConnection) {
      await this.hubConnection.stop();
      this.hubConnection = null;
    }

    this.initialRetryCount = 0;
    this._connectionState.set('disconnected');
    this._notifications.set([]);
    this._latestNotification.set(null);
    this._latestProjectSetupStatusChange.set(null);
    this._latestTaskStatusChange.set(null);
  }

  async markAsRead(id: string): Promise<void> {
    const notification = this._notifications().find(item => item.id === id);
    if (!notification || notification.isRead) return;

    this._notifications.update(previous =>
      previous.map(item => item.id === id ? { ...item, isRead: true } : item)
    );

    try {
      await notificationApi.markAsRead(id);
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
      this._notifications.update(previous =>
        previous.map(item => item.id === id ? { ...item, isRead: false } : item)
      );
    }
  }

  async markAllAsRead(): Promise<void> {
    if (this.unreadCount() === 0) return;

    const previousState = this._notifications();
    this._notifications.update(previous => previous.map(item => ({ ...item, isRead: true })));

    try {
      await notificationApi.markAllAsRead();
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
      this._notifications.set(previousState);
    }
  }
}
