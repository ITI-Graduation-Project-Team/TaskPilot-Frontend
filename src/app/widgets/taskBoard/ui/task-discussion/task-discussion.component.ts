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
  
  feedItems = computed(() => {
    const comments = this.comments().map(c => ({
      type: 'comment' as const,
      id: c.id,
      authorId: c.authorId,
      authorNameEn: c.authorNameEn,
      authorRole: c.authorRole,
      timestamp: c.createdAt,
      data: c
    }));
    const attachments = this.attachments().map(a => ({
      type: 'attachment' as const,
      id: a.id,
      authorId: a.uploaderId,
      authorNameEn: a.uploaderNameEn,
      authorRole: a.uploaderRole,
      timestamp: a.uploadedAt,
      data: a
    }));
    return [...comments, ...attachments].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  });
  
  isLoading = signal(true);
  isPosting = signal(false);
  isUploading = signal(false);
  
  newCommentText = signal('');
  stagedFile = signal<File | null>(null);
  
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
    const file = this.stagedFile();
    if ((!text && !file) || this.isPosting() || this.isUploading()) return;
    
    this.isPosting.set(true);
    try {
      if (file) {
        this.isUploading.set(true);
        const newAttachment = await this.tasksService.addAttachment(this.taskId(), file);
        this.attachments.update(a => [...a, newAttachment]);
        this.stagedFile.set(null);
        this.isUploading.set(false);
      }
      
      if (text) {
        const newComment = await this.tasksService.addComment(this.taskId(), text);
        this.comments.update(c => [...c, newComment]);
        this.newCommentText.set('');
      }
      setTimeout(() => this.scrollToBottom(), 100);
    } catch (error) {
      this.toastService.show('Failed to post', 'error');
      this.isUploading.set(false);
    } finally {
      this.isPosting.set(false);
    }
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;
    this.stagedFile.set(input.files[0]);
    input.value = '';
  }
  
  removeStagedFile() {
    this.stagedFile.set(null);
  }
  
  triggerFileInput() {
    this.fileInput.nativeElement.click();
  }

  isConsecutive(index: number): boolean {
    if (index === 0) return false;
    const current = this.feedItems()[index];
    const prev = this.feedItems()[index - 1];
    if (current.authorId !== prev.authorId) return false;
    
    // Check if within 5 minutes
    const currTime = new Date(current.timestamp).getTime();
    const prevTime = new Date(prev.timestamp).getTime();
    return (currTime - prevTime) < 5 * 60 * 1000;
  }

  getAbsoluteUrl(url: string): string {
    if (!url) return '#';
    let absUrl = url;
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      absUrl = 'https://' + url;
    }
    return absUrl;
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
