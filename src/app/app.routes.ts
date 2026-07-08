import { Routes } from '@angular/router';
import { roleGuard } from './shared/guards/role.guard';
import { authGuard } from './shared/guards/auth.guard';

export const routes: Routes = [

  { path: '', redirectTo: 'login', pathMatch: 'full' },
  {
    path: 'dashboard',
    canActivate: [authGuard],
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
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/completeProfilePage/ui/complete-profile/complete-profile.component').then(
        (m) => m.CompleteProfileComponent
      ),
  },
];

