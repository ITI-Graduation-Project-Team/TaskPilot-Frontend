import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { getRoleFromToken, clearTokens } from '../../../../shared/lib/auth/cookie.helper';
import { BoardComponent } from '../../../../widgets/taskBoard';
import { CompanyService } from '../../../../shared/api/Company-api/company';

type Tab = 'board' | 'team' | 'analytics' | 'my-tasks';

interface Task {
  id: string;
  title: string;
  desc: string;
  priority: 'High' | 'Medium' | 'Low';
  status: 'Todo' | 'In Progress' | 'Done';
  assignee: string;
  avatar: string;
}

interface TeamMember {
  name: string;
  email: string;
  role: string;
  status: 'Active' | 'Pending';
  avatar: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, BoardComponent],
  template: `
    <div class="min-h-screen bg-slate-50 font-sans flex flex-col">
      <!-- Navbar -->
      <nav class="bg-white border-b border-slate-100 px-8 py-4 flex items-center justify-between sticky top-0 z-50 shadow-sm">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-extrabold text-xl shadow-md shadow-blue-100">
            T
          </div>
          <span class="text-2xl font-bold text-slate-800 tracking-tight">TaskPilot</span>
        </div>

        <div class="flex items-center gap-6">
          <div class="flex items-center gap-3 bg-slate-50 py-1.5 px-3 rounded-full border border-slate-100">
            <div class="w-2.5 h-2.5 rounded-full" [ngClass]="userRole() === 'ProjectManager' ? 'bg-indigo-500' : 'bg-emerald-500'"></div>
            <span class="text-sm font-semibold text-slate-600 uppercase tracking-wider text-xs">
              {{ userRole() === 'ProjectManager' ? 'Project Manager' : 'Team Member' }}
            </span>
          </div>

          <button (click)="logout()" class="flex items-center gap-2 text-sm font-semibold text-red-500 hover:text-red-600 transition-colors py-2 px-3 rounded-lg hover:bg-red-50">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
            </svg>
            Logout
          </button>
        </div>
      </nav>

      <div class="flex-1 flex max-w-7xl w-full mx-auto p-8 gap-8">
        <!-- Sidebar Navigation -->
        <aside class="w-64 flex flex-col gap-2">
          <div class="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex flex-col gap-1.5">
            <button 
              *ngIf="userRole() === 'ProjectManager'"
              (click)="activeTab.set('board')"
              [ngClass]="activeTab() === 'board' ? 'bg-blue-50 text-blue-600 font-semibold' : 'text-slate-600 hover:bg-slate-50'"
              class="w-full text-left py-3 px-4 rounded-xl transition-all flex items-center gap-3">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>
              Project Board
            </button>

            <button 
              *ngIf="userRole() === 'Employee'"
              (click)="activeTab.set('my-tasks')"
              [ngClass]="activeTab() === 'my-tasks' ? 'bg-blue-50 text-blue-600 font-semibold' : 'text-slate-600 hover:bg-slate-50'"
              class="w-full text-left py-3 px-4 rounded-xl transition-all flex items-center gap-3">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
              My Tasks
            </button>

            <button 
              *ngIf="userRole() === 'ProjectManager'"
              (click)="activeTab.set('team')"
              [ngClass]="activeTab() === 'team' ? 'bg-blue-50 text-blue-600 font-semibold' : 'text-slate-600 hover:bg-slate-50'"
              class="w-full text-left py-3 px-4 rounded-xl transition-all flex items-center gap-3">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/></svg>
              Team Members
            </button>

            <button 
              (click)="activeTab.set('analytics')"
              [ngClass]="activeTab() === 'analytics' ? 'bg-blue-50 text-blue-600 font-semibold' : 'text-slate-600 hover:bg-slate-50'"
              class="w-full text-left py-3 px-4 rounded-xl transition-all flex items-center gap-3">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 002 2h2a2 2 0 002-2"/></svg>
              Sprint Analytics
            </button>
          </div>

          <div *ngIf="userRole() === 'ProjectManager'" class="bg-gradient-to-br from-slate-900 to-indigo-950 text-white rounded-2xl p-5 shadow-lg border border-indigo-900 mt-4 flex flex-col gap-3 relative overflow-hidden">
            <div class="absolute -right-10 -bottom-10 w-28 h-28 bg-indigo-500 rounded-full opacity-10 blur-xl"></div>
            <span class="text-xs text-indigo-400 font-bold uppercase tracking-wider">Plan Active</span>
            <h4 class="font-bold text-lg leading-tight">Pro Plan Subscription</h4>
            <p class="text-xs text-slate-300">Unlock infinite team members, CV extracting, and premium AI RAG assistant features.</p>
            <button routerLink="/subscription" class="mt-2 w-full py-2 px-3 rounded-lg text-xs font-semibold bg-white text-indigo-950 hover:bg-indigo-50 transition-all text-center">
              Manage Billing
            </button>
          </div>
        </aside>

        <!-- Main Content Area -->
        <main class="flex-1 flex flex-col gap-8">
          <!-- Hero Banner -->
          <section class="bg-white rounded-2xl p-8 border border-slate-100 shadow-sm flex items-center justify-between relative overflow-hidden">
            <div class="flex flex-col gap-2 relative z-10">
              <h2 class="text-3xl font-extrabold text-slate-800 leading-tight">
                Welcome back, Pilot! 👋
              </h2>
              <p class="text-slate-500 max-w-xl leading-relaxed">
                Here is what's happening on your project sprint. You have some pending tasks to review and approve.
              </p>
            </div>
            <div class="w-32 h-32 opacity-10 absolute right-8 top-1/2 -translate-y-1/2">
              <svg class="w-full h-full text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17h-2v-2h2v2zm2.07-7.75l-.9.92C13.45 12.9 13 13.5 13 15h-2v-.5c0-1.1.45-2.1 1.17-2.83l1.24-1.26c.37-.36.59-.86.59-1.41 0-1.1-.9-2-2-2s-2 .9-2 2H7c0-2.76 2.24-5 5-5s5 2.24 5 5c0 1.04-.42 1.99-1.07 2.75z"/>
              </svg>
            </div>
          </section>

          <!-- PM - Board Tab -->
          <section *ngIf="activeTab() === 'board' && userRole() === 'ProjectManager'" class="flex flex-col gap-6">
            <div class="flex justify-between items-center">
              <h3 class="text-xl font-bold text-slate-800">Sprint Kanban Board</h3>
              <button routerLink="/employees" class="py-2.5 px-4 rounded-xl font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-100 flex items-center gap-2 text-sm transition-all hover:scale-[1.02]">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"/></svg>
                Invite Employees
              </button>
            </div>
            <app-board></app-board>
          </section>

          <!-- Employee - My Tasks Tab -->
          <section *ngIf="activeTab() === 'my-tasks' && userRole() === 'Employee'" class="flex flex-col gap-6">
            <h3 class="text-xl font-bold text-slate-800">My Assigned Tasks</h3>
            
            <div class="grid grid-cols-3 gap-6">
              <!-- Column: Todo -->
              <div class="bg-slate-100/60 rounded-2xl p-4 border border-slate-200/50 flex flex-col gap-4 min-h-[400px]">
                <div class="flex items-center justify-between px-2">
                  <span class="font-bold text-slate-700 text-sm">To Do</span>
                  <span class="w-6 h-6 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center text-xs font-bold">
                    {{ getTasksByStatus('Todo').length }}
                  </span>
                </div>
                <div class="flex flex-col gap-3">
                  <div *ngFor="let t of getTasksByStatus('Todo')" class="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex flex-col gap-3 hover:shadow-md transition-shadow">
                    <div class="flex justify-between items-start">
                      <span class="px-2 py-0.5 rounded text-[10px] font-bold" [ngClass]="getPriorityClass(t.priority)">
                        {{ t.priority }}
                      </span>
                      <button (click)="moveTask(t.id, 'In Progress')" class="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1">
                        Start →
                      </button>
                    </div>
                    <h4 class="font-bold text-slate-800 text-sm leading-snug">{{ t.title }}</h4>
                    <p class="text-xs text-slate-500 leading-normal">{{ t.desc }}</p>
                  </div>
                </div>
              </div>

              <!-- Column: In Progress -->
              <div class="bg-blue-50/40 rounded-2xl p-4 border border-blue-100/50 flex flex-col gap-4 min-h-[400px]">
                <div class="flex items-center justify-between px-2">
                  <span class="font-bold text-blue-800 text-sm">In Progress</span>
                  <span class="w-6 h-6 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center text-xs font-bold">
                    {{ getTasksByStatus('In Progress').length }}
                  </span>
                </div>
                <div class="flex flex-col gap-3">
                  <div *ngFor="let t of getTasksByStatus('In Progress')" class="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex flex-col gap-3 hover:shadow-md transition-shadow">
                    <div class="flex justify-between items-start">
                      <span class="px-2 py-0.5 rounded text-[10px] font-bold" [ngClass]="getPriorityClass(t.priority)">
                        {{ t.priority }}
                      </span>
                      <button (click)="moveTask(t.id, 'Done')" class="text-xs font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1">
                        Complete ✓
                      </button>
                    </div>
                    <h4 class="font-bold text-slate-800 text-sm leading-snug">{{ t.title }}</h4>
                    <p class="text-xs text-slate-500 leading-normal">{{ t.desc }}</p>
                  </div>
                </div>
              </div>

              <!-- Column: Done -->
              <div class="bg-emerald-50/30 rounded-2xl p-4 border border-emerald-100/30 flex flex-col gap-4 min-h-[400px]">
                <div class="flex items-center justify-between px-2">
                  <span class="font-bold text-emerald-800 text-sm">Done</span>
                  <span class="w-6 h-6 rounded-full bg-emerald-100/80 text-emerald-800 flex items-center justify-center text-xs font-bold">
                    {{ getTasksByStatus('Done').length }}
                  </span>
                </div>
                <div class="flex flex-col gap-3">
                  <div *ngFor="let t of getTasksByStatus('Done')" class="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex flex-col gap-3 opacity-75 hover:opacity-100 transition-opacity">
                    <div class="flex justify-between items-start">
                      <span class="px-2 py-0.5 rounded text-[10px] font-bold" [ngClass]="getPriorityClass(t.priority)">
                        {{ t.priority }}
                      </span>
                      <span class="text-[10px] font-bold text-emerald-600 flex items-center gap-1">Done ✓</span>
                    </div>
                    <h4 class="font-bold text-slate-850 line-through text-sm leading-snug">{{ t.title }}</h4>
                    <p class="text-xs text-slate-500 leading-normal">{{ t.desc }}</p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <!-- Tab: Team Members (PM Only) -->
          <section *ngIf="activeTab() === 'team' && userRole() === 'ProjectManager'" class="flex flex-col gap-6">
            <div class="flex justify-between items-center">
              <h3 class="text-xl font-bold text-slate-800">My Team</h3>
              <button routerLink="/employees" class="text-sm font-semibold text-blue-600 hover:text-blue-700">Manage Team →</button>
            </div>
            
            <div class="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <table class="w-full border-collapse text-left text-sm">
                <thead>
                  <tr class="bg-slate-50 border-b border-slate-100 text-slate-500 font-bold uppercase tracking-wider text-xs">
                    <th class="py-4 px-6">Member</th>
                    <th class="py-4 px-6">Role</th>
                    <th class="py-4 px-6">Status</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-100">
                  <tr *ngFor="let m of teamMembers" class="hover:bg-slate-50/50 transition-colors">
                    <td class="py-4 px-6 flex items-center gap-3">
                      <img [src]="m.avatar" class="w-9 h-9 rounded-full object-cover border border-slate-100" />
                      <div>
                        <div class="font-bold text-slate-800">{{ m.name }}</div>
                        <div class="text-xs text-slate-400">{{ m.email }}</div>
                      </div>
                    </td>
                    <td class="py-4 px-6 text-slate-600 font-medium">{{ m.role }}</td>
                    <td class="py-4 px-6">
                      <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold"
                        [ngClass]="m.status === 'Active' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600 animate-pulse'">
                        {{ m.status }}
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <!-- Tab: Analytics -->
          <section *ngIf="activeTab() === 'analytics'" class="flex flex-col gap-6">
            <h3 class="text-xl font-bold text-slate-800">Sprint Analytics</h3>
            
            <div class="grid grid-cols-2 gap-6">
              <div class="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm flex flex-col gap-4">
                <h4 class="font-bold text-slate-700 text-sm">Sprint Completion Rate</h4>
                <div class="flex items-center gap-6">
                  <!-- Custom CSS circular progress indicator -->
                  <div class="relative w-24 h-24 flex items-center justify-center rounded-full bg-blue-50">
                    <div class="absolute w-20 h-20 bg-white rounded-full flex items-center justify-center font-bold text-blue-600 text-xl">
                      78%
                    </div>
                    <div class="w-full h-full rounded-full border-8 border-blue-500 border-r-transparent border-b-transparent animate-spin-slow"></div>
                  </div>
                  <div class="flex flex-col gap-1.5">
                    <div class="flex items-center gap-2">
                      <div class="w-3 h-3 bg-blue-500 rounded-full"></div>
                      <span class="text-xs font-medium text-slate-600">Completed Tasks (28)</span>
                    </div>
                    <div class="flex items-center gap-2">
                      <div class="w-3 h-3 bg-slate-200 rounded-full"></div>
                      <span class="text-xs font-medium text-slate-600">Remaining Tasks (8)</span>
                    </div>
                  </div>
                </div>
              </div>

              <div class="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm flex flex-col gap-4">
                <h4 class="font-bold text-slate-700 text-sm">Task Velocity Profile</h4>
                <div class="flex flex-col gap-3">
                  <div>
                    <div class="flex justify-between text-xs font-semibold text-slate-650 mb-1">
                      <span>Week 1 (Planning & Setup)</span>
                      <span>100%</span>
                    </div>
                    <div class="h-2 w-full bg-slate-150 rounded-full overflow-hidden">
                      <div class="h-full bg-blue-650 w-full rounded-full"></div>
                    </div>
                  </div>
                  <div>
                    <div class="flex justify-between text-xs font-semibold text-slate-650 mb-1">
                      <span>Week 2 (Core Features)</span>
                      <span>85%</span>
                    </div>
                    <div class="h-2 w-full bg-slate-150 rounded-full overflow-hidden">
                      <div class="h-full bg-blue-650 w-[85%] rounded-full"></div>
                    </div>
                  </div>
                  <div>
                    <div class="flex justify-between text-xs font-semibold text-slate-650 mb-1">
                      <span>Week 3 (Refining & Integration)</span>
                      <span>45%</span>
                    </div>
                    <div class="h-2 w-full bg-slate-150 rounded-full overflow-hidden">
                      <div class="h-full bg-indigo-500 w-[45%] rounded-full"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  `,
  styles: [`
    .animate-spin-slow {
      animation: spin 8s linear infinite;
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  `]
})
export class DashboardComponent implements OnInit {
  private router = inject(Router);
  
  userRole = signal<'ProjectManager' | 'Employee' | null>(null);
  activeTab = signal<Tab>('board');

  // Local Task Mockup (for Employees)
  tasks = signal<Task[]>([
    {
      id: '1',
      title: 'Fix auth cookies configuration',
      desc: 'Verify HTTP headers are attached correctly to API calls and cookies are secure.',
      priority: 'High',
      status: 'Todo',
      assignee: 'You',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80'
    },
    {
      id: '2',
      title: 'Create Dashboard pages for PM and Employees',
      desc: 'Implement dynamic, responsive, and gorgeous dashboard views using Tailwind CSS.',
      priority: 'High',
      status: 'In Progress',
      assignee: 'You',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80'
    },
    {
      id: '3',
      title: 'Add Translate pipes to pages',
      desc: 'Localize pages in English and Arabic languages.',
      priority: 'Medium',
      status: 'Todo',
      assignee: 'You',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80'
    },
    {
      id: '4',
      title: 'Integrate Tailwind styles on Register & Login',
      desc: 'Refactor old pages with clean glassmorphic components and grids.',
      priority: 'Low',
      status: 'Done',
      assignee: 'You',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80'
    }
  ]);

  private companyService = inject(CompanyService);

  // Team Mock Data (for PM)
  teamMembers: TeamMember[] = [];

  ngOnInit() {
    const role = getRoleFromToken();
    if (!role) {
      this.router.navigate(['/login']);
      return;
    }
    
    this.userRole.set(role as 'ProjectManager' | 'Employee');
    
    // Set default active tab based on role
    if (role === 'Employee') {
      this.activeTab.set('my-tasks');
    } else {
      this.activeTab.set('board');
      this.loadTeamMembers();
    }
  }

  async loadTeamMembers() {
    try {
      const res = await this.companyService.getInvitations('', 1, 50);
      if (res.succeeded && res.data) {
        this.teamMembers = res.data.items.map(inv => ({
          name: inv.email.split('@')[0], // Extract username from email
          email: inv.email,
          role: 'Team Member',
          status: inv.accepted ? 'Active' : 'Pending',
          avatar: `https://ui-avatars.com/api/?name=${inv.email.charAt(0)}&background=random`
        }));
      }
    } catch (e) {
      console.error('Failed to load team members:', e);
    }
  }

  getTasksByStatus(status: 'Todo' | 'In Progress' | 'Done'): Task[] {
    return this.tasks().filter(t => t.status === status);
  }

  getPriorityClass(p: 'High' | 'Medium' | 'Low'): string {
    switch (p) {
      case 'High': return 'bg-red-50 text-red-600 border border-red-100';
      case 'Medium': return 'bg-amber-50 text-amber-600 border border-amber-100';
      case 'Low': return 'bg-slate-100 text-slate-600 border border-slate-200';
    }
  }

  moveTask(id: string, newStatus: 'Todo' | 'In Progress' | 'Done') {
    const updated = this.tasks().map(t => {
      if (t.id === id) {
        return { ...t, status: newStatus };
      }
      return t;
    });
    this.tasks.set(updated);
  }

  logout() {
    clearTokens();
    this.router.navigate(['/login']);
  }
}