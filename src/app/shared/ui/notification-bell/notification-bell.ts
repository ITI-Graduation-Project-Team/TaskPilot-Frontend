import { Component, inject, computed, signal, HostListener, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { NotificationHubService } from '../../services/notification-hub.service';
import { NotificationDto } from '../../models/notification.model';

@Component({
  selector: 'app-notification-bell',
  standalone: true,
  imports: [CommonModule, RouterModule, TranslatePipe],
  templateUrl: './notification-bell.html',
  styleUrls: ['./notification-bell.scss']
})
export class NotificationBellComponent {
  private el = inject(ElementRef);
  public notificationHubService = inject(NotificationHubService);
  
  isOpen = signal(false);

  // Expose signals from service
  notifications = this.notificationHubService.notifications;
  unreadCount = this.notificationHubService.unreadCount;

  // Compute a limited list for the dropdown
  recentNotifications = computed(() => {
    return this.notifications().slice(0, 10);
  });

  togglePanel() {
    this.isOpen.update(v => !v);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    // Close the panel if clicking outside the component
    if (!this.el.nativeElement.contains(event.target)) {
      this.isOpen.set(false);
    }
  }

  onNotificationClick(notification: NotificationDto) {
    if (!notification.isRead) {
      this.notificationHubService.markAsRead(notification.id);
    }
    this.isOpen.set(false);
  }

  markAllAsRead() {
    this.notificationHubService.markAllAsRead();
  }

  getIconForType(type: string): string {
    switch(type) {
      case 'TaskAssigned': return 'fas fa-tasks text-blue-500';
      case 'TaskCompleted': return 'fas fa-check-circle text-green-500';
      case 'TaskOverdue': return 'fas fa-exclamation-circle text-red-500';
      case 'SprintStarted': return 'fas fa-running text-purple-500';
      case 'SprintRiskDetected': return 'fas fa-exclamation-triangle text-yellow-500';
      default: return 'fas fa-bell text-gray-500';
    }
  }
}
