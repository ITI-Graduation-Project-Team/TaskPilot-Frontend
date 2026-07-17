import { Component, ChangeDetectionStrategy, signal, computed, inject, input, OnInit, ViewChild, ElementRef, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TasksService, TaskCommentDto, TaskAttachmentDto } from '../../../../shared/api/tasks.service';
import { ToastService } from '../../../../shared/services/toast.service';
import { ProjectStateService } from '../../../../shared/services/project-state.service';
import { getUserIdFromToken } from '../../../../shared/lib/auth/cookie.helper';

@Component({
  selector: 'app-task-discussion',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule],
  templateUrl: './task-discussion.component.html'
})
export class TaskDiscussionComponent implements OnInit {
  taskId = input.required<string>();
  
  private tasksService = inject(TasksService);
  private toastService = inject(ToastService);
  public projectState = inject(ProjectStateService);
  
  comments = signal<TaskCommentDto[]>([]);
  attachments = signal<TaskAttachmentDto[]>([]);
  
  isLoading = signal(true);
  isPosting = signal(false);
  isUploading = signal(false);
  
  newCommentText = signal('');
  
  currentUserId = getUserIdFromToken() || '';
  
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;
  @ViewChild('commentsContainer') commentsContainer!: ElementRef<HTMLDivElement>;

  constructor() {
    effect(() => {
      const id = this.taskId();
      if (id) {
        this.loadData();
      }
    }, { allowSignalWrites: true });
  }

  ngOnInit(): void {
  }

  async loadData() {
    this.isLoading.set(true);
    try {
      const [commentsRes, attachmentsRes] = await Promise.all([
        this.tasksService.getComments(this.taskId()),
        this.tasksService.getAttachments(this.taskId())
      ]);
      this.comments.set(commentsRes);
      this.attachments.set(attachmentsRes);
      setTimeout(() => this.scrollToBottom(), 100);
    } catch (error) {
      console.error('Failed to load discussion:', error);
    } finally {
      this.isLoading.set(false);
    }
  }

  async postComment() {
    const text = this.newCommentText().trim();
    if (!text || this.isPosting()) return;
    
    this.isPosting.set(true);
    try {
      const newComment = await this.tasksService.addComment(this.taskId(), text);
      this.comments.update(c => [...c, newComment]);
      this.newCommentText.set('');
      setTimeout(() => this.scrollToBottom(), 100);
    } catch (error) {
      this.toastService.show('Failed to post comment', 'error');
    } finally {
      this.isPosting.set(false);
    }
  }

  async uploadFile(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;
    
    const file = input.files[0];
    this.isUploading.set(true);
    try {
      const newAttachment = await this.tasksService.addAttachment(this.taskId(), file);
      this.attachments.update(a => [...a, newAttachment]);
      this.toastService.show('Attachment uploaded', 'success');
    } catch (error) {
      this.toastService.show('Failed to upload attachment', 'error');
    } finally {
      this.isUploading.set(false);
      input.value = ''; // Reset input
    }
  }
  
  triggerFileInput() {
    this.fileInput.nativeElement.click();
  }

  private scrollToBottom() {
    if (this.commentsContainer) {
      const el = this.commentsContainer.nativeElement;
      el.scrollTop = el.scrollHeight;
    }
  }
  
  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleString([], {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
  
  getFileIcon(contentType: string): string {
    if (contentType.includes('image')) return '🖼️';
    if (contentType.includes('pdf')) return '📄';
    if (contentType.includes('spreadsheet') || contentType.includes('excel') || contentType.includes('csv')) return '📊';
    if (contentType.includes('word') || contentType.includes('document')) return '📝';
    return '📎';
  }
}
