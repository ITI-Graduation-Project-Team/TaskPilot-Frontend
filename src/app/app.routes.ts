import { Routes } from '@angular/router';

export const routes: Routes = [
  { 
    path: '', 
    // Implementing Lazy Loading for the dashboard page
    loadComponent: () => import('./pages/dashboardPage/ui/dashboard/dashboard.component')
      .then(m => m.DashboardComponent) 
  },
];