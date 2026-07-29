const fs = require('fs');

function fixDashboard() {
  const file = 'd:/TaskPilot-Frontend/src/app/pages/dashboardPage/ui/dashboard/dashboard.component.ts';
  let content = fs.readFileSync(file, 'utf8');

  // Fix imports
  const unused = ['TeamViewComponent,', 'DraftReviewModalComponent,', 'TechStackAdvisorModalComponent,', 'ProjectHubComponent,', 'SprintPlanningViewComponent,', 'SprintListComponent,', 'BacklogViewComponent,', 'ProfileViewComponent,'];
  for (const c of unused) {
    content = content.replace(c, '');
  }

  // Fix duplicates of router and route
  // Find all `public router = inject(Router);` and `private router = inject(Router);`
  content = content.replace(/public\s+router\s*=\s*inject\(Router\);\s*/g, '');
  content = content.replace(/private\s+router\s*=\s*inject\(Router\);\s*/g, '');
  content = content.replace(/public\s+route\s*=\s*inject\(ActivatedRoute\);\s*/g, '');
  content = content.replace(/private\s+route\s*=\s*inject\(ActivatedRoute\);\s*/g, '');
  
  // Add them once
  content = content.replace('export class DashboardComponent implements OnInit {', 'export class DashboardComponent implements OnInit {\n  public router = inject(Router);\n  public route = inject(ActivatedRoute);');

  // Fix remaining currentTab.set and currentTab()
  content = content.replace(/this\.currentTab\.set\('create-project'\);/g, "this.router.navigate(['./create-project'], { relativeTo: this.route });");
  content = content.replace(/this\.currentTab\.set\('backlog'\);/g, "this.router.navigate(['./backlog'], { relativeTo: this.route });");
  content = content.replace(/this\.currentTab\.set\('projects'\);/g, "this.router.navigate(['./projects'], { relativeTo: this.route });");
  content = content.replace(/this\.currentTab\.set\(([^)]+)\);/g, "this.router.navigate(['./' + $1], { relativeTo: this.route });");
  content = content.replace(/this\.currentTab\(\)/g, "(this.router.url.split('/').pop() || 'projects')");

  fs.writeFileSync(file, content);
}

function fixEmployeeDashboard() {
  const file = 'd:/TaskPilot-Frontend/src/app/pages/employeeDashboardPage/ui/employee-dashboard/employee-dashboard.component.ts';
  let content = fs.readFileSync(file, 'utf8');

  // Fix dangling @else if
  // The original block was:
  // @if (activeTab() === 'sprint') { ... } @else if (activeTab() === 'calendar') { ... } @else if ...
  // Wait, my previous regex replaced activeTab() === 'sprint' with router.url.includes('sprint'). 
  // Let's remove these dangling blocks
  const danglingRegex = /@else\s*if\s*\(router\.url\.includes\('[^']+'\)\)\s*{\s*<div class="animate-\[fadeUp_0.3s_ease_both\](?: h-\[calc\(100vh-140px\)\])?">\s*<app-[^>]+><\/app-[^>]+>\s*<\/div>\s*}/g;
  content = content.replace(danglingRegex, '');
  
  // Also fix the first @if which is now:
  // @if (router.url.includes('sprint')) { <div class="..."> <app-board></app-board> </div> }
  const firstIfRegex = /@if\s*\(router\.url\.includes\('sprint'\)\)\s*{\s*<div class="animate-\[fadeUp_0.3s_ease_both\]">\s*<app-board><\/app-board>\s*<\/div>\s*}/g;
  content = content.replace(firstIfRegex, '');

  // Fix local storage tab code in ngOnInit
  content = content.replace(/const savedTab = localStorage\.getItem\('employee_tab'\) as EmployeeTab \| null;/g, "const savedTab = localStorage.getItem('employee_tab');");
  content = content.replace(/this\.activeTab\.set\(savedTab\);/g, "this.router.navigate(['./' + savedTab], { relativeTo: this.route });");

  fs.writeFileSync(file, content);
}

fixDashboard();
fixEmployeeDashboard();
console.log('Fix complete!');
