import { Routes } from '@angular/router';
import { roleGuard } from './shared/guards/role.guard';

export const routes: Routes = [
  { 
    path: '', 
    // Implementing Lazy Loading for the dashboard page
    loadComponent: () => import('./pages/dashboardPage/ui/dashboard/dashboard.component')
      .then(m => m.DashboardComponent),
    
    // تفعيل نقطة التفتيش
    canActivate: [roleGuard], 
    
    // إخبار الـ Guard بأن هذه الصفحة مسموحة فقط للمديرين
    data: { roles: ['Admin', 'ProjectManager'] } 
  },
];