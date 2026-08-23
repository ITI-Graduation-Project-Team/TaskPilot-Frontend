import { Component, ChangeDetectionStrategy, signal, computed, inject, OnInit, effect, untracked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { TeamCollaborationService, EmployeeAssignmentDto, CompanyEmployee, ProjectEmployee } from '../../../../shared/api/team-collaboration.service';
import { ProjectStateService } from '../../../../shared/services/project-state.service';
import { ToastService } from '../../../../shared/services/toast.service';
import { ConfirmDialogService } from '../../../../shared/services/confirm-dialog.service';
import { ActivatedRoute, Router } from '@angular/router';
import { SprintPlanningService } from '../../../../shared/api/sprint-planning.service';
import { PlannedSprintAssignmentDialogComponent } from '../../../../features/planned-sprint-assignment-dialog/planned-sprint-assignment-dialog';

export type EmployeePickerEmptyState = 'loading' | 'error' | 'noEmployees' | 'noActiveEmployees' | 'allAssigned' | 'noneAvailable' | null;

export function resolveEmployeePickerEmptyState(
  companyEmployees: CompanyEmployee[],
  projectTeam: ProjectEmployee[],
  loading: boolean,
  loadError: boolean
): EmployeePickerEmptyState {
  if (loading) return 'loading';
  if (loadError) return 'error';
  if (companyEmployees.length === 0) return 'noEmployees';

  const activeEmployees = companyEmployees.filter(employee => !employee.isDeactivated);
  if (activeEmployees.length === 0) return 'noActiveEmployees';

  const assignedIds = new Set(projectTeam.map(employee => employee.employeeId));
  const unassignedEmployees = activeEmployees.filter(employee =>
    !assignedIds.has(employee.employeeId || employee.id || ''));
  if (unassignedEmployees.length === 0) return 'allAssigned';

  const assignableEmployees = unassignedEmployees.filter(employee =>
    !employee.availabilityStatus || employee.availabilityStatus === 'Available');
  return assignableEmployees.length === 0 ? 'noneAvailable' : null;
}

@Component({
  selector: 'app-team-view',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, TranslatePipe, PlannedSprintAssignmentDialogComponent],
  template: `
    <div class="space-y-6">
      
      <!-- Top header -->
      <div>
        <h2 class="text-2xl font-bold text-text-primary">{{ 'TEAM.MANAGEMENT' | translate }}</h2>
        <p class="text-text-secondary text-sm">{{ 'TEAM.MANAGEMENT_DESC' | translate }}</p>
      </div>

      @if (isSetupFlow()) {
        <section class="overflow-hidden rounded-2xl border border-primary/25 bg-primary/5" aria-labelledby="setup-team-title">
          <div class="flex flex-col gap-4 p-5 md:flex-row md:items-center md:justify-between">
            <div class="flex items-start gap-3">
              <span class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-white">
                <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2m7-10a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm13 10v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>
              </span>
              <div>
                <h3 id="setup-team-title" class="font-extrabold text-text-primary">{{ 'TEAM.SETUP_STACK_TITLE' | translate }}</h3>
                <p class="mt-1 max-w-2xl text-sm leading-6 text-text-secondary">{{ 'TEAM.SETUP_STACK_DESC' | translate }}</p>
                @if (projectTeam().length > 0 && membersWithSkillsCount() === 0) {
                  <p class="mt-2 text-xs font-bold text-warning">{{ 'TEAM.SETUP_NO_SKILLS' | translate }}</p>
                }
              </div>
            </div>
            <button type="button" (click)="continueToSetup()" [disabled]="projectTeam().length === 0"
                    class="min-h-11 shrink-0 rounded-xl bg-primary px-5 text-sm font-extrabold text-white shadow-sm hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40">
              {{ 'TEAM.CONTINUE_TO_STACK' | translate }}
            </button>
          </div>
        </section>
      }

      <!-- Main Layout -->
      <div class="gap-6">
        
        <!-- Center: Assign Employees to Project -->
        <div class="bg-surface border border-border p-5 rounded-2xl shadow-sm space-y-4">
          <div class="flex items-center justify-between pb-2 border-b border-border flex-wrap gap-2">
            <h3 class="font-bold text-text-primary text-base">{{ 'TEAM.ACTIVE_ASSIGNMENT' | translate }}</h3>
            @if (projectState.selectedProjectId()) {
              <span class="text-xs bg-primary/10 text-primary font-bold px-2.5 py-0.5 rounded-full border border-primary/25 truncate max-w-[200px]">
                {{ activeProjectName() }}
              </span>
            } @else {
              <span class="text-xs text-red-500 font-bold">{{ 'TEAM.SELECT_PROJECT_FIRST' | translate }}</span>
            }
          </div>

          @if (!projectState.selectedProjectId()) {
            <div class="flex flex-col items-center justify-center py-12 text-center text-text-secondary text-sm">
              <svg class="w-10 h-10 mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
              {{ 'TEAM.SELECT_PROJECT_DESC' | translate }}
            </div>
          } @else {
            <!-- Error Banner -->
            @if (assignError()) {
              <div class="mb-4 p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-start gap-2.5 text-red-600 dark:text-red-400 text-xs animate-[fadeIn_0.2s_ease_both]">
                <svg class="w-4 h-4 mt-0.5 shrink-0 text-red-500 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
                </svg>
                <div class="flex-1">
                  <p class="font-extrabold text-sm text-red-700 dark:text-red-300">{{ 'TEAM.ASSIGNMENT_FAILED' | translate }}</p>
                  <p class="mt-0.5 leading-relaxed">{{ assignError() }}</p>
                </div>
                <button (click)="assignError.set(null)" class="text-red-500/70 hover:text-red-600 dark:hover:text-red-400 font-bold text-sm shrink-0">✕</button>
              </div>
            }

            <!-- Form to assign -->
            @if (projectState.selectedProject()?.status !== 'Completed' && projectState.selectedProject()?.status !== 'Archived') {
              <form (submit)="onAssignEmployee($event)" class="grid grid-cols-1 md:grid-cols-3 gap-4 bg-sidebar p-4 rounded-xl border border-border">
              <div class="relative">
                <label class="block text-xs font-bold text-text-secondary mb-1.5">{{ 'TEAM.SELECT_MEMBER' | translate }}</label>
                <!-- Custom Dropdown Trigger -->
                <button type="button" (click)="isDropdownOpen.set(!isDropdownOpen())"
                     class="min-h-11 w-full bg-background border border-border rounded-xl px-3 py-2 text-sm cursor-pointer flex items-center gap-2 hover:border-primary/50 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                     [attr.aria-expanded]="isDropdownOpen()" aria-haspopup="listbox">
                  @if (selectedEmployeeId) {
                    @for (emp of companyEmployees(); track emp.employeeId) {
                      @if (emp.employeeId === selectedEmployeeId) {
                        <div class="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 overflow-hidden"
                             [style.background]="emp.avatarUrl ? 'transparent' : getAvatarColor(emp.email)">
                          @if (emp.avatarUrl) {
                            <img [src]="emp.avatarUrl" alt="Avatar" class="w-full h-full object-cover" />
                          } @else {
                            {{ getInitials(emp.fullName, emp.email) }}
                          }
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
                    <span class="text-text-secondary">{{ 'TEAM.CHOOSE_MEMBER' | translate }}</span>
                  }
                  <svg class="w-4 h-4 ml-auto text-text-secondary shrink-0 transition-transform"
                       [class.rotate-180]="isDropdownOpen()"
                       fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
                  </svg>
                </button>
                <!-- Dropdown List -->
                @if (isDropdownOpen()) {
                  <div class="absolute z-50 top-full left-0 right-0 mt-1 bg-surface border border-border rounded-xl shadow-xl overflow-hidden max-h-52 overflow-y-auto animate-[fadeDown_0.15s_ease_both]">
                    @for (emp of unassignedCompanyEmployees(); track emp.employeeId) {
                      <div (click)="selectEmployee(emp.employeeId)"
                           class="flex items-center gap-3 px-3 py-2.5 cursor-pointer hover:bg-sidebar transition-colors"
                           [class.bg-primary/10]="emp.employeeId === selectedEmployeeId">
                        <div class="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 overflow-hidden"
                             [style.background]="emp.avatarUrl ? 'transparent' : getAvatarColor(emp.email)">
                          @if (emp.avatarUrl) {
                            <img [src]="emp.avatarUrl" alt="Avatar" class="w-full h-full object-cover" />
                          } @else {
                            {{ getInitials(emp.fullName, emp.email) }}
                          }
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
                            {{ 'TEAM.ALREADY_ASSIGNED' | translate }}
                          </span>
                        } @else if (emp.employeeId === selectedEmployeeId) {
                          <svg class="w-4 h-4 text-primary ml-auto shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
                          </svg>
                        }
                      </div>
                    } @empty {
                      <div class="p-4 text-center text-xs leading-5 text-text-secondary" [attr.role]="employeePickerEmptyState() === 'error' ? 'alert' : 'status'">
                        @switch (employeePickerEmptyState()) {
                          @case ('loading') {
                            <span class="inline-flex items-center gap-2"><span class="h-4 w-4 animate-spin rounded-full border-2 border-primary/20 border-t-primary" aria-hidden="true"></span>{{ 'TEAM.LOADING_COMPANY_EMPLOYEES' | translate }}</span>
                          }
                          @case ('error') {
                            <p>{{ 'TEAM.LOAD_EMPLOYEES_FAILED' | translate }}</p>
                            <button type="button" (click)="retryCompanyEmployeesLoad()" class="mt-2 min-h-11 rounded-lg border border-error/30 px-4 font-bold text-error focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-error/40">{{ 'TEAM.RETRY' | translate }}</button>
                          }
                          @case ('noEmployees') { {{ 'TEAM.NO_COMPANY_EMPLOYEES' | translate }} }
                          @case ('noActiveEmployees') { {{ 'TEAM.NO_ACTIVE_COMPANY_EMPLOYEES' | translate }} }
                          @case ('allAssigned') { {{ 'TEAM.ALL_ASSIGNED' | translate }} }
                          @case ('noneAvailable') { {{ 'TEAM.NO_AVAILABLE_EMPLOYEES' | translate }} }
                        }
                      </div>
                    }
                  </div>
                }
              </div>

              <div>
                <label class="block text-xs font-bold text-text-secondary mb-1.5">{{ 'TEAM.ROLE' | translate }}</label>
                <select [(ngModel)]="assignedRole" name="assignRole" required
                        class="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm outline-none cursor-pointer">
                  <option value="Developer">{{ 'TEAM.ROLES.DEVELOPER' | translate }}</option>
                  <option value="QA">{{ 'TEAM.ROLES.QA' | translate }}</option>
                  <option value="Scrum Master">{{ 'TEAM.ROLES.SCRUM_MASTER' | translate }}</option>
                  <option value="Product Owner">{{ 'TEAM.ROLES.PRODUCT_OWNER' | translate }}</option>
                  <option value="Designer">{{ 'TEAM.ROLES.DESIGNER' | translate }}</option>
                </select>
              </div>

              <div>
                <label class="block text-xs font-bold text-text-secondary mb-1.5">{{ 'TEAM.ALLOCATION_PERCENTAGE' | translate }}</label>
                <input type="number" [(ngModel)]="assignedAllocationPercentage" name="allocationPercentage" min="1" max="100" required
                       class="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm outline-none">
              </div>

              <div class="flex items-end">
                <button type="submit" 
                        [disabled]="isAssigning() || !selectedEmployeeId"
                        class="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-all shadow-md disabled:opacity-50">
                  {{ 'TEAM.ASSIGN_TO_PROJECT' | translate }}
                </button>
              </div>
              </form>
            }

            <!-- Project Team list -->
            <div class="space-y-3 mt-4">
              <h4 class="text-xs font-bold text-text-secondary uppercase tracking-wider">{{ 'TEAM.ASSIGNED_TEAM' | translate }} ({{ projectTeam().length }})</h4>
              
              @if (isLoadingTeam()) {
                <div class="flex items-center gap-2 text-sm text-text-secondary py-4">
                  <div class="w-4 h-4 rounded-full border-2 border-primary border-t-transparent animate-spin"></div>
                  {{ 'TEAM.LOADING_TEAM' | translate }}
                </div>
              } @else if (projectTeam().length === 0) {
                <div class="text-xs text-text-secondary bg-sidebar border border-border p-4 rounded-xl">
                  {{ 'TEAM.NO_EMPLOYEES' | translate }}
                </div>
              } @else {
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  @for (member of projectTeam(); track member.employeeId) {
                    <div class="bg-sidebar border border-border p-4 rounded-xl flex items-center justify-between gap-3 transition-all relative group"
                         [ngClass]="member.isDeactivated ? 'opacity-60 grayscale bg-surface' : 'hover:border-primary/20'">
                      
                      @if (member.isDeactivated) {
                        <div class="absolute inset-0 bg-transparent z-0" 
                             [title]="'Deactivated At: ' + (member.deactivatedAt | date:'mediumDate') + '\nReason: ' + (member.deactivationReason || 'No reason provided')">
                        </div>
                      }

                      <div class="relative z-10 flex items-center gap-3">
                        <div class="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0 overflow-hidden"
                             [style.background]="member.avatarUrl ? 'transparent' : getAvatarColor(member.email)">
                          @if (member.avatarUrl) {
                            <img [src]="member.avatarUrl" alt="Avatar" class="w-full h-full object-cover" />
                          } @else {
                            {{ getInitials(member.fullName, member.email) }}
                          }
                        </div>
                        <div>
                          <h5 class="text-sm font-bold text-text-primary flex items-center gap-2">
                            {{ member.fullName }}
                          </h5>
                          <p class="text-xs text-text-secondary">{{ member.email }}</p>
                        </div>
                      </div>
                      
                      <div class="flex items-center gap-2 relative z-10">
                        <span class="px-2.5 py-1 text-[10px] font-bold border rounded-full"
                              [ngClass]="member.isDeactivated ? 'bg-slate-100 text-slate-500 border-slate-200' : 'bg-primary/10 text-primary border-primary/20'">
                          {{ getRoleTranslationKey(member.role) | translate }}
                        </span>

                        <span class="px-2.5 py-1 text-[10px] font-bold border rounded-full bg-surface text-text-secondary border-border"
                              *ngIf="member.allocationPercentage">
                          {{ member.allocationPercentage }}{{ 'TEAM.ALLOC_SHORT' | translate }}
                        </span>
                        
                        <!-- Actions -->
                        @if (member.isDeactivated) {
                          <span class="px-2.5 py-1 text-[10px] font-bold text-slate-500 border border-slate-200 bg-slate-100 rounded-lg shadow-sm">
                            {{ 'TEAM.DEACTIVATED' | translate }}
                          </span>
                        }
                        
                        <!-- Only allow remove if the employee is not deactivated or as a general action -->
                        <button type="button" 
                                (click)="removeEmployee(member.employeeId)"
                                [disabled]="isRemoving() === member.employeeId || projectState.selectedProject()?.status === 'Completed' || projectState.selectedProject()?.status === 'Archived'"
                                class="ml-2 w-7 h-7 rounded-full flex items-center justify-center text-red-500 hover:bg-red-500/10 transition-colors disabled:opacity-50"
                                [title]="'TEAM.REMOVE_MEMBER' | translate">
                          @if (isRemoving() === member.employeeId) {
                            <div class="w-3 h-3 rounded-full border-2 border-red-500 border-t-transparent animate-spin"></div>
                          } @else {
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                          }
                        </button>
                      </div>
                    </div>
                  }
                </div>
              }
            </div>
          }
        </div>

      </div>
    </div>
    
    <app-planned-sprint-assignment-dialog
      [isOpen]="showSprintAssignmentDialog()"
      [projectId]="projectState.selectedProjectId()"
      [sprintNames]="detectedSprintNames()"
      [sprintIds]="detectedSprintIds()"
      mode="assign"
      (close)="showSprintAssignmentDialog.set(false)"
      (actionCompleted)="showSprintAssignmentDialog.set(false)">
    </app-planned-sprint-assignment-dialog>

    <app-planned-sprint-assignment-dialog
      [isOpen]="showSprintRemovalDialog()"
      [projectId]="projectState.selectedProjectId()"
      [sprintNames]="detectedSprintNames()"
      [sprintIds]="detectedSprintIds()"
      mode="remove"
      [employeeName]="removedEmployeeName()"
      (close)="showSprintRemovalDialog.set(false)"
      (actionCompleted)="showSprintRemovalDialog.set(false)">
    </app-planned-sprint-assignment-dialog>
  `
})
export class TeamViewComponent implements OnInit {
  private teamService = inject(TeamCollaborationService);
  projectState = inject(ProjectStateService);
  private toastService = inject(ToastService);
  private confirmDialogService = inject(ConfirmDialogService);
  private translate = inject(TranslateService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  // Feature 3: Smart Suggestion for Planned Sprints
  showSprintAssignmentDialog = signal<boolean>(false);
  showSprintRemovalDialog = signal<boolean>(false);
  removedEmployeeName = signal<string>('');
  detectedSprintNames = signal<string[]>([]);
  detectedSprintIds = signal<string[]>([]);

  emailsList = signal<string[]>([]);
  currentEmailInput = signal('');
  isInviting = signal(false);

  companyEmployees = signal<CompanyEmployee[]>([]);
  projectTeam = signal<ProjectEmployee[]>([]);
  isLoadingCompanyEmployees = signal(false);
  companyEmployeesLoadError = signal(false);
  setupReturnUrl = signal<string | null>(null);
  isSetupFlow = computed(() => !!this.setupReturnUrl());
  membersWithSkillsCount = computed(() => this.projectTeam().filter(member => (member.skills?.length ?? 0) > 0 && !member.isDeactivated).length);

  readonly unassignedCompanyEmployees = computed(() => {
    const assignedIds = new Set(this.projectTeam().map(p => p.employeeId));
    return this.companyEmployees().filter(emp => {
      const empId = emp.employeeId || emp.id || '';
      const isAvailable = !emp.availabilityStatus || emp.availabilityStatus === 'Available';
      return !emp.isDeactivated && !assignedIds.has(empId) && isAvailable;
    });
  });
  readonly employeePickerEmptyState = computed(() => resolveEmployeePickerEmptyState(
    this.companyEmployees(), this.projectTeam(), this.isLoadingCompanyEmployees(), this.companyEmployeesLoadError()));

  selectedEmployeeId = '';
  assignedRole = 'Developer';
  assignedAllocationPercentage = 100;
  isAssigning = signal(false);
  isRemoving = signal<string | null>(null);
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

  async ngOnInit() {
    const setupProjectId = this.route.snapshot.queryParamMap.get('setupProjectId');
    const requestedReturnUrl = this.route.snapshot.queryParamMap.get('returnUrl');
    if (setupProjectId) this.projectState.setSelectedProject(setupProjectId);
    if (requestedReturnUrl?.startsWith('/dashboard/projects/') && requestedReturnUrl.endsWith('/setup')) {
      this.setupReturnUrl.set(requestedReturnUrl);
    }
  }

  continueToSetup(): void {
    const returnUrl = this.setupReturnUrl();
    if (returnUrl && this.projectTeam().length > 0) void this.router.navigateByUrl(returnUrl);
  }

  async loadCompanyEmployees(companyId: string) {
    this.isLoadingCompanyEmployees.set(true);
    this.companyEmployeesLoadError.set(false);
    try {
      const res: any = await this.teamService.getCompanyEmployees(companyId);
      const rawList = res?.data?.items || res?.data || res?.items || res || [];
      const list: CompanyEmployee[] = (Array.isArray(rawList) ? rawList : []).map((e: any) => ({
        ...e,
        employeeId: e.employeeId || e.id || '',
        fullName: e.fullName || (e.firstName ? `${e.firstName} ${e.lastName || ''}`.trim() : e.email)
      }));
      this.companyEmployees.set(list);
    } catch (e) {
      this.companyEmployees.set([]);
      this.companyEmployeesLoadError.set(true);
      console.warn('Failed to load company employees:', e);
    } finally {
      this.isLoadingCompanyEmployees.set(false);
    }
  }

  retryCompanyEmployeesLoad(): void {
    const companyId = this.projectState.userCompanyId();
    if (companyId) void this.loadCompanyEmployees(companyId);
  }

  async loadProjectTeam(projectId: string) {
    this.isLoadingTeam.set(true);
    try {
      const res = await this.teamService.getProjectEmployees(projectId);
      const list = res.data || (res as any) || [];
      const mapped: ProjectEmployee[] = list.map((e: ProjectEmployee) => ({
        employeeId: e.employeeId,
        fullName: e.fullName || e.email,
        email: e.email,
        role: e.role || 'Contributor',
        allocationPercentage: e.allocationPercentage,
        isDeactivated: e.isDeactivated,
        deactivationReason: e.deactivationReason,
        deactivatedAt: e.deactivatedAt,
        skills: e.skills || []
      }));
      this.projectTeam.set(mapped);
      this.projectState.setProjectEmployeeCount(mapped.length);
    } catch (e) {
      console.warn('Failed to load project team:', e);
    } finally {
      this.isLoadingTeam.set(false);
    }
  }

  async removeEmployee(employeeId: string) {
    const projId = this.projectState.selectedProjectId();
    if (!projId) return;

    const emp = this.projectTeam().find(e => e.employeeId === employeeId);
    if (!emp) return;

    const confirmed = await this.confirmDialogService.confirm({
      title: this.translate.instant('TEAM.REMOVE_MEMBER'),
      message: this.translate.instant('TEAM.REMOVE_MEMBER_CONFIRM'),
      confirmLabel: this.translate.instant('TEAM.REMOVE'),
      type: 'danger'
    });
    if (!confirmed) return;

    this.isRemoving.set(employeeId);
    try {
      const res = await this.teamService.removeProjectEmployee(projId, employeeId);
      await this.loadProjectTeam(projId);

      if (res && res.data && res.data.hasPlannedSprints) {
        this.detectedSprintNames.set(res.data.plannedSprintNames || []);
        this.detectedSprintIds.set(res.data.plannedSprintIds || []);
        this.removedEmployeeName.set(emp.fullName || emp.email);
        this.showSprintRemovalDialog.set(true);
      } else {
        this.toastService.show(this.translate.instant('TEAM.REMOVED_SUCCESS'), 'success');
      }
    } catch (e: any) {
      const errorMsg = e?.response?.data?.errors?.[0]?.message || e?.response?.data?.message || this.translate.instant('TEAM.REMOVE_FAILED');
      this.toastService.show(errorMsg, 'error');
    } finally {
      this.isRemoving.set(null);
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
        role: this.assignedRole,
        allocationPercentage: this.assignedAllocationPercentage
      };
      const res = await this.teamService.assignEmployees(projId, [assignment]);
      if (res && res.succeeded === false) {
        this.handleAssignError(res);
        return;
      }
      this.toastService.show('🎉 Member assigned successfully to the project!', 'success');
      this.selectedEmployeeId = '';
      await this.loadProjectTeam(projId);
      
      // Feature 3: Smart Suggestion for Planned Sprints
      if (res.data && res.data.hasPlannedSprints) {
        this.detectedSprintNames.set(res.data.plannedSprintNames || []);
        this.detectedSprintIds.set(res.data.plannedSprintIds || []);
        this.showSprintAssignmentDialog.set(true);
      }
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

  getRoleTranslationKey(role: string): string {
    if (!role) return 'TEAM.ROLES.DEVELOPER';
    const normalized = role.toUpperCase().replace(/\s+/g, '_');
    if (['DEVELOPER', 'QA', 'SCRUM_MASTER', 'PRODUCT_OWNER', 'DESIGNER'].includes(normalized)) {
      return `TEAM.ROLES.${normalized}`;
    }
    return `TEAM.ROLES.DEVELOPER`; // fallback
  }
}
