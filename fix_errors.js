const fs = require('fs');

// 1. Fix duplicates in dashboard.component.ts
const dashFile = 'src/app/pages/dashboardPage/ui/dashboard/dashboard.component.ts';
let dashLines = fs.readFileSync(dashFile, 'utf8').split('\n');

// Find and consolidate router imports
const mainRouterImportIdx = dashLines.findIndex(l => l.includes('import { RouterOutlet, Router, ActivatedRoute, NavigationEnd } from \'@angular/router\';'));
const extraRouterImportIdx = dashLines.findIndex(l => l.includes('import { ActivatedRoute, RouterLink, Router } from \'@angular/router\';'));

if (extraRouterImportIdx !== -1) {
    dashLines.splice(extraRouterImportIdx, 1);
}
if (mainRouterImportIdx !== -1 && !dashLines[mainRouterImportIdx].includes('RouterLink')) {
    dashLines[mainRouterImportIdx] = dashLines[mainRouterImportIdx].replace('RouterOutlet, Router,', 'RouterOutlet, Router, RouterLink,');
}

// Remove duplicate class properties `router = inject(Router)` and `route = inject(ActivatedRoute)`
// Only keep the first ones and make them `private router` and `private route`
let routerInjectCount = 0;
let routeInjectCount = 0;
for(let i=0; i<dashLines.length; i++) {
    if (dashLines[i].includes('router = inject(Router);')) {
        routerInjectCount++;
        if (routerInjectCount === 1) {
            dashLines[i] = dashLines[i].replace('router = inject(Router);', 'private router = inject(Router);');
        } else {
            dashLines[i] = '';
        }
    }
    if (dashLines[i].includes('route = inject(ActivatedRoute);')) {
        routeInjectCount++;
        if (routeInjectCount === 1) {
            dashLines[i] = dashLines[i].replace('route = inject(ActivatedRoute);', 'private route = inject(ActivatedRoute);');
        } else {
            dashLines[i] = '';
        }
    }
}
fs.writeFileSync(dashFile, dashLines.filter(l => l !== '').join('\n'));

// 2. Fix type error in create-project.component.ts
const createProjFile = 'src/app/pages/dashboardPage/ui/create-project/create-project.component.ts';
let createProjLines = fs.readFileSync(createProjFile, 'utf8').split('\n');
for (let i = 0; i < createProjLines.length; i++) {
    if (createProjLines[i].includes('[chatId]="chatId()"')) {
        createProjLines[i] = createProjLines[i].replace('[chatId]="chatId()"', '[chatId]="chatId() ?? \'\'"');
    }
}
fs.writeFileSync(createProjFile, createProjLines.join('\n'));

// 3. Fix import path in header.component.ts
const headerFile = 'src/app/widgets/header/ui/header/header.component.ts';
let headerLines = fs.readFileSync(headerFile, 'utf8').split('\n');
for (let i = 0; i < headerLines.length; i++) {
    if (headerLines[i].includes('shared/ui/notification-bell')) {
        headerLines[i] = `import { NotificationBellComponent } from '../../../../shared/ui/notification-bell/notification-bell';`;
    }
}
fs.writeFileSync(headerFile, headerLines.join('\n'));
