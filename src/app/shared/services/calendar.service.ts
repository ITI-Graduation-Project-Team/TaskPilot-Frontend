import { Injectable, signal, inject } from '@angular/core';
import { apiClient } from '../api/axios.instance';
import { ToastService } from './toast.service';

export interface CalendarTask {
  id: string;
  titleEn: string;
  titleAr: string;
  descriptionEn: string;
  descriptionAr: string;
  status: string;
  priority: string;
  startDate: string;
  endDate: string;
  projectId: string;
  projectNameEn?: string;
  projectNameAr?: string;
  assignedTo?: string;
}

export interface WorkloadStat {
  employeeId: string;
  employeeName: string;
  taskCount: number;
  totalHours?: number;
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
      // The backend returns { data: CalendarTask[] } or similar structure
      const data = response.data?.data || response.data || [];
      this.tasks.set(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to load calendar tasks', error);
      this.toastService.show('Failed to load calendar tasks', 'error');
      this.tasks.set([]);
    } finally {
      this.isLoading.set(false);
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
