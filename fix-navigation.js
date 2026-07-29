const fs = require('fs');

function fixRouterNavigation(file, prefix, signalName) {
  let content = fs.readFileSync(file, 'utf8');

  // We want to replace `this.currentTab.set(tab);` with `this.router.navigate(['/dashboard', tab]);`
  // But NOT inside the paramMap.subscribe!
  
  // A simple way is to temporarily hide the paramMap block
  const paramMapRegex = /this\.route\.paramMap\.subscribe\([\s\S]*?\}\);/;
  const match = content.match(paramMapRegex);
  const paramMapBlock = match ? match[0] : '';
  
  if (paramMapBlock) {
    content = content.replace(paramMapBlock, '__PARAM_MAP_BLOCK__');
  }

  // Now replace all `this.currentTab.set(X)` with `this.router.navigate(['/prefix', X])`
  const regex = new RegExp(`this\\.${signalName}\\.set\\(([^)]+)\\);`, 'g');
  content = content.replace(regex, `this.router.navigate(['/${prefix}', $1]);`);

  // Restore the paramMap block
  if (paramMapBlock) {
    content = content.replace('__PARAM_MAP_BLOCK__', paramMapBlock);
  }

  // Ensure router is injected
  if (!content.includes('public router = inject(Router)')) {
    content = content.replace(/export class [\s\S]*? implements OnInit \{/, (m) => m + "\n  public router = inject(Router);");
  }

  // Ensure Router is imported from @angular/router
  if (!content.includes('Router,')) {
    content = content.replace(/import \{ ActivatedRoute, RouterLink \}/, "import { ActivatedRoute, RouterLink, Router }");
  }

  fs.writeFileSync(file, content);
}

fixRouterNavigation('src/app/pages/dashboardPage/ui/dashboard/dashboard.component.ts', 'dashboard', 'currentTab');
fixRouterNavigation('src/app/pages/employeeDashboardPage/ui/employee-dashboard/employee-dashboard.component.ts', 'employee-dashboard', 'activeTab');
