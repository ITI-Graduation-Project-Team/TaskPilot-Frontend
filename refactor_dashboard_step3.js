const fs = require('fs');

// 2. Update dashboard.component.ts
const dashFile = 'src/app/pages/dashboardPage/ui/dashboard/dashboard.component.ts';
let dashLines = fs.readFileSync(dashFile, 'utf8').split('\n');

// Replace imports: Add RouterOutlet, remove unused components
const importsIndex = dashLines.findIndex(l => l.includes('import { CommonModule }'));
if (importsIndex !== -1 && !dashLines[importsIndex].includes('RouterOutlet')) {
    dashLines.splice(importsIndex, 0, "import { RouterOutlet, Router, NavigationEnd, ActivatedRoute } from '@angular/router';");
    dashLines.splice(importsIndex, 0, "import { filter } from 'rxjs/operators';");
}

const compImportsStart = dashLines.findIndex(l => l.includes('imports: ['));
const compImportsEnd = dashLines.findIndex((l, i) => i > compImportsStart && l.includes(']'));
for (let i = compImportsStart; i <= compImportsEnd; i++) {
    if (dashLines[i].includes('CommonModule')) {
        if (!dashLines[i].includes('RouterOutlet')) {
            dashLines[i] = dashLines[i].replace('CommonModule,', 'CommonModule, RouterOutlet,');
        }
    }
}

// Remove the switch block
const mainStart = dashLines.findIndex(l => l.includes('<main class="flex-1 overflow-y-auto'));
const mainEnd = dashLines.findIndex((l, i) => i > mainStart && l.includes('</main>'));

if (mainStart !== -1 && mainEnd !== -1) {
    const newMain = `        <main class="flex-1 overflow-y-auto p-6 md:p-8">
          <router-outlet></router-outlet>
        </main>`;
    dashLines.splice(mainStart, mainEnd - mainStart + 1, newMain);
}

// Change currentTab.set($event) to router logic in the template
for(let i=0; i<dashLines.length; i++) {
    if (dashLines[i].includes('(tabChange)="currentTab.set($event)"')) {
        dashLines[i] = dashLines[i].replace('(tabChange)="currentTab.set($event)"', '(tabChange)="setTab($event)"');
    }
    if (dashLines[i].includes('(click)="currentTab.set(')) {
        dashLines[i] = dashLines[i].replace(/\(click\)="currentTab\.set\('([^']+)'\)"/g, '(click)="setTab(\'$1\')"');
    }
    if (dashLines[i].includes('(click)="openCreateProjectPage()"')) {
        dashLines[i] = dashLines[i].replace(/\(click\)="openCreateProjectPage\(\)"/g, '(click)="setTab(\'create-project\')"');
    }
    if (dashLines[i].includes('this.currentTab.set(tab)')) {
        dashLines[i] = dashLines[i].replace('this.currentTab.set(tab)', 'this.setTab(tab)');
    }
    if (dashLines[i].includes('this.currentTab.set(')) {
        // e.g. this.currentTab.set('create-project');
        dashLines[i] = dashLines[i].replace(/this\.currentTab\.set\('([^']+)'\)/g, 'this.setTab(\'$1\')');
    }
}

// Add setTab and route listener inside DashboardComponent class
const classLine = dashLines.findIndex(l => l.includes('export class DashboardComponent'));

// Check if setTab is already there (from user's recent manual edits maybe?)
const hasSetTab = dashLines.findIndex(l => l.includes('setTab(tab: string)')) !== -1;

if (classLine !== -1 && !hasSetTab) {
    const setTabLogic = `
  setTab(tab: string) {
    this.router.navigate(['/dashboard', tab]);
  }
`;
    dashLines.splice(classLine + 1, 0, setTabLogic);
    
    // update ngOnInit
    const newOnInitLine = dashLines.findIndex(l => l.includes('ngOnInit() {'));
    if (newOnInitLine !== -1) {
        // We will insert the subscription after ngOnInit() {
        const hasRouterEvents = dashLines.findIndex(l => l.includes('this.router.events.pipe')) !== -1;
        if (!hasRouterEvents) {
            dashLines.splice(newOnInitLine + 1, 0, `    this.router.events.pipe(filter(event => event instanceof NavigationEnd)).subscribe((event: any) => {
      const urlSegments = event.urlAfterRedirects.split('/');
      const tab = urlSegments[urlSegments.length - 1];
      if (['projects', 'create-project', 'sprint', 'sprint-planning', 'backlog', 'team', 'profile', 'organization'].includes(tab)) {
        this.currentTab.set(tab as any);
      }
    });`);
        }
    } else {
        // Create ngOnInit if missing
        dashLines.splice(classLine + 1, 0, `  ngOnInit() {
    this.router.events.pipe(filter(event => event instanceof NavigationEnd)).subscribe((event: any) => {
      const urlSegments = event.urlAfterRedirects.split('/');
      const tab = urlSegments[urlSegments.length - 1];
      if (['projects', 'create-project', 'sprint', 'sprint-planning', 'backlog', 'team', 'profile', 'organization'].includes(tab)) {
        this.currentTab.set(tab as any);
      }
    });
  }`);
    }
}

fs.writeFileSync(dashFile, dashLines.join('\n'));
