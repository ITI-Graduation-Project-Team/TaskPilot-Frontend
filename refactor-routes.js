const fs = require('fs');
let content = fs.readFileSync('src/app/app.routes.ts', 'utf8');

// The dashboard route
const dashRegex = /\{\s*path:\s*'dashboard',\s*canActivate:[^}]+roles:\s*\['ProjectManager'\]\s*\},[\s\S]*?DashboardComponent[\s\S]*?\),?\s*\}/;

const dashReplacement = `  {
    path: 'dashboard',
    canActivate: [authGuard, roleGuard, companySetupGuard],
    data: { roles: ['ProjectManager'] },
    children: [
      { path: '', redirectTo: 'projects', pathMatch: 'full' },
      { 
        path: ':tab', 
        loadComponent: () => import('./pages/dashboardPage/ui/dashboard/dashboard.component').then((m) => m.DashboardComponent)
      }
    ]
  }`;

content = content.replace(dashRegex, dashReplacement);

// The employee-dashboard route
const empRegex = /\{\s*path:\s*'employee-dashboard',\s*canActivate:[^}]+roles:\s*\['Employee'\]\s*\},[\s\S]*?EmployeeDashboardComponent[\s\S]*?\),?\s*\}/;

const empReplacement = `  {
    path: 'employee-dashboard',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['Employee'] },
    children: [
      { path: '', redirectTo: 'sprint', pathMatch: 'full' },
      { 
        path: ':tab', 
        loadComponent: () => import('./pages/employeeDashboardPage/ui/employee-dashboard/employee-dashboard.component').then((m) => m.EmployeeDashboardComponent)
      }
    ]
  }`;

content = content.replace(empRegex, empReplacement);

fs.writeFileSync('src/app/app.routes.ts', content);
