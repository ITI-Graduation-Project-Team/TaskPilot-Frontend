const fs = require('fs');

function updateDashboard(file, prefix) {
  let content = fs.readFileSync(file, 'utf8');

  // Replace (click) with routerLink
  content = content.replace(/\(click\)="currentTab\.set\('([^']+)'\)"/g, `[routerLink]="['/${prefix}', '$1']"`);

  // Add paramMap subscription in constructor
  if (!content.includes('this.route.paramMap.subscribe')) {
    const constructorMatch = content.match(/constructor\(\)\s*\{/);
    if (constructorMatch) {
      const injection = `
    this.route.paramMap.subscribe(params => {
      const tab = params.get('tab');
      if (tab) {
        this.currentTab.set(tab as any);
      }
    });`;
      content = content.replace(/constructor\(\)\s*\{/, 'constructor() {' + injection);
    }
  }

  // Remove `currentTab = signal(...);` initializer if we want it to just start with the default, but let's keep it as is, paramMap will override it immediately.
  
  fs.writeFileSync(file, content);
}

updateDashboard('src/app/pages/dashboardPage/ui/dashboard/dashboard.component.ts', 'dashboard');
updateDashboard('src/app/pages/employeeDashboardPage/ui/employee-dashboard/employee-dashboard.component.ts', 'employee-dashboard');
