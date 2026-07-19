import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { authApi, extractApiError } from '../../../../shared/api/auth.api';
import { AuthService } from '../../../../shared/api/auth.service';

type State = 'loading' | 'valid' | 'error' | 'success';

@Component({
  selector: 'app-accept-invitation',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './accept-invitation.html',
  styleUrls: ['./accept-invitation.scss']
})
export class AcceptInvitationComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private authService = inject(AuthService);

  state = signal<State>('loading');
  errorMessage = signal<string>('');
  companyName = signal<string>('');
  email = signal<string>('');
  isAlreadyInCompany = signal<boolean>(false);

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      const token = params['token'];
      if (!token) {
        this.state.set('error');
        this.errorMessage.set('Invitation token is missing.');
        return;
      }
      this.validateAndProcessToken(token);
    });
  }

  async validateAndProcessToken(token: string) {
    try {
      const response = await authApi.getInvitation(token);
      const data: any = response.data?.data || response.data;
      
      if (response.data?.succeeded === false || data?.isAccepted) {
        this.state.set('error');
        this.errorMessage.set(data?.message || 'Invitation is invalid or already accepted.');
        return;
      }

      this.companyName.set(data?.companyName || 'the company');
      this.email.set(data?.email || '');
      
      // Save token for later use if they need to login or register
      sessionStorage.setItem('invitationToken', token);

      if (this.authService.isLoggedIn()) {
        await this.completeInvitation(token);
      } else {
        this.state.set('valid');
      }
    } catch (err: any) {
      this.state.set('error');
      const errors = err?.response?.data?.errors || [];
      const code = err?.response?.data?.code;
      const isAlreadyInCompanyError = (code === 'EMPLOYEE_ALREADY_IN_COMPANY') ||
        errors.some((e: any) => e.code === 'EMPLOYEE_ALREADY_IN_COMPANY');

      if (isAlreadyInCompanyError) {
        this.isAlreadyInCompany.set(true);
        this.errorMessage.set('You already belong to a company. If you wish to join a different company, please contact your administrator or account support to unlink your current association first.');
      } else {
        const statusText = err?.response?.status ? ` (Status: ${err.response.status})` : '';
        const apiErr = extractApiError(err);
        this.errorMessage.set(apiErr + statusText);
      }
    }
  }

  async completeInvitation(token: string) {
    try {
      this.state.set('loading');
      const response = await authApi.completeInvitation(token);
      if (response.data?.succeeded === false) {
        this.state.set('error');
        this.errorMessage.set(response.data?.message || 'Failed to complete invitation');
        return;
      }
      sessionStorage.removeItem('invitationToken');
      this.state.set('success');
      setTimeout(() => {
        this.goToDashboard();
      }, 1500);
    } catch (err: any) {
      this.state.set('error');
      const errors = err?.response?.data?.errors || [];
      const code = err?.response?.data?.code;
      const isAlreadyInCompanyError = (code === 'EMPLOYEE_ALREADY_IN_COMPANY') ||
        errors.some((e: any) => e.code === 'EMPLOYEE_ALREADY_IN_COMPANY');

      if (isAlreadyInCompanyError) {
        this.isAlreadyInCompany.set(true);
        this.errorMessage.set('You already belong to a company. If you wish to join a different company, please contact your administrator or account support to unlink your current association first.');
      } else {
        const statusText = err?.response?.status ? ` (Status: ${err.response.status})` : '';
        const apiErr = extractApiError(err);
        this.errorMessage.set(apiErr + statusText);
      }
    }
  }

  goToDashboard() {
    const currentRole = this.authService.getUserRole();
    const isProfileCompleted = localStorage.getItem('isProfileCompleted') === 'true';
    if (currentRole === 'Employee') {
      this.router.navigate([isProfileCompleted ? '/employee-dashboard' : '/complete-profile']);
    } else if (currentRole === 'ProjectManager') {
      this.router.navigate([isProfileCompleted ? '/dashboard' : '/company-setup']);
    } else {
      this.router.navigate(['/dashboard']);
    }
  }
}
