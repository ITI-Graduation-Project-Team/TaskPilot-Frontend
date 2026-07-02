import { Component, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { CompanyService } from '../../../../shared/api/Company-api/company';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { Router } from '@angular/router';

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
  maxStep = 4;

  private fb = inject(FormBuilder);
  private companyService = inject(CompanyService);
  public translate = inject(TranslateService);
  private router = inject(Router);

  get isArabic(): boolean {
    const lang = typeof this.translate.currentLang === 'function' ? (this.translate.currentLang as any)() : this.translate.currentLang;
    return lang === 'ar';
  }

  get setupProgress(): number {
    let progress = 0;
    if (this.setupForm.get('CompanyName')?.value) progress += 25;
    if (this.setupForm.get('PolicyTitleEn')?.value && this.setupForm.get('PolicyContentEn')?.value && this.setupForm.get('PolicyTitleAr')?.value && this.setupForm.get('PolicyContentAr')?.value) progress += 25;
    if (this.selectedFile) progress += 25;
    if (this.employeeEmails.length > 0) progress += 25;
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
      this.isSubmitting = false;
      if (res.succeeded) {
        this.submitSuccess = true;
        setTimeout(() => {
          this.router.navigate(['/dashboard']);
        }, 1500);
      } else {
        this.submitError = res.message || 'Setup failed. Please try again.';
      }
    } catch (err: any) {
      console.error(err);
      this.isSubmitting = false;
      this.submitError = err.response?.data?.message || err.message || 'An error occurred during setup.';
    }
  }
}
