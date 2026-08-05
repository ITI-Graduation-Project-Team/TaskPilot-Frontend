import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DialogRef, DIALOG_DATA } from '@angular/cdk/dialog';
import { ActivityFeedItemDto } from '../../data/sprint-health.models';
import { SprintHealthService } from '../../data/sprint-health.service';

export interface SprintAuditLogModalData {
  sprintId: string;
}

@Component({
  selector: 'app-sprint-audit-log-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="flex flex-col bg-surface border border-border shadow-2xl rounded-2xl w-[600px] max-w-[90vw] max-h-[85vh] overflow-hidden animate-[fadeScale_0.2s_ease_both]">
      
      <!-- Header -->
      <div class="px-6 py-5 border-b border-border flex items-center justify-between bg-surface sticky top-0 z-10">
        <div>
          <h2 class="text-lg font-bold text-text-primary">Sprint Audit Log</h2>
          <p class="text-xs font-semibold text-text-secondary mt-1">Complete history of activities and alerts</p>
        </div>
        <button 
          (click)="dialogRef.close()" 
          class="p-2 rounded-xl text-text-secondary hover:text-text-primary hover:bg-sidebar transition-colors"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <!-- Content / List -->
      <div class="p-6 overflow-y-auto custom-scrollbar flex-1">
        @if (isLoading()) {
          <!-- Skeleton Loading -->
          <div class="space-y-6">
            @for (i of [1,2,3,4,5]; track i) {
              <div class="flex gap-4 animate-pulse">
                <div class="w-8 h-8 rounded-full bg-border shrink-0"></div>
                <div class="flex-1 space-y-2 py-1">
                  <div class="h-4 bg-border rounded w-1/3"></div>
                  <div class="h-3 bg-border rounded w-3/4"></div>
                </div>
              </div>
            }
          </div>
        } @else if (error()) {
          <!-- Error State -->
          <div class="flex flex-col items-center justify-center py-10 text-center">
            <div class="w-12 h-12 rounded-full bg-error/10 flex items-center justify-center mb-4">
              <svg class="w-6 h-6 text-error" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p class="text-sm font-bold text-text-primary mb-1">Failed to load audit log</p>
            <p class="text-xs text-text-secondary">{{ error() }}</p>
            <button (click)="loadData()" class="mt-4 px-4 py-2 bg-primary/10 text-primary hover:bg-primary/20 rounded-xl text-xs font-bold transition-colors">
              Try Again
            </button>
          </div>
        } @else if (activities().length === 0) {
          <!-- Empty State -->
          <div class="flex flex-col items-center justify-center py-10 text-center">
            <div class="w-12 h-12 rounded-full bg-border flex items-center justify-center mb-4 text-text-secondary">
              <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
            </div>
            <p class="text-sm font-bold text-text-primary">No activities yet</p>
            <p class="text-xs text-text-secondary mt-1">Check back later when there is more action.</p>
          </div>
        } @else {
          <!-- Activity Timeline -->
          <div class="relative space-y-6">
            <!-- Continuous Line -->
            <div class="absolute left-4 top-4 bottom-4 w-px bg-border/60 -z-10"></div>
            
            @for (item of activities(); track item.id; let last = $last) {
              <div class="flex gap-4">
                <!-- Timeline Dot / Avatar -->
                <div class="relative shrink-0">
                  <div class="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold ring-4 ring-surface"
                       [ngClass]="getAvatarBg(item.actionType)">
                    {{ item.initials }}
                  </div>
                </div>
                
                <!-- Content -->
                <div class="flex-1 pb-1 pt-1">
                  <div class="flex items-center justify-between gap-4 mb-1">
                    <div class="flex items-center gap-2 flex-wrap">
                      <span class="text-sm font-bold text-text-primary">{{ item.name }}</span>
                      @if (item.actionType === 'CRITICAL') {
                        <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-error/10 text-error uppercase tracking-wide">CRITICAL</span>
                      }
                      @if (item.actionType === 'ALERT') {
                        <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-warning/10 text-warning uppercase tracking-wide">ALERT</span>
                      }
                      @if (item.actionType === 'WARNING') {
                        <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-warning/10 text-warning uppercase tracking-wide">WARNING</span>
                      }
                      @if (item.agentTag) {
                        <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-primary/10 text-primary">{{ item.agentTag }}</span>
                      }
                    </div>
                    <span class="text-xs font-semibold text-text-secondary whitespace-nowrap">{{ item.timeAgo }}</span>
                  </div>
                  <p class="text-sm text-text-secondary leading-relaxed">{{ item.description }}</p>
                  
                  <div class="text-[10px] text-text-secondary mt-1 font-mono">
                    {{ item.timestamp | date:'MMM d, y, h:mm a' }}
                  </div>
                </div>
              </div>
            }
          </div>
        }
      </div>
    </div>
  `
})
export class SprintAuditLogModalComponent implements OnInit {
  public dialogRef = inject(DialogRef<void>);
  private data = inject<SprintAuditLogModalData>(DIALOG_DATA);
  private sprintHealthService = inject(SprintHealthService);

  activities = signal<ActivityFeedItemDto[]>([]);
  isLoading = signal(true);
  error = signal<string | null>(null);

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.isLoading.set(true);
    this.error.set(null);
    this.sprintHealthService.getFullAuditLog(this.data.sprintId).subscribe({
      next: (res) => {
        this.activities.set(res || []);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Failed to load audit log', err);
        this.error.set('Failed to load audit log from server.');
        this.isLoading.set(false);
      }
    });
  }

  getAvatarBg(type: string): string {
    const t = (type || '').toUpperCase();
    if (t === 'ALERT' || t === 'CRITICAL') return 'bg-error/10 text-error';
    if (t === 'WARNING') return 'bg-warning/10 text-warning';
    if (t === 'SUCCESS') return 'bg-success/10 text-success';
    if (t === 'INFO') return 'bg-blue-500/10 text-blue-500';
    return 'bg-primary/10 text-primary';
  }
}
