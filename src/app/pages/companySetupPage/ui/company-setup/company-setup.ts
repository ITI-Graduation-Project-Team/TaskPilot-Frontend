import { Component, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { CompanyService } from '../../../../shared/api/Company-api/company';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { Router } from '@angular/router';
import { ProjectStateService } from '../../../../shared/services/project-state.service';

@Component({
  selector: 'app-company-setup',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, TranslatePipe],
  templateUrl: './company-setup.html',
  styleUrls: ['./company-setup.scss']
})
export class CompanySetupComponent {
  setupForm: FormGroup;
  selectedFile: File | null = null;
  employeeEmails: string[] = [];
  currentEmail: string = '';
  isSubmitting = false;
  isDragOver = false;
  fileError: string | null = null;
  submitError: string | null = null;
  submitSuccess = false;

  currentStep = 1;
  maxStep = 5;

  // Sprint Capacity variables
  workingHoursPerDay = 8.0;
  workingDaysMask = 62; // Mon-Fri (2+4+8+16+32)
  defaultCapacityBufferPercentage = 0.8;
  daysOfWeek = [
    { name: 'Sun', value: 1 },
    { name: 'Mon', value: 2 },
    { name: 'Tue', value: 4 },
    { name: 'Wed', value: 8 },
    { name: 'Thu', value: 16 },
    { name: 'Fri', value: 32 },
    { name: 'Sat', value: 64 },
  ];

  private fb = inject(FormBuilder);
  private companyService = inject(CompanyService);
  public translate = inject(TranslateService);
  private router = inject(Router);
  private projectState = inject(ProjectStateService);

  get isArabic(): boolean {
    const lang = typeof this.translate.currentLang === 'function' ? (this.translate.currentLang as any)() : this.translate.currentLang;
    return lang === 'ar';
  }

  get setupProgress(): number {
    let progress = 0;
    if (this.hasCompanyName) progress += 20;
    if (this.hasPolicies) progress += 20;
    if (this.hasDocument) progress += 20;
    if (this.hasCapacityConfig) progress += 20;
    if (this.hasInvites) progress += 20;
    return progress;
  }

  get hasCompanyName(): boolean {
    return !!this.setupForm.get('CompanyName')?.value;
  }

  get hasPolicies(): boolean {
    return !!(this.setupForm.get('PolicyTitleEn')?.value && this.setupForm.get('PolicyContentEn')?.value &&
              this.setupForm.get('PolicyTitleAr')?.value && this.setupForm.get('PolicyContentAr')?.value);
  }

  get hasDocument(): boolean {
    return !!this.selectedFile;
  }

  get hasInvites(): boolean {
    return this.employeeEmails.length > 0;
  }

  get hasCapacityConfig(): boolean {
    return !!this.workingHoursPerDay && !!this.workingDaysMask && !!this.defaultCapacityBufferPercentage;
  }

  isDaySelected(dayValue: number): boolean {
    return (this.workingDaysMask & dayValue) !== 0;
  }

  toggleDay(dayValue: number) {
    if ((this.workingDaysMask & dayValue) !== 0) {
      this.workingDaysMask = this.workingDaysMask & ~dayValue;
    } else {
      this.workingDaysMask = this.workingDaysMask | dayValue;
    }
  }

  constructor() {
    this.setupForm = this.fb.group({
      CompanyName: ['', Validators.required],
      PolicyTitleEn: ['', Validators.required],
      PolicyTitleAr: ['', Validators.required],
      PolicyContentEn: ['', Validators.required],
      PolicyContentAr: ['', Validators.required],
    });
  }

  isStepValid(step: number): boolean {
    switch (step) {
      case 1:
        return this.hasCompanyName;
      case 2:
        return this.hasPolicies;
      case 3:
        return this.hasDocument;
      case 4:
        return this.hasCapacityConfig;
      case 5:
        return true; // Inviting team members is optional
      default:
        return false;
    }
  }

  canGoToStep(step: number): boolean {
    for (let i = 1; i < step; i++) {
      if (!this.isStepValid(i)) {
        return false;
      }
    }
    return true;
  }

  goToStep(step: number) {
    if (this.canGoToStep(step)) {
      this.currentStep = step;
    }
  }

  nextStep() {
    if (this.currentStep < this.maxStep && this.isStepValid(this.currentStep)) {
      this.currentStep++;
    }
  }

  prevStep() {
    if (this.currentStep > 1) {
      this.currentStep--;
    }
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    this.validateAndSetFile(file);
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = true;
  }

  onDragLeave(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = false;
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = false;
    const file = event.dataTransfer?.files[0];
    if (file) {
      this.validateAndSetFile(file);
    }
  }

  validateAndSetFile(file: File | null) {
    if (!file) return;
    if (file.type !== 'application/pdf' && !file.name.endsWith('.pdf')) {
      this.fileError = 'Only PDF files are allowed.';
      this.selectedFile = null;
    } else if (file.size > 10 * 1024 * 1024) {
      this.fileError = 'File size must be less than 10MB.';
      this.selectedFile = null;
    } else {
      this.fileError = null;
      this.selectedFile = file;
    }
  }

  removeFile() {
    this.selectedFile = null;
    this.fileError = null;
  }

  addEmail(event: Event) {
    event.preventDefault();
    const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/;
    if (this.currentEmail && emailPattern.test(this.currentEmail.trim()) && !this.employeeEmails.includes(this.currentEmail.trim())) {
      this.employeeEmails.push(this.currentEmail.trim());
      this.currentEmail = '';
    }
  }

  removeEmail(email: string) {
    this.employeeEmails = this.employeeEmails.filter(e => e !== email);
  }

  async onSubmit() {
    if (this.setupForm.invalid || !this.selectedFile) {
      return;
    }

    this.isSubmitting = true;
    this.submitError = null;
    this.submitSuccess = false;

    const formData = new FormData();
    formData.append('CompanyName', this.setupForm.get('CompanyName')?.value);
    formData.append('PolicyTitleEn', this.setupForm.get('PolicyTitleEn')?.value);
    formData.append('PolicyTitleAr', this.setupForm.get('PolicyTitleAr')?.value);
    formData.append('PolicyContentEn', this.setupForm.get('PolicyContentEn')?.value);
    formData.append('PolicyContentAr', this.setupForm.get('PolicyContentAr')?.value);
    formData.append('PolicyDocument', this.selectedFile);

    this.employeeEmails.forEach((email) => {
      formData.append('EmployeeEmails', email);
    });

    const currentLangRaw = this.translate.currentLang as any;
    const currentLangValue = typeof currentLangRaw === 'function' ? currentLangRaw() : currentLangRaw;
    const lang = (currentLangValue as string) || 'en';

    try {
      const res = await this.companyService.setupCompany(formData, lang);
      if (res.succeeded) {
        // Force refresh the profile so the guard allows us into the PM dashboard and we get companyId
        await this.projectState.getProfile(true);

        // Also update working config
        try {
          const companyId = this.projectState.userCompanyId();
          if (companyId) {
            await this.companyService.updateWorkingConfig(companyId, {
              workingHoursPerDay: this.workingHoursPerDay,
              workingDaysMask: this.workingDaysMask,
              defaultCapacityBufferPercentage: this.defaultCapacityBufferPercentage
            });
          }
        } catch (e) {
          console.warn('Failed to save sprint capacity config during setup', e);
        }

        this.isSubmitting = false;
        this.submitSuccess = true;
        setTimeout(() => {
          this.router.navigate(['/dashboard']);
        }, 1500);
      } else {
        this.isSubmitting = false;
        this.submitError = res.message || 'Setup failed. Please try again.';
      }
    } catch (err: any) {
      console.error(err);
      this.isSubmitting = false;
      this.submitError = err.response?.data?.message || err.message || 'An error occurred during setup.';
    }
  }
}
