import { Component, ChangeDetectionStrategy, signal, inject, OnInit, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TeamCollaborationService, EmployeeAssignmentDto } from '../../../../shared/api/team-collaboration.service';
import { ProjectStateService } from '../../../../shared/services/project-state.service';

interface CompanyEmployee {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  jobTitle: string;
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
              <label class="block text-xs font-bold text-text-secondary mb-1.5 uppercase">Emails (Comma separated)</label>
              <textarea [(ngModel)]="invitationEmails" name="emails" required rows="4" 
                        placeholder="e.g. employee1&#64;company.com, employee2&#64;company.com"
                        class="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/20 resize-none transition-all"></textarea>
            </div>
            
            <button type="submit" 
                    [disabled]="isInviting() || !invitationEmails.trim()"
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
            <!-- Form to assign -->
            <form (submit)="onAssignEmployee($event)" class="grid grid-cols-1 md:grid-cols-3 gap-4 bg-sidebar p-4 rounded-xl border border-border">
              <div>
                <label class="block text-xs font-bold text-text-secondary mb-1.5">Select Member</label>
                <select [(ngModel)]="selectedEmployeeId" name="assignEmp" required
                        class="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm outline-none cursor-pointer">
                  <option value="">-- Choose Member --</option>
                  @for (emp of companyEmployees(); track emp.id) {
                    <option [value]="emp.id">{{ emp.firstName }} {{ emp.lastName }} ({{ emp.email }})</option>
                  }
                </select>
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

  invitationEmails = '';
  isInviting = signal(false);

  companyEmployees = signal<CompanyEmployee[]>([]);
  projectTeam = signal<ProjectEmployee[]>([]);
  
  selectedEmployeeId = '';
  assignedRole = 'Developer';
  isAssigning = signal(false);
  isLoadingTeam = signal(false);

  activeProjectName = signal('Loading Project...');

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
  }

  async ngOnInit() {
    const compId = this.projectState.userCompanyId();
    if (compId) {
      this.loadCompanyEmployees(compId);
    }
  }

  async loadCompanyEmployees(companyId: string) {
    try {
      const res = await this.teamService.getCompanyEmployees(companyId);
      this.companyEmployees.set(res.data || res || []);
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
    } catch (e) {
      console.warn('Failed to load project team:', e);
    } finally {
      this.isLoadingTeam.set(false);
    }
  }

  async onSendInvitations(event: Event) {
    event.preventDefault();
    if (!this.invitationEmails.trim()) return;

    const emails = this.invitationEmails
      .split(',')
      .map(e => e.trim())
      .filter(e => e.length > 0);

    this.isInviting.set(true);
    try {
      await this.teamService.inviteEmployees(emails);
      alert('Invitations sent successfully to invited members!');
      this.invitationEmails = '';
      
      const compId = this.projectState.userCompanyId();
      if (compId) {
        await this.loadCompanyEmployees(compId);
      }
    } catch (e) {
      console.error(e);
      alert('Failed to send invitations. Ensure emails are formatted correctly.');
    } finally {
      this.isInviting.set(false);
    }
  }

  async onAssignEmployee(event: Event) {
    event.preventDefault();
    const projId = this.projectState.selectedProjectId();
    if (!projId || !this.selectedEmployeeId) return;

    this.isAssigning.set(true);
    try {
      const assignment: EmployeeAssignmentDto = {
        employeeId: this.selectedEmployeeId,
        role: this.assignedRole
      };
      await this.teamService.assignEmployees(projId, [assignment]);
      this.selectedEmployeeId = '';
      await this.loadProjectTeam(projId);
    } catch (e) {
      console.error(e);
      alert('Failed to assign team member. Make sure they are not already assigned.');
    } finally {
      this.isAssigning.set(false);
    }
  }
}
