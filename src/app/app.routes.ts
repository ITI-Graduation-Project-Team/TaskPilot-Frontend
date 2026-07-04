import { Routes } from '@angular/router';
import { roleGuard } from './shared/guards/role.guard';
import { authRedirectGuard } from './shared/guards/auth-redirect.guard';

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
    loadComponent: () =>
      import('./pages/dashboardPage/ui/dashboard/dashboard.component').then(
        (m) => m.DashboardComponent
      ),
  },
  {
    path: 'subscription',
    loadComponent: () =>
      import('./pages/subscriptionPage/ui/subscription-plans/subscription-plans.component').then(
        (m) => m.SubscriptionPlansComponent
      ),
    canActivate: [roleGuard],
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
    canActivate: [roleGuard],
    data: { roles: ['ProjectManager'] },
    loadComponent: () =>
      import('./pages/companySetupPage/ui/company-setup/company-setup').then(
        (m) => m.CompanySetupComponent
      ),
  },
  {
    path: 'complete-profile',
    loadComponent: () =>
      import('./pages/completeProfilePage/ui/complete-profile/complete-profile.component').then(
        (m) => m.CompleteProfileComponent
      ),
  },
  {
    path: 'employees',
    canActivate: [roleGuard],
    data: { roles: ['ProjectManager'] },
    loadComponent: () =>
      import('./pages/employeesPage/ui/employees/employees').then(
        (m) => m.EmployeesComponent
      ),
  },
];

