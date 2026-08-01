const fs = require('fs');

function refactorDashboard() {
  const file = 'd:/TaskPilot-Frontend/src/app/pages/dashboardPage/ui/dashboard/dashboard.component.ts';
  let content = fs.readFileSync(file, 'utf8');

  // Imports
  content = content.replace(/imports:\s*\[/, 'imports: [\n    import(\'@angular/router\').then(m => m.RouterOutlet), // temporary placeholder\n');
  content = content.replace(/import\s*\{\s*ActivatedRoute,\s*RouterLink,\s*Router\s*\}\s*from\s*'@angular\/router';/, "import { ActivatedRoute, RouterLink, Router, RouterOutlet } from '@angular/router';");
  content = content.replace("import('@angular/router').then(m => m.RouterOutlet), // temporary placeholder", "RouterOutlet,");

  // Injects
  content = content.replace('export class DashboardComponent implements OnInit {', 'export class DashboardComponent implements OnInit {\n  public router = inject(Router);\n  public route = inject(ActivatedRoute);');

  // Replace Main Area
  const mainStart = content.indexOf('<main class="flex-1 overflow-y-auto p-6 md:p-8">');
  const mainEnd = content.indexOf('</main>', mainStart);
  if (mainStart !== -1 && mainEnd !== -1) {
    const newMain = '<main class="flex-1 overflow-y-auto p-6 md:p-8">\n          <router-outlet></router-outlet>\n        ';
    content = content.substring(0, mainStart) + newMain + content.substring(mainEnd);
  }

  // Replace currentTab.set in template with routerLink
  const tabs = ['projects', 'create-project', 'profile', 'sprint-planning', 'team', 'sprint', 'backlog'];
  for (const tab of tabs) {
    // Nav buttons
    content = content.replace(new RegExp(`\\(click\\)="currentTab\\.set\\('${tab}'\\)"`, 'g'), `routerLink="./${tab}"`);
    // active classes
    content = content.replace(new RegExp(`currentTab\\(\\)\\s*===\\s*'${tab}'`, 'g'), `router.url.includes('${tab}')`);
    content = content.replace(new RegExp(`currentTab\\(\\)\\s*!==\\s*'${tab}'`, 'g'), `!router.url.includes('${tab}')`);
  }

  // Replace header logic
  const headerLogic = `@if (router.url.includes('projects')) {
                Projects Hub
              } @else if (router.url.includes('create-project')) {
                Create Project
              } @else if (router.url.includes('profile')) {
                My Profile
              } @else if (router.url.includes('sprint-planning')) {
                @if (projectState.isProjectManager()) {
                  <span class="text-text-secondary hover:text-text-primary cursor-pointer transition-colors" routerLink="./projects">All Projects</span>
                  <span class="text-text-secondary font-light">/</span>
                }
                <span class="truncate max-w-[200px]">{{ getProjectName(projectState.selectedProject()) || 'Workspace' }}</span>
                <span class="text-text-secondary font-light">/</span>
                Sprint Planning
              } @else {
                <!-- Breadcrumbs inside project tabs -->
                @if (projectState.isProjectManager()) {
                  <span class="text-text-secondary hover:text-text-primary cursor-pointer transition-colors" routerLink="./projects">All Projects</span>
                  <span class="text-text-secondary font-light">/</span>
                }
                <span class="truncate max-w-[200px]">{{ getProjectName(projectState.selectedProject()) || 'Workspace' }}</span>
              }`;
  content = content.replace(/@if\s*\(currentTab\(\)\s*===\s*'projects'\)\s*{\s*Projects Hub[\s\S]*?}\s*@else\s*{\s*<!-- Breadcrumbs inside project tabs -->[\s\S]*?}/, headerLogic);

  // Other currentTab() uses
  content = content.replace(/currentTab\(\)\s*!==\s*'projects'\s*&&\s*currentTab\(\)\s*!==\s*'profile'/g, `!router.url.includes('projects') && !router.url.includes('profile')`);
  content = content.replace(/@if\s*\(currentTab\(\)\s*===\s*'projects'\)/g, `@if (router.url.includes('projects'))`);
  content = content.replace(/@if\s*\(currentTab\(\)\s*===\s*'sprint'\)/g, `@if (router.url.includes('sprint'))`);
  content = content.replace(/currentTab\s*=\s*signal<[^>]+>\('[^']+'\);/, '');

  fs.writeFileSync(file, content);
}

function refactorEmployeeDashboard() {
  const file = 'd:/TaskPilot-Frontend/src/app/pages/employeeDashboardPage/ui/employee-dashboard/employee-dashboard.component.ts';
  let content = fs.readFileSync(file, 'utf8');

  // Imports - add router bits
  content = content.replace(/imports:\s*\[/, 'imports: [\n    import(\'@angular/router\').then(m => m.RouterOutlet), // temp\n');
  content = content.replace(/import\s*\{\s*CommonModule\s*\}\s*from\s*'@angular\/common';/, "import { CommonModule } from '@angular/common';\nimport { ActivatedRoute, RouterLink, Router, RouterOutlet } from '@angular/router';");
  content = content.replace("import('@angular/router').then(m => m.RouterOutlet), // temp", "RouterOutlet, RouterLink,");

  // Injects
  content = content.replace('export class EmployeeDashboardComponent implements OnInit {', 'export class EmployeeDashboardComponent implements OnInit {\n  public router = inject(Router);\n  public route = inject(ActivatedRoute);');

  // Replace Main Area
  // We need to carefully replace the tab content
  const startMarker = '<!-- Tab content -->';
  const mainStart = content.indexOf(startMarker);
  const mainEndStr = '          }';
  const mainEnd = content.indexOf(mainEndStr, mainStart);
  
  if (mainStart !== -1 && mainEnd !== -1) {
    const newTabContent = '<!-- Tab content -->\n            <div class="animate-[fadeUp_0.3s_ease_both]">\n              <router-outlet></router-outlet>\n            </div>\n';
    content = content.substring(0, mainStart) + newTabContent + content.substring(mainEnd + mainEndStr.length);
  }

  // Replace activeTab.set with routerLink
  const tabs = ['sprint', 'current-projects', 'project-history', 'profile', 'calendar'];
  for (const tab of tabs) {
    content = content.replace(new RegExp(`\\(click\\)="activeTab\\.set\\('${tab}'\\)"`, 'g'), `routerLink="./${tab}"`);
    content = content.replace(new RegExp(`activeTab\\(\\)\\s*===\\s*'${tab}'`, 'g'), `router.url.includes('${tab}')`);
    content = content.replace(new RegExp(`activeTab\\(\\)\\s*!==\\s*'${tab}'`, 'g'), `!router.url.includes('${tab}')`);
  }

  // Header Title
  const titleRegex = /pageTitle\s*=\s*computed\(\(\)\s*=>\s*{[\s\S]*?}\);/;
  const newTitleLogic = `pageTitle = computed(() => {
    const url = this.router.url;
    if (url.includes('sprint')) return this.tr.instant('employee.pages.sprintBoard');
    if (url.includes('current-projects')) return this.tr.instant('employee.pages.currentProjects');
    if (url.includes('project-history')) return this.tr.instant('employee.pages.projectHistory');
    if (url.includes('calendar')) return this.tr.instant('calendar.title');
    return this.tr.instant('employee.pages.myProfile');
  });`;
  content = content.replace(titleRegex, newTitleLogic);

  // Other activeTab() occurrences
  content = content.replace(/activeTab\(\)\s*===\s*'sprint'/g, `this.router.url.includes('sprint')`);
  content = content.replace(/activeTab\(\)\s*!==\s*'profile'/g, `!this.router.url.includes('profile')`);
  content = content.replace(/activeTab\s*=\s*signal<EmployeeTab>\('[^']+'\);/, '');
  content = content.replace(/type EmployeeTab = 'sprint' \| 'current-projects' \| 'project-history' \| 'profile' \| 'calendar';/, '');

  // Remove unused imports in component decorator
  const toRemove = ['BoardComponent,', 'CurrentProjects,', 'ProjectHistory,', 'MyProfileComponent,', 'CalendarViewComponent,'];
  for (const comp of toRemove) {
    content = content.replace(new RegExp(comp + '\\s*'), '');
  }

  fs.writeFileSync(file, content);
}

refactorDashboard();
refactorEmployeeDashboard();
console.log('Refactoring complete!');
