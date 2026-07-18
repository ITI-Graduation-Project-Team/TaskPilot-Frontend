# ARCHITECTURE REFACTOR PLAN

## 1. Component Breakdown Strategy (Smart vs. Dumb Components)
Currently, `DashboardComponent` and `EmployeeDashboardComponent` are massive "God components" that handle state, layout, navigation, and conditionally render entire pages using inline templates. This violates the Single Responsibility Principle, makes the files extremely hard to maintain, and hurts performance.

### 1.1 Dashboard Page Breakdown (Project Manager)
**Goal:** Extract the layout structure (Sidebar, Header, Mobile Nav) into pure presentational components, and move the inner content to standalone routed pages.

**New Components to Extract/Create:**
- **`DashboardLayoutComponent` (Container/Smart):** Replaces the current `DashboardComponent`. Holds the layout wrappers, floating UI elements (like AI Chat Modal), and the `<router-outlet>`. Subscribes to global state to pass necessary data down to layout pieces.
- **`SidebarComponent` (Presentational/Dumb):**
  - **Responsibility:** Renders the desktop navigation menu and company/project logos.
  - **Inputs:** `@Input() currentRoute: string`, `@Input() isProjectManager: boolean`, `@Input() selectedProjectName: string`.
  - **Outputs:** `@Output() navigate = new EventEmitter<string>()`.
- **`HeaderComponent` (Presentational/Dumb):**
  - **Responsibility:** Renders top bar, project selector dropdown, theme toggle, and language switcher.
  - **Inputs:** `@Input() pageTitle: string`, `@Input() projects: Project[]`, `@Input() selectedProjectId: string`, `@Input() isDark: boolean`.
  - **Outputs:** `@Output() projectSelect = new EventEmitter<string>()`, `@Output() toggleTheme = new EventEmitter<void>()`, `@Output() logout = new EventEmitter<void>()`.
- **`MobileNavComponent` (Presentational/Dumb):**
  - **Responsibility:** Bottom navigation bar for mobile devices.
  - **Inputs:** `@Input() currentRoute: string`.
  - **Outputs:** `@Output() navigate = new EventEmitter<string>()`.
- **`CreateProjectComponent` (Routable/Smart):**
  - Currently embedded as inline HTML inside `dashboard.component.ts` (the "Manual vs AI" flow). This will be extracted into its own component and rendered via the router when hitting `/dashboard/create-project`.

### 1.2 Employee Dashboard Page Breakdown
Follows the exact same architectural pattern as the PM Dashboard, but with employee-specific tabs and layout pieces.
- Extract `EmployeeSidebarComponent`, `EmployeeHeaderComponent`, and `EmployeeMobileNavComponent`.
- Convert `EmployeeDashboardComponent` into an `EmployeeLayoutComponent` with a `<router-outlet>`.

---

## 2. Routing Strategy (Nested Routing)
Currently, the application uses a flat routing structure in `app.routes.ts` and relies on Angular Signals (`currentTab` / `activeTab`) to dynamically swap child components in the dashboard. This prevents users from deep-linking to specific tabs (e.g., `/dashboard/backlog`), breaks browser back/forward history, and prevents Angular's lazy loading from optimizing route bundle sizes.

### Proposed Nested Routing Tree
```typescript
export const routes: Routes = [
  // ... other top-level routes
  {
    path: 'dashboard',
    canActivate: [authGuard, roleGuard, companySetupGuard],
    data: { roles: ['ProjectManager'] },
    loadComponent: () => import('./pages/dashboardPage/ui/dashboard-layout/dashboard-layout.component').then(m => m.DashboardLayoutComponent),
    children: [
      { path: '', redirectTo: 'projects', pathMatch: 'full' },
      { path: 'projects', loadComponent: () => import('./pages/dashboardPage/ui/project-hub/project-hub.component').then(m => m.ProjectHubComponent) },
      { path: 'create-project', loadComponent: () => import('./pages/dashboardPage/ui/create-project/create-project.component').then(m => m.CreateProjectComponent) },
      { path: 'sprint', loadComponent: () => import('./widgets/taskBoard/ui/board/board.component').then(m => m.BoardComponent) },
      { path: 'sprint-planning', loadComponent: () => import('./pages/dashboardPage/ui/sprint-planning-view/sprint-planning-view.component').then(m => m.SprintPlanningViewComponent) },
      { path: 'backlog', loadComponent: () => import('./pages/dashboardPage/ui/backlog-view/backlog-view.component').then(m => m.BacklogViewComponent) },
      { path: 'team', loadComponent: () => import('./pages/dashboardPage/ui/team-view/team-view.component').then(m => m.TeamViewComponent) },
      { path: 'organization', loadComponent: () => import('./features/organization/ui/organization-view/organization-view.component').then(m => m.OrganizationViewComponent) },
      { path: 'profile', loadComponent: () => import('./pages/dashboardPage/ui/profile-view/profile-view.component').then(m => m.ProfileViewComponent) },
    ]
  },
  {
    path: 'employee-dashboard',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['Employee'] },
    loadComponent: () => import('./pages/employeeDashboardPage/ui/employee-layout/employee-layout.component').then(m => m.EmployeeLayoutComponent),
    children: [
      { path: '', redirectTo: 'sprint', pathMatch: 'full' },
      { path: 'sprint', loadComponent: () => import('./widgets/taskBoard/ui/board/board.component').then(m => m.BoardComponent) },
      { path: 'current-projects', loadComponent: () => import('./pages/employeeDashboardPage/ui/current-projects/current-projects').then(m => m.CurrentProjects) },
      { path: 'project-history', loadComponent: () => import('./pages/employeeDashboardPage/ui/project-history/project-history').then(m => m.ProjectHistory) },
      { path: 'calendar', loadComponent: () => import('./pages/dashboardPage/ui/calendar-view/calendar-view.component').then(m => m.CalendarViewComponent) },
      { path: 'profile', loadComponent: () => import('./pages/employeeDashboardPage/ui/my-profile/my-profile.component').then(m => m.MyProfileComponent) },
    ]
  }
];
```

**Benefits of Nested Routing:**
1. **Lazy Loading:** By attaching `loadComponent` to child routes, Angular will lazily load each view only when requested. This drastically reduces the initial JavaScript chunk size for the dashboards.
2. **Deep Linking:** Users can share links directly to specific features (e.g., `taskpilot.com/dashboard/sprint-planning`).
3. **Browser History:** Navigation between tabs will correctly populate the browser's history stack, enabling functional Back/Forward buttons.

---

## 3. Impact Assessment
- **State Management & Data Passing:** Currently, the `DashboardComponent` acts as an orchestrator, passing properties directly to child views (e.g., `<app-board [overrideSprintId]="selectedSprintId()">`). By moving to a router-based approach, child route components will need to inject `ProjectStateService` directly or fetch their own necessary context from the route parameters/query params.
- **RTL & Translations Stability:** We will meticulously extract HTML segments ensuring that Arabic direction attributes (`dir="rtl"`) and Angular `| translate` pipes remain completely intact. No generic templating rewrites will occur.
- **Modals & Floating Overlays:** Floating components like `AiChatModalComponent` and `TechStackAdvisorModalComponent` can safely remain inside the layout wrapper (`DashboardLayoutComponent`) to ensure they are accessible globally from any nested child route without having to be re-instantiated.
