# FSD Refactor Plan: Dashboard Architecture

## 1. Feature-Sliced Design (FSD) Layer Mapping

The current "God Components" (`DashboardComponent` and `EmployeeDashboardComponent`) handle layout, routing, business logic, state management, and display simultaneously. We will extract and map these responsibilities into strict FSD layers:

### 📁 `app` (Application Layer)
- **Routing:** Define the root `app.routes.ts` connecting the `pages` via nested routing schemas. Global providers and interceptors reside here.

### 📁 `pages` (Routing & Orchestration)
Pages act as containers/layouts. They map directly to routes and compose widgets and features, but contain *no* direct business logic or complex UI themselves.
- **`dashboard` (PM Layout):** `DashboardLayoutPage` (contains `<router-outlet>`)
  - **Sub-pages:** `ProjectsPage`, `CreateProjectPage`, `SprintPlanningPage`, `BacklogPage`, `TeamPage`, `OrganizationPage`, `ProfilePage`.
- **`employee-dashboard` (Employee Layout):** `EmployeeDashboardLayoutPage` (contains `<router-outlet>`)
  - **Sub-pages:** `EmployeeSprintPage`, `CurrentProjectsPage`, `ProjectHistoryPage`, `CalendarPage`, `EmployeeProfilePage`.

### 📁 `widgets` (Independent UI Blocks)
Widgets are smart compositions of features and entities. They form the structural blocks of our layouts.
- **`SidebarWidget` (PM & Employee variants):** Displays navigation. Injects routing state to determine active links.
- **`HeaderWidget`:** The top bar structure containing the page title, user info, and feature slots.
- **`MobileNavWidget`:** The bottom floating navigation for mobile devices.
- **`AiChatWidget` / `TechStackAdvisorWidget`:** Complex modal components that float above the layout.

### 📁 `features` (Business Logic & User Actions)
Features handle specific, reusable interactions. They can be placed inside Widgets or Pages.
- **`ProjectSelectorFeature`:** The dropdown to switch active projects. Contains the logic to call `ProjectStateService.setSelectedProject()`.
- **`CreateProjectFeature`:** The form and toggle (Manual vs. AI) logic for creating a new workspace.
- **`ThemeToggleFeature`:** The button that interacts with `ThemeService`.
- **`LanguageSwitcherFeature`:** The EN/AR toggle interacting with `TranslateService`.
- **`AuthLogoutFeature`:** The logout action button.

### 📁 `entities` (Business Entities)
Shared domain logic, state, and interfaces (no UI representation tied to a specific feature).
- **`Project` Entity:** Interfaces (`Project`, `ProjectStats`), `ProjectStateService` (signals for current project list and active project), and data access API methods.
- **`User` Entity:** Profile fetching, `AuthService` state (current user role, initials, name).
- **`Sprint` Entity:** Sprint interfaces, `SprintPlanningService`.

### 📁 `shared` (UI Kits & Core Infrastructure)
- **UI Kit:** Generic buttons, generic modal wrappers, icons.
- **Lib:** Interceptors (`language-interceptor.ts`), Guards (`role.guard.ts`), `ThemeService`, `TranslatePipe`.

---

## 2. Nested Routing Strategy

The current signal-based view swapping (`currentTab` / `activeTab`) will be replaced by Angular Router for lazy loading, deep-linking, and performance.

```text
app.routes.ts
 ├── /dashboard (loads DashboardLayoutPage)
 │    ├── /dashboard/projects        -> ProjectsPage
 │    ├── /dashboard/create-project  -> CreateProjectPage
 │    ├── /dashboard/sprint          -> SprintPage (wraps Board widget)
 │    ├── /dashboard/sprint-planning -> SprintPlanningPage
 │    ├── /dashboard/backlog         -> BacklogPage
 │    └── ...
 │
 └── /employee-dashboard (loads EmployeeLayoutPage)
      ├── /employee-dashboard/sprint           -> EmployeeSprintPage
      ├── /employee-dashboard/current-projects -> CurrentProjectsPage
      ├── /employee-dashboard/calendar         -> CalendarPage
      └── ...
```

*Inside `DashboardLayoutPage` template:*
```html
<div class="layout-wrapper" [attr.dir]="isRtl() ? 'rtl' : 'ltr'">
  <widget-sidebar></widget-sidebar>
  <div class="main-content">
    <widget-header></widget-header>
    <main>
      <router-outlet></router-outlet> <!-- Active Page Injected Here -->
    </main>
  </div>
  <widget-mobile-nav></widget-mobile-nav>
</div>
```

---

## 3. Data Flow & Inputs/Outputs (Decoupling)

In a strict FSD architecture, we avoid passing massive amounts of `@Input()` and `@Output()` props down a deeply nested component tree.

- **Widgets are Smart:** The `HeaderWidget` does not need the `DashboardLayoutPage` to pass down the list of projects or the user's name. Instead, the `HeaderWidget` directly composes the `ProjectSelectorFeature`, which internally injects the `Project` entity state.
- **Pages are Orchestrators:** Pages simply define *what* widgets to display. They rarely pass data down unless it's route-specific parameters (e.g., reading a URL `id` and passing it to a widget).
- **State Flow:** 
  - The `ProjectStateService` (Entity layer) holds Angular Signals (`selectedProjectId`, `projects`).
  - The `ProjectSelectorFeature` injects this service to display the dropdown and update the state.
  - The `SidebarWidget` injects this service to display the active project name.
  - When the feature updates the state, the signal reactively triggers UI updates in the Sidebar widget, completely bypassing the `DashboardLayoutPage` orchestrator.
- **Localization safety:** Because components are strictly separated, extracting the HTML for a feature or widget means its `dir="rtl"` bindings and Angular Translate pipes move with it without disruption.
