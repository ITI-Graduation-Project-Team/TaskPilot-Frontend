import { Component, ChangeDetectionStrategy, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GeneralSettingsComponent } from '../general-settings/general-settings.component';
import { KnowledgeBaseComponent } from '../knowledge-base/knowledge-base.component';
import { PolicyChatComponent } from '../policy-chat/policy-chat.component';
import { ProjectStateService } from '../../../../shared/services/project-state.service';

type OrgTab = 'settings' | 'knowledge' | 'chat';

@Component({
  selector: 'app-organization-view',
  standalone: true,
  imports: [CommonModule, GeneralSettingsComponent, KnowledgeBaseComponent, PolicyChatComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="h-full flex flex-col animate-[fadeIn_0.3s_ease_both]">
      
      <!-- Organization Header -->
      <div class="mb-8">
        <h2 class="text-3xl font-extrabold tracking-tight text-text-primary font-display">
          @if (projectState.isProjectManager()) { Organization Hub } @else { Company Policies }
        </h2>
        <p class="mt-2 max-w-2xl text-sm leading-6 text-text-secondary">
          @if (projectState.isProjectManager()) {
            Manage your company's general settings, upload policy documents, and test the AI HR Assistant.
          } @else {
            Ask the AI Assistant questions about company policies, leave days, and general guidelines.
          }
        </p>
      </div>

      @if (projectState.isProjectManager()) {
        <!-- PM View: Tabbed Interface -->
        <div class="flex flex-col lg:flex-row gap-8">
          
          <!-- Inner Sidebar for Org Tabs -->
          <aside class="w-full lg:w-64 shrink-0">
            <nav class="flex lg:flex-col gap-2 overflow-x-auto lg:overflow-visible pb-2 lg:pb-0 scrollbar-hide">
              <button (click)="currentTab.set('settings')"
                      [class.bg-primary]="currentTab() === 'settings'" [class.text-white]="currentTab() === 'settings'" [class.shadow-md]="currentTab() === 'settings'"
                      [class.bg-surface]="currentTab() !== 'settings'" [class.text-text-secondary]="currentTab() !== 'settings'" [class.hover:text-text-primary]="currentTab() !== 'settings'" [class.hover:border-primary/40]="currentTab() !== 'settings'"
                      class="flex items-center gap-3 px-4 py-3 rounded-2xl transition-all border border-transparent whitespace-nowrap text-sm font-bold">
                <svg class="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                General Settings
              </button>
              
              <button (click)="currentTab.set('knowledge')"
                      [class.bg-primary]="currentTab() === 'knowledge'" [class.text-white]="currentTab() === 'knowledge'" [class.shadow-md]="currentTab() === 'knowledge'"
                      [class.bg-surface]="currentTab() !== 'knowledge'" [class.text-text-secondary]="currentTab() !== 'knowledge'" [class.hover:text-text-primary]="currentTab() !== 'knowledge'" [class.hover:border-primary/40]="currentTab() !== 'knowledge'"
                      class="flex items-center gap-3 px-4 py-3 rounded-2xl transition-all border border-transparent whitespace-nowrap text-sm font-bold">
                <svg class="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/></svg>
                Knowledge Base
              </button>

              <button (click)="currentTab.set('chat')"
                      [class.bg-primary]="currentTab() === 'chat'" [class.text-white]="currentTab() === 'chat'" [class.shadow-md]="currentTab() === 'chat'"
                      [class.bg-surface]="currentTab() !== 'chat'" [class.text-text-secondary]="currentTab() !== 'chat'" [class.hover:text-text-primary]="currentTab() !== 'chat'" [class.hover:border-primary/40]="currentTab() !== 'chat'"
                      class="flex items-center gap-3 px-4 py-3 rounded-2xl transition-all border border-transparent whitespace-nowrap text-sm font-bold">
                <svg class="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"/></svg>
                Policy Chat (Test)
              </button>
            </nav>
          </aside>

          <!-- Main Content Area for PM -->
          <div class="flex-1 min-w-0">
            @if (currentTab() === 'settings') {
              <app-general-settings></app-general-settings>
            } @else if (currentTab() === 'knowledge') {
              <app-knowledge-base></app-knowledge-base>
            } @else if (currentTab() === 'chat') {
              <app-policy-chat></app-policy-chat>
            }
          </div>
        </div>
      } @else {
        <!-- Employee View: Direct Chat -->
        <div class="max-w-4xl mx-auto w-full">
          <app-policy-chat></app-policy-chat>
        </div>
      }

    </div>
  `
})
export class OrganizationViewComponent {
  projectState = inject(ProjectStateService);
  
  // Default to knowledge base for PMs if they want to setup policies.
  // For employees, this value is ignored as they always see the chat view directly.
  currentTab = signal<OrgTab>('knowledge'); 
}
