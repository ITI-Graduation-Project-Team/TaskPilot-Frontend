import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { subscriptionPlanApi } from '../../../../shared/api/subscription-plan.api';
import { ToastService } from '../../../../shared/services/toast.service';
import { SubscriptionPlanDto, CreateSubscriptionPlanDto, UpdateSubscriptionPlanDto } from '../../../../shared/api/subscription.models';
import { extractApiError } from '../../../../shared/api/auth.api';

@Component({
  selector: 'app-admin-subscription-plans',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-subscription-plans.component.html'
})
export class AdminSubscriptionPlansComponent implements OnInit {
  private toastService = inject(ToastService);

  plans = signal<SubscriptionPlanDto[]>([]);
  isLoading = signal(true);

  // Modal State
  isModalOpen = signal(false);
  modalMode = signal<'create' | 'edit'>('create');
  isSubmitting = signal(false);

  // Form State
  formData = signal<CreateSubscriptionPlanDto | UpdateSubscriptionPlanDto>(this.getDefaultForm());
  editingId = signal<number | null>(null);

  // Delete Confirmation State
  deleteConfirmId = signal<number | null>(null);
  deleteConfirmName = signal<string>('');
  isDeleting = signal(false);

  ngOnInit() {
    this.loadData();
  }

  async loadData() {
    this.isLoading.set(true);
    try {
      const res = await subscriptionPlanApi.getAll();
      if (res.data.succeeded && res.data.data) {
        this.plans.set(res.data.data);
      } else {
        this.toastService.show(res.data.message || 'Failed to load plans', 'error');
      }
    } catch (err) {
      this.toastService.show(extractApiError(err) || 'Error loading plans', 'error');
    } finally {
      this.isLoading.set(false);
    }
  }

  openCreateModal() {
    this.modalMode.set('create');
    this.editingId.set(null);
    this.formData.set(this.getDefaultForm());
    this.isModalOpen.set(true);
  }

  openEditModal(plan: SubscriptionPlanDto) {
    this.modalMode.set('edit');
    this.editingId.set(plan.id);
    this.formData.set({
      name: plan.name,
      monthlyPrice: plan.monthlyPrice,
      annualPrice: plan.annualPrice,
      currency: plan.currency,
      maxProjects: plan.maxProjects,
      maxUsersPerProject: plan.maxUsersPerProject,
      maxStorageMb: plan.maxStorageMb,
      hasAi: plan.hasAi,
      hasAdvancedAnalytics: plan.hasAdvancedAnalytics,
      hasTrial: plan.hasTrial,
      trialDays: plan.trialDays,
      maxTokensPerMonth: plan.maxTokensPerMonth
    });
    this.isModalOpen.set(true);
  }

  closeModal() {
    this.isModalOpen.set(false);
    this.formData.set(this.getDefaultForm());
    this.editingId.set(null);
  }

  getDefaultForm(): CreateSubscriptionPlanDto {
    return {
      name: '',
      monthlyPrice: 0,
      annualPrice: 0,
      currency: 'EGP',
      maxProjects: 1,
      maxUsersPerProject: 1,
      maxStorageMb: 1,
      hasAi: false,
      hasAdvancedAnalytics: false,
      hasTrial: false,
      trialDays: 0,
      maxTokensPerMonth: 1000
    };
  }

  validateForm(): string | null {
    const data = this.formData();
    if (!data.name.trim()) return 'Name is required';
    if (data.monthlyPrice < 0) return 'Monthly price cannot be negative';
    if (data.annualPrice < 0) return 'Annual price cannot be negative';
    if (data.maxProjects < 1) return 'Max projects must be at least 1';
    if (data.maxUsersPerProject < 1) return 'Max users per project must be at least 1';
    if (data.maxStorageMb < 1) return 'Max storage (MB) must be at least 1';
    if (data.maxTokensPerMonth < 1) return 'Max tokens per month must be at least 1';
    if (data.hasTrial && data.trialDays < 1) return 'Trial days must be at least 1 if Trial is enabled';
    if (!data.hasTrial && data.trialDays < 0) return 'Trial days cannot be negative';
    return null;
  }

  async savePlan() {
    const error = this.validateForm();
    if (error) {
      this.toastService.show(error, 'error');
      return;
    }

    this.isSubmitting.set(true);
    try {
      if (this.modalMode() === 'create') {
        const res = await subscriptionPlanApi.create(this.formData() as CreateSubscriptionPlanDto);
        if (res.data.succeeded) {
          this.toastService.show('Plan created successfully', 'success');
          this.closeModal();
          await this.loadData();
        } else {
          this.toastService.show(res.data.message || 'Failed to create plan', 'error');
        }
      } else {
        const id = this.editingId();
        if (id) {
          const res = await subscriptionPlanApi.update(id, this.formData() as UpdateSubscriptionPlanDto);
          if (res.data.succeeded) {
            this.toastService.show('Plan updated successfully', 'success');
            this.closeModal();
            await this.loadData();
          } else {
            this.toastService.show(res.data.message || 'Failed to update plan', 'error');
          }
        }
      }
    } catch (err) {
      this.toastService.show(extractApiError(err) || 'Error saving plan', 'error');
    } finally {
      this.isSubmitting.set(false);
    }
  }

  openDeleteConfirm(plan: SubscriptionPlanDto) {
    this.deleteConfirmId.set(plan.id);
    this.deleteConfirmName.set(plan.name);
  }

  closeDeleteConfirm() {
    this.deleteConfirmId.set(null);
    this.deleteConfirmName.set('');
  }

  async confirmDelete() {
    const id = this.deleteConfirmId();
    if (!id || this.isDeleting()) return;

    this.isDeleting.set(true);
    try {
      const res = await subscriptionPlanApi.delete(id);
      if (res.data.succeeded) {
        this.toastService.show('Plan deleted successfully', 'success');
        this.closeDeleteConfirm();
        await this.loadData();
      } else {
        this.toastService.show(res.data.message || 'Failed to delete plan', 'error');
      }
    } catch (err) {
      this.toastService.show(extractApiError(err) || 'Error deleting plan', 'error');
    } finally {
      this.isDeleting.set(false);
    }
  }
}
