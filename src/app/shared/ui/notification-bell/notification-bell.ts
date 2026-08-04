import { Component, inject, computed, signal, HostListener, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { NotificationHubService } from '../../services/notification-hub.service';
import { NotificationDto } from '../../models/notification.model';
import { AuthService } from '../../api/auth.service';
import { ProjectStateService } from '../../services/project-state.service';
import { SprintPlanningService } from '../../api/sprint-planning.service';

@Component({
  selector: 'app-notification-bell',
  standalone: true,
  imports: [CommonModule, RouterModule, TranslatePipe],
  templateUrl: './notification-bell.html',
  styleUrls: ['./notification-bell.scss']
})
export class NotificationBellComponent {
  private el = inject(ElementRef);
  private router = inject(Router);
  private authService = inject(AuthService);
  private projectState = inject(ProjectStateService);
  private sprintService = inject(SprintPlanningService);
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

  private async handleNavigation(url: string) {
    // If it's already a valid frontend route, navigate directly
    if (url.startsWith('/dashboard') || url.startsWith('/employee-dashboard')) {
      this.router.navigateByUrl(url);
      return;
    }

    const role = this.authService.getUserRole();
    const isEmployee = role === 'Employee';
    const baseRoute = isEmployee ? '/employee-dashboard' : '/dashboard';

    // Parse projectId from URLs like /projects/{id}...
    let projectId = '';
    const projectMatch = url.match(/\/projects\/([a-fA-F0-9-]+)/);
    if (projectMatch && projectMatch[1]) {
      projectId = projectMatch[1];
      this.projectState.setSelectedProject(projectId);
    }

    // Parse taskId if present
    const taskMatch = url.match(/\/tasks\/([a-fA-F0-9-]+)/);
    const queryParams: any = taskMatch && taskMatch[1] ? { taskId: taskMatch[1] } : {};

    console.log('Notification URL:', url);
    console.log('Parsed queryParams:', queryParams);

    // Parse sprintId if present
    const sprintMatch = url.match(/\/sprints\/([a-fA-F0-9-]+)/);
    if (sprintMatch && sprintMatch[1]) {
      queryParams['sprintId'] = sprintMatch[1];
      queryParams['sprintStatus'] = 'Active'; // Default
    }

    if (url.includes('/risks')) {
      queryParams['tab'] = 'health';
    }

    // Determine target based on URL content
    if (url.includes('/risks') || url.includes('/board')) {
      if (!isEmployee && !queryParams['sprintId'] && projectId) {
        try {
          const activeRes = await this.sprintService.getActiveSprint(projectId);
          const sprintData = activeRes?.data || activeRes;
          if (sprintData?.sprintId) {
            queryParams['sprintId'] = sprintData.sprintId;
            queryParams['sprintStatus'] = 'Active';
          }
        } catch {
          // Ignore
        }
      }
      this.router.navigate([baseRoute, 'sprint'], { queryParams });
    } else {
      this.router.navigate([baseRoute, isEmployee ? 'sprint' : 'projects'], { queryParams });
    }
  }

  onNotificationClick(notification: NotificationDto) {
    if (!notification.isRead) {
      this.notificationHubService.markAsRead(notification.id);
    }
    this.isOpen.set(false);
    if (notification.url) {
      this.handleNavigation(notification.url);
    }
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
