import { Routes } from '@angular/router';
import { SettingsPageComponent } from './settingsPage.component';

export const settingsRoutes: Routes = [
  {
    path: '',
    component: SettingsPageComponent,
    children: [
      // Example nested routes for the settings layout
      // { path: 'profile', loadComponent: () => import('./features/profile.component').then(m => m.ProfileComponent) },
      // { path: 'notifications', loadComponent: () => import('./features/notifications.component').then(m => m.NotificationsComponent) },
      // { path: '', redirectTo: 'profile', pathMatch: 'full' }
    ]
  }
];
