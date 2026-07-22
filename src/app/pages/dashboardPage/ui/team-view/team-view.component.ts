import { Component, ChangeDetectionStrategy, signal, computed, inject, OnInit, effect, untracked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TeamCollaborationService, EmployeeAssignmentDto } from '../../../../shared/api/team-collaboration.service';
import { ProjectStateService } from '../../../../shared/services/project-state.service';
import { ToastService } from '../../../../shared/services/toast.service';

interface CompanyEmployee {
  employeeId: string;
  id?: string;
  fullName: string;
  firstName?: string;
  lastName?: string;
  email: string;
  jobTitle: string;
  seniorityLevel?: string;
  availabilityStatus?: string;
  skills?: string[];
}

interface ProjectEmployee {
  employeeId: string;
  fullName: string;
  email: string;
  role: string;
}

@Component({
  selector: 'app-team-view',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-6">
      
      <!-- Top header -->
      <div>
        <h2 class="text-2xl font-bold text-text-primary">Team Management</h2>
        <p class="text-text-secondary text-sm">Invite members to your company and assign them to your projects.</p>
      </div>

      <!-- Main Layout -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        <!-- Left Side: Invitations -->
        <div class="bg-surface border border-border p-5 rounded-2xl shadow-sm space-y-4">
          <h3 class="font-bold text-text-primary text-base pb-2 border-b border-border">Invite New Members</h3>
          <p class="text-xs text-text-secondary">Send emails to invite professionals to join your company team.</p>
          
          <form (submit)="onSendInvitations($event)" class="space-y-4">
            <div>
              <label class="block text-xs font-bold text-text-secondary mb-1.5 uppercase">Emails</label>
              
              <!-- Chips Container simulating a textarea/input box -->
              <div class="flex flex-wrap gap-2 w-full bg-background border border-border rounded-xl p-3 min-h-[110px] items-start align-content-start focus-within:ring-2 focus-within:ring-primary/20 transition-all cursor-text"
                   (click)="emailField.focus()">
                
                @for (email of emailsList(); track email; let idx = $index) {
                  <span [class.bg-red-500/10]="invalidEmailsMap()[email.toLowerCase()]"
                        [class.border-red-500/20]="invalidEmailsMap()[email.toLowerCase()]"
                        [class.text-red-500]="invalidEmailsMap()[email.toLowerCase()]"
                        [class.bg-primary/10]="!invalidEmailsMap()[email.toLowerCase()]"
                        [class.border-primary/25]="!invalidEmailsMap()[email.toLowerCase()]"
                        [class.text-primary]="!invalidEmailsMap()[email.toLowerCase()]"
                        class="inline-flex items-center gap-1.5 border px-3 py-1 rounded-full text-xs font-semibold animate-[scaleUp_0.15s_ease_both]">
                    <span>{{ email }}</span>
                    <button type="button" (click)="removeEmail(idx); $event.stopPropagation()"
                            class="hover:bg-primary/20 rounded-full w-4 h-4 flex items-center justify-center text-[10px] font-bold transition-all">
                      ✕
                    </button>
                  </span>
                }
                
                <input type="email" [value]="currentEmailInput()" (input)="currentEmailInput.set(emailField.value)" #emailField
                       (keydown)="onEmailInputKeydown($event)" (blur)="addEmail(emailField.value)"
                       placeholder="e.g. employee@company.com"
                       class="flex-1 min-w-[180px] bg-transparent border-none outline-none text-sm text-text-primary placeholder:text-text-secondary/50 py-1"
                       autocomplete="off">
              </div>
              @for (email of emailsList(); track email) {
                @if (invalidEmailsMap()[email.toLowerCase()]) {
                  <p class="text-[11px] text-red-500 font-semibold mt-1 flex items-center gap-1 animate-[fadeIn_0.2s_ease_both]">
                    <svg class="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
                    </svg>
                    {{ email }}: {{ invalidEmailsMap()[email.toLowerCase()] }}
                  </p>
                }
              }
              <p class="text-[10px] text-text-secondary mt-1.5">Press <kbd class="px-1 bg-border rounded text-text-primary text-[9px] font-mono">Enter</kbd>, <kbd class="px-1 bg-border rounded text-text-primary text-[9px] font-mono">Space</kbd> or <kbd class="px-1 bg-border rounded text-text-primary text-[9px] font-mono">Comma</kbd> to add the email.</p>
            </div>
            
            <button type="submit" 
                    [disabled]="isInviting() || (emailsList().length === 0 && !currentEmailInput().trim())"
                    class="w-full py-3 bg-primary hover:bg-primary-hover text-white font-bold rounded-xl shadow-md transition-all disabled:opacity-50">
              @if (isInviting()) {
                Sending Invites...
              } @else {
                Send Invitations
              }
            </button>
          </form>
        </div>

        <!-- Center: Assign Employees to Project -->
        <div class="bg-surface border border-border p-5 rounded-2xl shadow-sm space-y-4 lg:col-span-2">
          <div class="flex items-center justify-between pb-2 border-b border-border flex-wrap gap-2">
            <h3 class="font-bold text-text-primary text-base">Active Project Assignment</h3>
            @if (projectState.selectedProjectId()) {
              <span class="text-xs bg-primary/10 text-primary font-bold px-2.5 py-0.5 rounded-full border border-primary/25 truncate max-w-[200px]">
                {{ activeProjectName() }}
              </span>
            } @else {
              <span class="text-xs text-red-500 font-bold">Select a project first</span>
            }
          </div>

          @if (!projectState.selectedProjectId()) {
            <div class="flex flex-col items-center justify-center py-12 text-center text-text-secondary text-sm">
              <svg class="w-10 h-10 mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
              Please select a project from the top dropdown to manage team assignments.
            </div>
          } @else {
            <!-- Error Banner -->
            @if (assignError()) {
              <div class="mb-4 p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-start gap-2.5 text-red-600 dark:text-red-400 text-xs animate-[fadeIn_0.2s_ease_both]">
                <svg class="w-4 h-4 mt-0.5 shrink-0 text-red-500 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
                </svg>
                <div class="flex-1">
                  <p class="font-extrabold text-sm text-red-700 dark:text-red-300">Assignment Failed</p>
                  <p class="mt-0.5 leading-relaxed">{{ assignError() }}</p>
                </div>
                <button (click)="assignError.set(null)" class="text-red-500/70 hover:text-red-600 dark:hover:text-red-400 font-bold text-sm shrink-0">✕</button>
              </div>
            }

            <!-- Form to assign -->
            @if (projectState.selectedProject()?.status !== 'Completed' && projectState.selectedProject()?.status !== 'Archived') {
              <form (submit)="onAssignEmployee($event)" class="grid grid-cols-1 md:grid-cols-3 gap-4 bg-sidebar p-4 rounded-xl border border-border">
              <div class="relative">
                <label class="block text-xs font-bold text-text-secondary mb-1.5">Select Member</label>
                <!-- Custom Dropdown Trigger -->
                <div (click)="isDropdownOpen.set(!isDropdownOpen())"
                     class="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm cursor-pointer flex items-center gap-2 hover:border-primary/50 transition-all">
                  @if (selectedEmployeeId) {
                    @for (emp of companyEmployees(); track emp.employeeId) {
                      @if (emp.employeeId === selectedEmployeeId) {
                        <div class="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                             [style.background]="getAvatarColor(emp.email)">
                          {{ getInitials(emp.fullName, emp.email) }}
                        </div>
                        <div class="flex flex-col leading-tight min-w-0">
                          @if (emp.fullName && emp.fullName !== emp.email) {
                            <span class="text-text-primary font-semibold truncate text-xs">{{ emp.fullName }}</span>
                            <span class="text-text-secondary truncate text-[10px]">{{ emp.email }}</span>
                          } @else {
                            <span class="text-text-primary font-semibold truncate text-xs">{{ emp.email }}</span>
                          }
                        </div>
                      }
                    }
                  } @else {
                    <span class="text-text-secondary">-- Choose Member --</span>
                  }
                  <svg class="w-4 h-4 ml-auto text-text-secondary shrink-0 transition-transform"
                       [class.rotate-180]="isDropdownOpen()"
                       fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
                  </svg>
                </div>
                <!-- Dropdown List -->
                @if (isDropdownOpen()) {
                  <div class="absolute z-50 top-full left-0 right-0 mt-1 bg-surface border border-border rounded-xl shadow-xl overflow-hidden max-h-52 overflow-y-auto animate-[fadeDown_0.15s_ease_both]">
                    @for (emp of unassignedCompanyEmployees(); track emp.employeeId) {
                      <div (click)="selectEmployee(emp.employeeId)"
                           class="flex items-center gap-3 px-3 py-2.5 cursor-pointer hover:bg-sidebar transition-colors"
                           [class.bg-primary/10]="emp.employeeId === selectedEmployeeId">
                        <div class="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                             [style.background]="getAvatarColor(emp.email)">
                          {{ getInitials(emp.fullName, emp.email) }}
                        </div>
                        <div class="flex flex-col leading-tight min-w-0">
                          @if (emp.fullName && emp.fullName !== emp.email) {
                            <span class="text-sm font-semibold text-text-primary truncate">{{ emp.fullName }}</span>
                            <span class="text-[11px] text-text-secondary truncate">{{ emp.email }}</span>
                          } @else {
                            <span class="text-sm font-semibold text-text-primary truncate">{{ emp.email }}</span>
                          }
                        </div>
                        @if (failedEmployeeIds().includes(emp.employeeId)) {
                          <span class="text-[10px] text-red-500 font-bold ml-auto px-1.5 py-0.5 bg-red-500/10 rounded border border-red-500/20 shrink-0">
                            Already in another project
                          </span>
                        } @else if (emp.employeeId === selectedEmployeeId) {
                          <svg class="w-4 h-4 text-primary ml-auto shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
                          </svg>
                        }
                      </div>
                    } @empty {
                      <div class="p-4 text-center text-xs text-text-secondary">
                        All company members are already assigned to this project.
                      </div>
                    }
                  </div>
                }
              </div>

              <div>
                <label class="block text-xs font-bold text-text-secondary mb-1.5">Role</label>
                <select [(ngModel)]="assignedRole" name="assignRole" required
                        class="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm outline-none cursor-pointer">
                  <option value="Developer">Developer</option>
                  <option value="QA">QA / Tester</option>
                  <option value="Scrum Master">Scrum Master</option>
                  <option value="Product Owner">Product Owner</option>
                  <option value="Designer">UI/UX Designer</option>
                </select>
              </div>

              <div class="flex items-end">
                <button type="submit" 
                        [disabled]="isAssigning() || !selectedEmployeeId"
                        class="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-all shadow-md disabled:opacity-50">
                  Assign to Project
                </button>
              </div>
              </form>
            }

            <!-- Project Team list -->
            <div class="space-y-3 mt-4">
              <h4 class="text-xs font-bold text-text-secondary uppercase tracking-wider">Assigned Project Team ({{ projectTeam().length }})</h4>
              
              @if (isLoadingTeam()) {
                <div class="flex items-center gap-2 text-sm text-text-secondary py-4">
                  <div class="w-4 h-4 rounded-full border-2 border-primary border-t-transparent animate-spin"></div>
                  Loading project team assignments...
                </div>
              } @else if (projectTeam().length === 0) {
                <div class="text-xs text-text-secondary bg-sidebar border border-border p-4 rounded-xl">
                  No employees are currently assigned to this project. Use the form above to add members.
                </div>
              } @else {
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  @for (member of projectTeam(); track member.employeeId) {
                    <div class="bg-sidebar border border-border p-4 rounded-xl flex items-center justify-between gap-3 hover:border-primary/20 transition-all">
                      <div>
                        <h5 class="text-sm font-bold text-text-primary">{{ member.fullName }}</h5>
                        <p class="text-xs text-text-secondary">{{ member.email }}</p>
                      </div>
                      <span class="px-2.5 py-1 text-[10px] font-bold bg-primary/10 text-primary border border-primary/20 rounded-full">
                        {{ member.role }}
                      </span>
                    </div>
                  }
                </div>
              }
            </div>
          }
        </div>

      </div>
    </div>
  `
})
export class TeamViewComponent implements OnInit {
  private teamService = inject(TeamCollaborationService);
  public projectState = inject(ProjectStateService);
  private toastService = inject(ToastService);

  emailsList = signal<string[]>([]);
  currentEmailInput = signal('');
  isInviting = signal(false);

  companyEmployees = signal<CompanyEmployee[]>([]);
  projectTeam = signal<ProjectEmployee[]>([]);
  
  readonly unassignedCompanyEmployees = computed(() => {
    const assignedIds = new Set(this.projectTeam().map(p => p.employeeId));
    return this.companyEmployees().filter(emp => !assignedIds.has(emp.employeeId || emp.id || ''));
  });

  selectedEmployeeId = '';
  assignedRole = 'Developer';
  isAssigning = signal(false);
  isLoadingTeam = signal(false);
  isDropdownOpen = signal(false);

  activeProjectName = signal('Loading Project...');
  assignError = signal<string | null>(null);
  failedEmployeeIds = signal<string[]>([]);
  invalidEmailsMap = signal<Record<string, string>>({});

  getInitials(fullName: string, email: string): string {
    if (fullName && fullName !== email && fullName.trim()) {
      const parts = fullName.trim().split(' ');
      return parts.length >= 2
        ? (parts[0][0] + parts[1][0]).toUpperCase()
        : parts[0][0].toUpperCase();
    }
    return email ? email[0].toUpperCase() : '?';
  }

  getAvatarColor(email: string): string {
    const colors = [
      'linear-gradient(135deg,#6366f1,#8b5cf6)',
      'linear-gradient(135deg,#3b82f6,#06b6d4)',
      'linear-gradient(135deg,#10b981,#059669)',
      'linear-gradient(135deg,#f59e0b,#ef4444)',
      'linear-gradient(135deg,#ec4899,#8b5cf6)',
      'linear-gradient(135deg,#14b8a6,#3b82f6)',
    ];
    let hash = 0;
    for (let i = 0; i < (email || '').length; i++) hash += email.charCodeAt(i);
    return colors[hash % colors.length];
  }

  selectEmployee(id: string) {
    this.selectedEmployeeId = id;
    this.isDropdownOpen.set(false);
    this.assignError.set(null);
    this.failedEmployeeIds.update(ids => ids.filter(x => x !== id));
  }

  constructor() {
    // Automatically reload project assignments when selected project changes
    effect(() => {
      const projId = this.projectState.selectedProjectId();
      if (projId) {
        const found = this.projectState.projects().find(p => p.id === projId);
        this.activeProjectName.set(found ? found.name : 'Unknown Project');
        this.loadProjectTeam(projId);
      }
    });

    // Automatically load company employees when company ID is resolved
    effect(() => {
      const compId = this.projectState.userCompanyId();
      if (compId) {
        untracked(() => {
          this.loadCompanyEmployees(compId);
        });
      }
    });
  }

  async ngOnInit() {}

  async loadCompanyEmployees(companyId: string) {
    try {
      const res = await this.teamService.getCompanyEmployees(companyId);
      const list = res.data || res || [];
      this.companyEmployees.set(list);
    } catch (e) {
      console.warn('Failed to load company employees:', e);
    }
  }

  async loadProjectTeam(projectId: string) {
    this.isLoadingTeam.set(true);
    try {
      const res = await this.teamService.getProjectEmployees(projectId);
      const list = res.data || res || [];
      // Backend returns details or mapping
      const mapped = list.map((e: any) => ({
        employeeId: e.employeeId || e.id,
        fullName: e.fullName || `${e.firstName} ${e.lastName}` || e.email,
        email: e.email,
        role: e.role || 'Contributor'
      }));
      this.projectTeam.set(mapped);
      this.projectState.setProjectEmployeeCount(mapped.length);
    } catch (e) {
      console.warn('Failed to load project team:', e);
    } finally {
      this.isLoadingTeam.set(false);
    }
  }

  onEmailInputKeydown(event: KeyboardEvent) {
    const input = this.currentEmailInput().trim();
    if ((event.key === 'Enter' || event.key === ' ' || event.key === ',') && input) {
      event.preventDefault();
      this.addEmail(input);
    } else if (event.key === 'Backspace' && !input && this.emailsList().length > 0) {
      this.removeEmail(this.emailsList().length - 1);
    }
  }

  addEmail(email: string) {
    const cleanEmail = email.trim().replace(/,$/, '');
    if (!cleanEmail) return;
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (emailRegex.test(cleanEmail)) {
      const lowerEmail = cleanEmail.toLowerCase();
      if (!this.emailsList().includes(cleanEmail)) {
        this.emailsList.update(list => [...list, cleanEmail]);
      }
      if (this.invalidEmailsMap()[lowerEmail]) {
        const newMap = { ...this.invalidEmailsMap() };
        delete newMap[lowerEmail];
        this.invalidEmailsMap.set(newMap);
      }
      this.currentEmailInput.set('');
    }
  }

  removeEmail(index: number) {
    const email = this.emailsList()[index];
    if (email) {
      const newMap = { ...this.invalidEmailsMap() };
      delete newMap[email.toLowerCase()];
      this.invalidEmailsMap.set(newMap);
    }
    this.emailsList.update(list => list.filter((_, i) => i !== index));
  }

  async onSendInvitations(event: Event) {
    event.preventDefault();
    
    // Add any remaining text in the input field as an email if valid
    const remaining = this.currentEmailInput().trim();
    if (remaining) {
      this.addEmail(remaining);
    }

    const emails = this.emailsList();
    if (emails.length === 0) return;

    this.isInviting.set(true);
    const cleanEmails = emails.map(email => email.toLowerCase().trim());
    const newMap = { ...this.invalidEmailsMap() };
    cleanEmails.forEach(email => delete newMap[email]);
    this.invalidEmailsMap.set(newMap);

    try {
      const res = await this.teamService.inviteEmployees(emails);
      if (res && (res.succeeded === false || (res.data?.skippedEmployees && res.data.skippedEmployees.length > 0))) {
        this.handleInviteError(res, emails);
        return;
      }
      this.toastService.show('🎉 Invitations sent successfully to invited members!', 'success');
      this.emailsList.set([]);
      this.currentEmailInput.set('');
      
      const compId = this.projectState.userCompanyId();
      if (compId) {
        await this.loadCompanyEmployees(compId);
      }
    } catch (e: any) {
      console.error(e);
      const errResponse = e?.response?.data || e;
      this.handleInviteError(errResponse, emails);
    } finally {
      this.isInviting.set(false);
    }
  }

  handleInviteError(errResponse: any, emails: string[]) {
    const data = errResponse?.data;
    const skipped = data?.skippedEmployees || errResponse?.skippedEmployees || [];
    const errors = errResponse?.errors || [];
    const code = errResponse?.code;
    
    const hasSkippedBelongs = skipped.some((s: any) => s.reason === 'USER_ALREADY_BELONGS_TO_COMPANY');
    const isAlreadyBelongsError = hasSkippedBelongs || (code === 'USER_ALREADY_BELONGS_TO_COMPANY') ||
      errors.some((err: any) => err.code === 'USER_ALREADY_BELONGS_TO_COMPANY');

    if (isAlreadyBelongsError) {
      const failedEmails: string[] = [];
      
      skipped.forEach((s: any) => {
        if (s.reason === 'USER_ALREADY_BELONGS_TO_COMPANY' && s.email) {
          failedEmails.push(s.email.toLowerCase().trim());
        }
      });

      errors.forEach((err: any) => {
        if (err.code === 'USER_ALREADY_BELONGS_TO_COMPANY') {
          if (err.email) {
            failedEmails.push(err.email.toLowerCase().trim());
          } else if (err.description) {
            const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
            const matches = err.description.match(emailRegex);
            if (matches) {
              matches.forEach((m: string) => failedEmails.push(m.toLowerCase().trim()));
            }
          }
        }
      });
      
      if (failedEmails.length === 0 && emails.length === 1) {
        failedEmails.push(emails[0].toLowerCase().trim());
      }

      const mapUpdate = { ...this.invalidEmailsMap() };
      failedEmails.forEach(email => {
        mapUpdate[email] = 'This user is already registered under another company.';
      });
      this.invalidEmailsMap.set(mapUpdate);
      this.toastService.show('One or more selected users are already registered under another company.', 'error');
    } else {
      const errorMsg = errResponse?.message || 'Failed to send invitations. Ensure emails are formatted correctly.';
      this.toastService.show(errorMsg, 'error');
    }
  }

  async onAssignEmployee(event: Event) {
    event.preventDefault();
    const projId = this.projectState.selectedProjectId();
    if (!projId || !this.selectedEmployeeId) return;

    // Check if employee is already assigned
    const isAlreadyAssigned = this.projectTeam().some(
      member => member.employeeId === this.selectedEmployeeId
    );
    if (isAlreadyAssigned) {
      this.toastService.show('This member is already assigned to this project.', 'error');
      return;
    }

    this.assignError.set(null);
    this.failedEmployeeIds.set([]);
    this.isAssigning.set(true);
    try {
      const assignment: EmployeeAssignmentDto = {
        employeeId: this.selectedEmployeeId,
        role: this.assignedRole
      };
      const res = await this.teamService.assignEmployees(projId, [assignment]);
      if (res && res.succeeded === false) {
        this.handleAssignError(res);
        return;
      }
      this.toastService.show('🎉 Member assigned successfully to the project!', 'success');
      this.selectedEmployeeId = '';
      await this.loadProjectTeam(projId);
    } catch (e: any) {
      console.error(e);
      const errResponse = e?.response?.data || e;
      this.handleAssignError(errResponse);
    } finally {
      this.isAssigning.set(false);
    }
  }

  handleAssignError(errResponse: any) {
    const errors = errResponse?.errors || [];
    const code = errResponse?.code;
    const isAlreadyAssignedError = (code === 'EmployeeAlreadyAssignedToAnotherProject') ||
      errors.some((err: any) => err.code === 'EmployeeAlreadyAssignedToAnotherProject');

    if (isAlreadyAssignedError) {
      this.assignError.set('One or more selected employees are already assigned to another active project.');
      this.toastService.show('One or more selected employees are already assigned to another active project.', 'error');
      
      const failedIds: string[] = [];
      errors.forEach((err: any) => {
        if (err.code === 'EmployeeAlreadyAssignedToAnotherProject') {
          if (err.employeeId) {
            failedIds.push(err.employeeId);
          } else if (err.description) {
            const found = this.companyEmployees().find(emp => 
              (emp.employeeId && err.description.includes(emp.employeeId)) ||
              (emp.email && err.description.includes(emp.email)) ||
              (emp.fullName && err.description.includes(emp.fullName))
            );
            if (found) {
              failedIds.push(found.employeeId);
            }
          }
        }
      });
      if (failedIds.length === 0 && this.selectedEmployeeId) {
        failedIds.push(this.selectedEmployeeId);
      }
      this.failedEmployeeIds.set(failedIds);
    } else {
      const errorMsg = errResponse?.message || 'Failed to assign team member. Make sure they are not already assigned.';
      this.assignError.set(errorMsg);
      this.toastService.show(errorMsg, 'error');
    }
  }
}
