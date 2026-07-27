const fs = require('fs');

const file = 'src/app/pages/employeeDashboardPage/ui/employee-dashboard/employee-dashboard.component.ts';
let content = fs.readFileSync(file, 'utf8');

// Add ActivatedRoute and RouterLink to imports
if (!content.includes('import { ActivatedRoute, RouterLink }')) {
  content = content.replace(/import { CommonModule } from '@angular\/common';/, "import { CommonModule } from '@angular/common';\nimport { ActivatedRoute, RouterLink } from '@angular/router';");
}

// Add RouterLink to component imports array
content = content.replace(/imports: \[\n\s*CommonModule,/, "imports: [\n    RouterLink,\n    CommonModule,");

// Inject ActivatedRoute
if (!content.includes('public route = inject(ActivatedRoute)')) {
  content = content.replace(/export class EmployeeDashboardComponent implements OnInit \{/, "export class EmployeeDashboardComponent implements OnInit {\n  public route = inject(ActivatedRoute);");
}

fs.writeFileSync(file, content);
