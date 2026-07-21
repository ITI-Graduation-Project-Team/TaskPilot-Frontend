import { Component, ChangeDetectionStrategy, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CompanyPoliciesService, PolicyDocument } from '../../../../shared/api/company-policies.service';
import { ProjectStateService } from '../../../../shared/services/project-state.service';
import { ToastService } from '../../../../shared/services/toast.service';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-knowledge-base',
  standalone: true,
  imports: [CommonModule, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="bg-surface rounded-3xl border border-border p-6 md:p-8 shadow-sm">
      <div class="mb-6 flex items-center justify-between">
        <div>
          <h3 class="text-lg font-bold text-text-primary font-display">{{ 'knowledgeBase.title' | translate }}</h3>
          <p class="text-sm text-text-secondary mt-1">{{ 'knowledgeBase.desc' | translate }}</p>
        </div>
      </div>

      <!-- Drag & Drop Upload Zone -->
      <div 
        class="w-full border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center transition-all duration-200"
        [class.border-primary]="isDragging()"
        [class.bg-primary]="isDragging()"
        [class.bg-opacity-5]="isDragging()"
        [class.border-border]="!isDragging()"
        [class.bg-sidebar]="!isDragging()"
        (dragover)="onDragOver($event)"
        (dragleave)="onDragLeave($event)"
        (drop)="onDrop($event)">
        
        <div class="w-16 h-16 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-4 transition-transform" [class.scale-110]="isDragging()">
          <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/>
          </svg>
        </div>
        
        <p class="text-sm font-bold text-text-primary mb-1">{{ 'knowledgeBase.dragDrop' | translate }}</p>
        <p class="text-xs text-text-secondary mb-4">{{ 'knowledgeBase.supportedFormats' | translate }}</p>
        
        <label class="cursor-pointer">
          <span class="px-5 py-2.5 bg-background border border-border hover:border-primary/40 text-text-primary text-xs font-bold rounded-xl shadow-sm transition-all">
            {{ 'knowledgeBase.browseFiles' | translate }}
          </span>
          <input type="file" class="hidden" accept=".pdf,.doc,.docx" (change)="onFileSelected($event)">
        </label>
      </div>

      @if (isUploading()) {
        <div class="mt-6 p-4 rounded-xl border border-primary/20 bg-primary/5 flex items-center gap-4">
          <svg class="animate-spin h-5 w-5 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
          <div>
            <p class="text-sm font-bold text-text-primary">{{ 'knowledgeBase.uploading' | translate }}</p>
            <p class="text-xs text-text-secondary">{{ 'knowledgeBase.uploadingDesc' | translate }}</p>
          </div>
        </div>
      }

      <!-- Uploaded Documents List -->
      <div class="mt-8">
        <h4 class="text-xs font-bold text-text-secondary mb-4 uppercase tracking-wider">{{ 'knowledgeBase.uploadedDocs' | translate }}</h4>
        
        @if (isLoading()) {
          <div class="flex items-center justify-center py-8">
            <svg class="animate-spin h-6 w-6 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
          </div>
        } @else if (documents().length === 0) {
          <div class="text-center py-8 bg-background border border-border border-dashed rounded-2xl">
            <p class="text-sm text-text-secondary">{{ 'knowledgeBase.noPolicies' | translate }}</p>
          </div>
        } @else {
          <div class="grid gap-3">
            @for (doc of documents(); track doc.id) {
              <div class="flex items-center justify-between p-4 bg-background border border-border rounded-2xl hover:border-primary/30 transition-colors group">
                <div class="flex items-center gap-4 min-w-0">
                  <div class="w-10 h-10 rounded-xl bg-error/10 text-error flex items-center justify-center shrink-0">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                    </svg>
                  </div>
                  <div class="min-w-0">
                    <p class="text-sm font-bold text-text-primary truncate">{{ doc.fileName }}</p>
                    <p class="text-[10px] text-text-secondary">{{ 'knowledgeBase.uploadedOn' | translate }} {{ doc.uploadedAt | date:'mediumDate' }}</p>
                  </div>
                </div>
                
                <button (click)="deleteDocument(doc.id)" [disabled]="isDeleting() === doc.id"
                        class="p-2 text-text-secondary hover:text-error hover:bg-error/10 rounded-lg transition-colors shrink-0 disabled:opacity-50">
                  @if (isDeleting() === doc.id) {
                    <svg class="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                  } @else {
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                    </svg>
                  }
                </button>
              </div>
            }
          </div>
        }
      </div>
    </div>
  `
})
export class KnowledgeBaseComponent implements OnInit {
  policyService = inject(CompanyPoliciesService);
  projectState = inject(ProjectStateService);
  toastService = inject(ToastService);

  documents = signal<PolicyDocument[]>([]);
  isLoading = signal(true);
  isUploading = signal(false);
  isDragging = signal(false);
  isDeleting = signal<string | null>(null);

  ngOnInit() {
    this.loadDocuments();
  }

  async loadDocuments() {
    try {
      this.isLoading.set(true);
      // Wait for companyId to be available (it should be since PM role guard checks it)
      const companyId = this.projectState.userCompanyId();
      if (!companyId) return;

      const docs = await this.policyService.getDocuments(companyId);
      this.documents.set(docs);
    } catch (error) {
      console.error('Error loading documents:', error);
      this.toastService.show('Failed to load documents', 'error');
    } finally {
      this.isLoading.set(false);
    }
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging.set(true);
  }

  onDragLeave(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging.set(false);
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging.set(false);

    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.handleFile(files[0]);
    }
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.handleFile(input.files[0]);
    }
  }

  async handleFile(file: File) {
    const companyId = this.projectState.userCompanyId();
    if (!companyId) return;

    // Validate size (e.g. 10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      this.toastService.show('File size exceeds 10MB limit', 'error');
      return;
    }

    try {
      this.isUploading.set(true);
      await this.policyService.uploadDocument(companyId, file);
      this.toastService.show('Document uploaded successfully', 'success');
      await this.loadDocuments();
    } catch (error) {
      console.error('Upload error:', error);
      this.toastService.show('Failed to upload document', 'error');
    } finally {
      this.isUploading.set(false);
    }
  }

  async deleteDocument(docId: string) {
    const companyId = this.projectState.userCompanyId();
    if (!companyId) return;

    if (!confirm('Are you sure you want to delete this document? The AI will no longer know about its contents.')) {
      return;
    }

    try {
      this.isDeleting.set(docId);
      await this.policyService.deleteDocument(companyId, docId);
      this.toastService.show('Document deleted', 'success');
      this.documents.update(docs => docs.filter(d => d.id !== docId));
    } catch (error) {
      console.error('Delete error:', error);
      this.toastService.show('Failed to delete document', 'error');
    } finally {
      this.isDeleting.set(null);
    }
  }
}
