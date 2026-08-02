import { Routes } from '@angular/router';
import { roleGuard } from './shared/guards/role.guard';
import { authGuard } from './shared/guards/auth.guard';
import { authRedirectGuard } from './shared/guards/auth-redirect.guard';
import { companySetupGuard } from './shared/guards/company-setup.guard';

export const routes: Routes = [

  {
    path: '',
    loadComponent: () =>
      import('./pages/landingPage/ui/landing/landing.component').then(
        (m) => m.LandingComponent
      ),
  },
  {
    path: 'dashboard',
    canActivate: [authGuard, roleGuard, companySetupGuard],
    data: { roles: ['ProjectManager'] },
    loadComponent: () => import('./pages/dashboardPage/ui/dashboard/dashboard.component').then(m => m.DashboardComponent),
    children: [
      { path: '', redirectTo: 'projects', pathMatch: 'full' },
      { path: 'projects', loadComponent: () => import('./pages/dashboardPage/ui/project-hub/project-hub.component').then(m => m.ProjectHubComponent) },
      { path: 'create-project', loadComponent: () => import('./pages/dashboardPage/ui/create-project/create-project.component').then(m => m.CreateProjectComponent) },
      { path: 'sprint', loadComponent: () => import('./pages/dashboardPage/ui/sprint-view/sprint-view.component').then(m => m.SprintViewComponent) },
      { path: 'sprint-planning', loadComponent: () => import('./pages/dashboardPage/ui/sprint-planning-view/sprint-planning-view.component').then(m => m.SprintPlanningViewComponent) },
      { path: 'retrospective', loadComponent: () => import('./pages/dashboardPage/ui/retrospective-view/retrospective-view.component').then(m => m.RetrospectiveViewComponent) },
      { path: 'backlog', loadComponent: () => import('./pages/dashboardPage/ui/backlog-view/backlog-view.component').then(m => m.BacklogViewComponent) },
      { path: 'team', loadComponent: () => import('./pages/dashboardPage/ui/team-view/team-view.component').then(m => m.TeamViewComponent) },
      { path: 'profile', loadComponent: () => import('./pages/dashboardPage/ui/profile-view/profile-view.component').then(m => m.ProfileViewComponent) },
      { path: 'organization', loadComponent: () => import('./features/organization/ui/organization-view/organization-view.component').then(m => m.OrganizationViewComponent) },
      { path: 'employees', loadComponent: () => import('./pages/employeesPage/ui/employees/employees').then(m => m.EmployeesComponent) },
      { path: 'employees/:id', loadComponent: () => import('./pages/employeesPage/ui/employee-details/employee-details.component').then(m => m.EmployeeDetailsComponent) },
      { path: 'project-policies', loadComponent: () => import('./features/projectPolicies/ui/project-policies-admin/project-policies-admin.component').then(m => m.ProjectPoliciesAdminComponent) },
      { path: 'assignment/:sprintId', loadComponent: () => import('./pages/assignmentPage/ui/assignment/assignment.component').then(m => m.AssignmentComponent) }
    ]
  },
  {
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
  },
  {
    path: 'subscription',
    loadComponent: () =>
      import('./pages/subscriptionPage/ui/subscription-plans/subscription-plans.component').then(
        (m) => m.SubscriptionPlansComponent
      ),
    canActivate: [roleGuard, companySetupGuard],
    data: { roles: ['ProjectManager'] }
  },
  {
    path: 'payment/callback',
    loadComponent: () =>
      import('./pages/paymentCallbackPage/ui/payment-callback/payment-callback.component').then(
        (m) => m.PaymentCallbackComponent
      )
  },
  {
    path: 'select-role',
    loadComponent: () =>
      import('./pages/selectRolePage/ui/select-role/select-role').then(
        (m) => m.SelectRoleComponent
      )
  },
  {
    path: 'register',
    loadComponent: () =>
      import('./pages/registerPage/ui/register/register.component').then(
        (m) => m.RegisterComponent
      ),
  },
  {
    path: 'login',
    canActivate: [authRedirectGuard],
    loadComponent: () =>
      import('./pages/loginPage/ui/login/login.component').then(
        (m) => m.LoginComponent
      ),
  },

  {
    path: 'forgot-password',
    loadComponent: () =>
      import('./pages/forgotPasswordPage/ui/forgot-password/forgot-password.component').then(
        (m) => m.ForgotPasswordComponent
      ),
  },
  {
    path: 'reset-password',
    loadComponent: () =>
      import('./pages/resetPasswordPage/ui/reset-password/reset-password.component').then(
        (m) => m.ResetPasswordComponent
      ),
  },
  {
    path: 'accept-invitation',
    loadComponent: () =>
      import('./pages/acceptInvitationPage/ui/accept-invitation/accept-invitation').then(
        (m) => m.AcceptInvitationComponent
      ),
  },
  {
    path: 'confirm-email',
    loadComponent: () =>
      import('./pages/confirmEmailPage/ui/confirm-email/confirm-email.component').then(
        (m) => m.ConfirmEmailComponent
      ),
  },
  {
    path: 'company-setup',
    canActivate: [roleGuard, companySetupGuard],
    data: { roles: ['ProjectManager'] },
    loadComponent: () =>
      import('./pages/companySetupPage/ui/company-setup/company-setup').then(
        (m) => m.CompanySetupComponent
      ),
  },
  {
    path: 'complete-profile',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/completeProfilePage/ui/complete-profile/complete-profile.component').then(
        (m) => m.CompleteProfileComponent
      ),
  },

];
