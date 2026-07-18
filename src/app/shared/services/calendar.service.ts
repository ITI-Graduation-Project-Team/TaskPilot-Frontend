import { Injectable, signal, inject } from '@angular/core';
import { apiClient } from '../api/axios.instance';
import { ToastService } from './toast.service';

export interface CalendarTask {
  id: string;
  titleEn: string;
  titleAr: string;
  descriptionEn?: string;
  descriptionAr?: string;
  isHidden?: boolean;
  status: string;
  priority: string;
  startDate: string;
  endDate: string;
  projectId: string;
  projectNameEn?: string;
  projectNameAr?: string;
  assignedTo?: string;
  eventType?: string;
}

export interface WorkloadStat {
  employeeId: string;
  employeeName: string;
  taskCount: number;
  totalHours?: number;
}

export interface CreateCalendarTaskDto {
  title: string;
  description?: string;
  startDate: string;
  durationInMinutes: number;
  eventType: string; // 'AssignedTask' | 'PersonalTask'
  priority: string;
}

@Injectable({
  providedIn: 'root'
})
export class CalendarService {
  private toastService = inject(ToastService);

  // State
  public tasks = signal<CalendarTask[]>([]);
  public workload = signal<WorkloadStat[]>([]);
  public isLoading = signal<boolean>(false);

  /**
   * Fetch tasks for a given date range
   */
  async loadTasks(start: string, end: string): Promise<void> {
    this.isLoading.set(true);
    try {
      const startDate = new Date(start).toISOString().split('T')[0];
      const endDate = new Date(end).toISOString().split('T')[0];
      const response = await apiClient.get<any>(`/calendar/tasks`, {
        params: { start: startDate, end: endDate }
      });

      const rawData = response.data?.data?.events || response.data?.events || response.data?.data || response.data || [];
      const eventsList = Array.isArray(rawData) ? rawData : [];

      const mappedTasks = eventsList.map((item: any) => {
        let normalizedStatus = item.status || 'ToDo';
        if (normalizedStatus === 0 || normalizedStatus === '0') normalizedStatus = 'ToDo';
        if (normalizedStatus === 1 || normalizedStatus === '1') normalizedStatus = 'InProgress';
        if (normalizedStatus === 2 || normalizedStatus === '2') normalizedStatus = 'Review';
        if (normalizedStatus === 3 || normalizedStatus === '3') normalizedStatus = 'Done';

        return {
          ...item,
          status: normalizedStatus,
          titleEn: item.titleEn || item.title || '',
          titleAr: item.titleAr || item.title || '',
          descriptionEn: item.descriptionEn || item.description || '',
          descriptionAr: item.descriptionAr || item.description || '',
          startDate: item.startDate || item.start || '',
          endDate: item.endDate || item.end || ''
        };
      });

      this.tasks.set(mappedTasks);
    } catch (error) {
      console.error('Failed to load calendar tasks', error);
      this.toastService.show('Failed to load calendar tasks', 'error');
      this.tasks.set([]);
    } finally {
      this.isLoading.set(false);
    }
  }

  /**
   * Create a new task (e.g., PersonalTask)
   */
  async createTask(dto: CreateCalendarTaskDto): Promise<boolean> {
    try {
      await apiClient.post('/calendar/tasks', dto);
      this.toastService.show('Task created successfully', 'success');
      return true;
    } catch (error) {
      console.error('Failed to create task', error);
      this.toastService.show('Failed to create task', 'error');
      return false;
    }
  }

  /**
   * Reschedule a specific task
   */
  async rescheduleTask(taskId: string, newStart: string, newEnd: string): Promise<boolean> {
    try {
      await apiClient.patch(`/calendar/tasks/${taskId}/reschedule`, {
        newStart,
        newEnd
      });
      this.toastService.show('Task rescheduled successfully', 'success');

      // Optimistically update the task in the current list
      this.tasks.update(currentTasks =>
        currentTasks.map(t =>
          t.id === taskId
            ? { ...t, startDate: newStart, endDate: newEnd }
            : t
        )
      );

      return true;
    } catch (error) {
      console.error('Failed to reschedule task', error);
      this.toastService.show('Failed to reschedule task', 'error');
      return false;
    }
  }

  /**
   * Delete a task
   */
  async deleteTask(taskId: string): Promise<boolean> {
    try {
      await apiClient.delete(`/calendar/tasks/${taskId}`);
      this.toastService.show('Task deleted successfully', 'success');

      // Optimistically update
      this.tasks.update(currentTasks => currentTasks.filter(t => t.id !== taskId));
      return true;
    } catch (error) {
      console.error('Failed to delete task', error);
      this.toastService.show('Failed to delete task', 'error');
      return false;
    }
  }
  /**
   * Update task details (title, status, priority, etc.)
   */
  async updateTask(taskId: string, payload: any): Promise<boolean> {
    try {
      await apiClient.patch(`/calendar/tasks/${taskId}`, payload);
      this.toastService.show('Task updated successfully', 'success');

      // Optimistically update
      this.tasks.update(currentTasks => 
        currentTasks.map(t => 
          t.id === taskId 
            ? { 
                ...t, 
                titleEn: payload.title || payload.titleEn || t.titleEn, 
                descriptionEn: payload.description !== undefined ? payload.description : t.descriptionEn,
                status: payload.status || t.status, 
                priority: payload.priority || t.priority,
                startDate: payload.startDate || t.startDate,
                endDate: payload._endDate || t.endDate
              } 
            : t
        )
      );
      return true;
    } catch (error) {
      console.error('Failed to update task', error);
      this.toastService.show('Failed to update task', 'error');
      return false;
    }
  }

  /**
   * Fetch team workload summary
   */
  async loadWorkload(): Promise<void> {
    try {
      const response = await apiClient.get<any>(`/calendar/workload`);
      const data = response.data?.data || response.data || [];
      this.workload.set(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to load workload', error);
      this.workload.set([]);
    }
  }
}
