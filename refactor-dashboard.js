const fs = require('fs');
const file = 'd:/TaskPilot-Frontend/src/app/pages/dashboardPage/ui/dashboard/dashboard.component.ts';
let content = fs.readFileSync(file, 'utf8');

// 1. Add RouterOutlet and RouterLinkActive to imports
content = content.replace(/imports:\s*\[/, 'imports: [\n    import(\'@angular/router\').then(m => m.RouterOutlet), // temporary placeholder\n');
content = content.replace(/import\s*\{\s*ActivatedRoute,\s*RouterLink,\s*Router\s*\}\s*from\s*'@angular\/router';/, 'import { ActivatedRoute, RouterLink, Router, RouterOutlet, RouterLinkActive } from \'@angular/router\';');
content = content.replace('import(\'@angular/router\').then(m => m.RouterOutlet), // temporary placeholder', 'RouterOutlet, RouterLinkActive,');

// 2. Replace the main content area with router-outlet
const mainStart = content.indexOf('<main class="flex-1 overflow-y-auto p-6 md:p-8">');
const mainEnd = content.indexOf('</main>', mainStart);
if (mainStart !== -1 && mainEnd !== -1) {
    const replacement = '<main class="flex-1 overflow-y-auto p-6 md:p-8">\n          <router-outlet></router-outlet>\n        ';
    content = content.substring(0, mainStart) + replacement + content.substring(mainEnd);
}

// 3. Replace all the sidebar navigation links
const tabs = ['projects', 'create-project', 'profile', 'sprint-planning', 'team', 'sprint', 'backlog'];
for (const tab of tabs) {
    const clickRegex = new RegExp(`\\(click\\)="currentTab\\.set\\('${tab}'\\)"`, 'g');
    
    // Replace (click)=... with routerLink=...
    content = content.replace(clickRegex, `routerLink="./${tab}" routerLinkActive="nav-item-active" #rla${tab.replace('-', '')}="routerLinkActive"`);
    
    // Replace currentTab() === 'tab' with rla.isActive
    const isTabRegex = new RegExp(`currentTab\\(\\)\\s*===\\s*'${tab}'`, 'g');
    content = content.replace(isTabRegex, `rla${tab.replace('-', '')}.isActive`);
    
    // Replace currentTab() !== 'tab' with !rla.isActive
    const isNotTabRegex = new RegExp(`currentTab\\(\\)\\s*!==\\s*'${tab}'`, 'g');
    content = content.replace(isNotTabRegex, `!rla${tab.replace('-', '')}.isActive`);
}

// 4. Header title logic which uses currentTab()
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

content = content.replace('export class DashboardComponent implements OnInit {', 'export class DashboardComponent implements OnInit {\n  public router = inject(Router);');
content = content.replace(/@if\s*\(currentTab\(\)\s*===\s*'projects'\)\s*{\s*Projects Hub[\s\S]*?}\s*@else\s*{\s*<!-- Breadcrumbs inside project tabs -->[\s\S]*?}/, headerLogic);

// Other currentTab usages
content = content.replace(/currentTab\(\)\s*!==\s*'projects'\s*&&\s*currentTab\(\)\s*!==\s*'profile'/g, `!router.url.includes('projects') && !router.url.includes('profile')`);
content = content.replace(/@if\s*\(currentTab\(\)\s*===\s*'projects'\)/g, `@if (router.url.includes('projects'))`);
content = content.replace(/@if\s*\(currentTab\(\)\s*===\s*'sprint'\)/g, `@if (router.url.includes('sprint'))`);
content = content.replace(/currentTab\s*=\s*signal<[^>]+>\('[^']+'\);/, '');

// Handle switch buttons that were missed (e.g. switch to projects)
content = content.replace(/\(click\)="currentTab\.set\('projects'\)"/g, 'routerLink="./projects"');

fs.writeFileSync(file, content);
console.log('Successfully refactored dashboard.component.ts');
