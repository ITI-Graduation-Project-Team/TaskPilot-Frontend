import { Routes } from '@angular/router';
import { roleGuard } from './shared/guards/role.guard';

export const routes: Routes = [

  { path: '', redirectTo: 'register', pathMatch: 'full' },
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
>>>>>>> 9cae2d79928e755e371af8bb6724a397b250fbbd
  },
];
