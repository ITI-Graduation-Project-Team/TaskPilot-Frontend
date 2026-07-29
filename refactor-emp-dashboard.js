const fs = require('fs');

const file = 'src/app/pages/employeeDashboardPage/ui/employee-dashboard/employee-dashboard.component.ts';
let content = fs.readFileSync(file, 'utf8');

// 1. Replace activeTab.set
content = content.replace(/\(click\)="activeTab\.set\('([^']+)'\)"/g, `[routerLink]="['/employee-dashboard', '$1']"`);

// 2. Add paramMap subscription
if (!content.includes('this.route.paramMap.subscribe')) {
  const constructorMatch = content.match(/constructor\(\)\s*\{/);
  if (constructorMatch) {
    const injection = `
    this.route.paramMap.subscribe(params => {
      const tab = params.get('tab');
      if (tab) {
        this.activeTab.set(tab as any);
      }
    });`;
    content = content.replace(/constructor\(\)\s*\{/, 'constructor() {' + injection);
  }
}

// 3. Add ES Imports
if (!content.includes('RouterLink')) {
  content = content.replace(/import \{ CommonModule \} from '@angular\/common';/, "import { CommonModule } from '@angular/common';\nimport { ActivatedRoute, RouterLink } from '@angular/router';");
}

// 4. Add RouterLink to @Component imports
content = content.replace(/imports: \[\s*CommonModule,/, "imports: [\n    RouterLink,\n    CommonModule,");

// 5. Inject route
if (!content.includes('public route = inject(ActivatedRoute)')) {
  content = content.replace(/export class EmployeeDashboardComponent implements OnInit \{/, "export class EmployeeDashboardComponent implements OnInit {\n  public route = inject(ActivatedRoute);");
}

fs.writeFileSync(file, content);
