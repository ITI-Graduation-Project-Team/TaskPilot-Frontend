const fs = require('fs');
const dashFile = 'src/app/pages/dashboardPage/ui/dashboard/dashboard.component.ts';
let dashLines = fs.readFileSync(dashFile, 'utf8').split('\n');

const routerInjectLineIdx = dashLines.findIndex(l => l.includes('router = inject(Router);'));
if (routerInjectLineIdx !== -1) {
    if (!dashLines[routerInjectLineIdx + 1].includes('route = inject(ActivatedRoute);')) {
        dashLines.splice(routerInjectLineIdx + 1, 0, '  route = inject(ActivatedRoute);');
    }
}

const importsIndex = dashLines.findIndex(l => l.includes('import { RouterOutlet, Router, NavigationEnd } from \'@angular/router\';'));
if (importsIndex !== -1) {
    dashLines[importsIndex] = dashLines[importsIndex].replace('Router,', 'Router, ActivatedRoute,');
}

fs.writeFileSync(dashFile, dashLines.join('\n'));
