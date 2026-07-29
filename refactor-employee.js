const fs = require('fs');
const file = 'd:/TaskPilot-Frontend/src/app/pages/employeeDashboardPage/ui/employee-dashboard/employee-dashboard.component.ts';
let content = fs.readFileSync(file, 'utf8');

// 1. Add RouterOutlet and RouterLinkActive to imports
content = content.replace(/imports:\s*\[/, 'imports: [\n    import(\'@angular/router\').then(m => m.RouterOutlet), // temporary placeholder\n');
content = content.replace(/import\s*\{\s*CommonModule\s*\}\s*from\s*'@angular\/common';/, 'import { CommonModule } from \'@angular/common\';\nimport { ActivatedRoute, RouterLink, Router, RouterOutlet, RouterLinkActive } from \'@angular/router\';');
content = content.replace('import(\'@angular/router\').then(m => m.RouterOutlet), // temporary placeholder', 'RouterOutlet, RouterLinkActive, RouterLink,');

// 2. Replace the main content area with router-outlet
const mainStart = content.indexOf('<!-- Tab content -->');
const mainEnd = content.indexOf('</main>', mainStart);
if (mainStart !== -1 && mainEnd !== -1) {
    const replacement = '<!-- Tab content -->\n            <div class="animate-[fadeUp_0.3s_ease_both] h-full">\n              <router-outlet></router-outlet>\n            </div>\n          ';
    content = content.substring(0, mainStart) + replacement + content.substring(mainEnd);
}

// 3. Replace all the sidebar navigation links
const tabs = ['sprint', 'current-projects', 'project-history', 'profile', 'calendar'];
for (const tab of tabs) {
    // Desktop and Mobile navigation links
    const clickRegex = new RegExp(`\\(click\\)="activeTab\\.set\\('${tab}'\\)"`, 'g');
    content = content.replace(clickRegex, `routerLink="./${tab}" routerLinkActive="nav-item-active" #rla${tab.replace('-', '')}="routerLinkActive"`);
    
    // Replace activeTab() === 'tab' with rla.isActive
    const isTabRegex = new RegExp(`activeTab\\(\\)\\s*===\\s*'${tab}'`, 'g');
    content = content.replace(isTabRegex, `rla${tab.replace('-', '')}.isActive`);
    
    // Replace activeTab() !== 'tab' with !rla.isActive
    const isNotTabRegex = new RegExp(`activeTab\\(\\)\\s*!==\\s*'${tab}'`, 'g');
    content = content.replace(isNotTabRegex, `!rla${tab.replace('-', '')}.isActive`);
}

// 4. Header title logic which uses activeTab() 
content = content.replace('export class EmployeeDashboardComponent implements OnInit {', 'export class EmployeeDashboardComponent implements OnInit {\n  public router = inject(Router);');

content = content.replace(/pageTitle\s*=\s*computed\(\(\)\s*=>\s*{[\s\S]*?}\);/, `pageTitle = computed(() => {
    const url = this.router.url;
    if (url.includes('sprint')) return this.tr.instant('employee.pages.sprintBoard');
    if (url.includes('current-projects')) return this.tr.instant('employee.pages.currentProjects');
    if (url.includes('project-history')) return this.tr.instant('employee.pages.projectHistory');
    if (url.includes('calendar')) return this.tr.instant('calendar.title');
    return this.tr.instant('employee.pages.myProfile');
  });`);

// Other activeTab() usages
content = content.replace(/activeTab\(\)\s*===\s*'sprint'/g, `this.router.url.includes('sprint')`);
content = content.replace(/activeTab\(\)\s*!==\s*'profile'/g, `!this.router.url.includes('profile')`);

// Remove activeTab signal definition
content = content.replace(/activeTab\s*=\s*signal<EmployeeTab>\('[^']+'\);/, '');
// Remove EmployeeTab type if present
content = content.replace(/type EmployeeTab = 'sprint' \| 'current-projects' \| 'project-history' \| 'profile' \| 'calendar';/, '');


fs.writeFileSync(file, content);
console.log('Successfully refactored employee-dashboard.component.ts');
