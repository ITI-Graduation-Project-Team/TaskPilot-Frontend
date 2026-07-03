import { Component, signal, ViewChild, ElementRef, Inject } from '@angular/core';
import { CommonModule, DOCUMENT } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ProfileService, SkillDetails, CvExtractionData } from '../../../../shared/api/profile.service';
import { extractApiError } from '../../../../shared/api/auth.api';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { take } from 'rxjs/operators';

type UploadState = 'idle' | 'dragging' | 'loading' | 'success' | 'error';

@Component({
  selector: 'app-complete-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslatePipe],
  templateUrl: './complete-profile.component.html'
})
export class CompleteProfileComponent {
  uploadState = signal<UploadState>('idle');
  errorMessage = signal<string>('');
  jobTitle = signal<string>('');
  seniorityLevel = signal<string>('');
  totalYearsOfExperience = signal<number>(0);
  skills = signal<SkillDetails[]>([]);
  newSkill = signal<string>('');
  showFinalArray: boolean = false;
  currentLang = signal('en');
  
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  constructor(
    private profileService: ProfileService,
    private router: Router,
    private translate: TranslateService,
    @Inject(DOCUMENT) private document: Document
  ) {
    const savedLang = localStorage.getItem('app_lang') || 'en';
    this.currentLang.set(savedLang);
    this.translate.use(savedLang);
    this.document.documentElement.dir = savedLang === 'ar' ? 'rtl' : 'ltr';
    this.document.documentElement.lang = savedLang;
  }

  toggleLanguage() {
    const newLang = this.currentLang() === 'en' ? 'ar' : 'en';
    this.currentLang.set(newLang);
    localStorage.setItem('app_lang', newLang);
    this.translate.use(newLang);
    this.document.documentElement.dir = newLang === 'ar' ? 'rtl' : 'ltr';
    this.document.documentElement.lang = newLang;
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
    if (this.uploadState() !== 'loading') {
      this.uploadState.set('dragging');
    }
  }

  onDragLeave(event: DragEvent) {
    event.preventDefault();
    if (this.uploadState() !== 'loading') {
      this.uploadState.set('idle');
    }
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    if (this.uploadState() === 'loading') return;
    
    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.handleFile(files[0]);
    } else {
      this.uploadState.set('idle');
    }
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.handleFile(input.files[0]);
    }
  }

  triggerFileInput() {
    this.fileInput.nativeElement.click();
  }

  private handleFile(file: File) {
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (ext !== 'pdf' && ext !== 'docx') {
      this.uploadState.set('error');
      this.errorMessage.set('Invalid file type. Please upload a .pdf or .docx file.');
      return;
    }

    this.uploadState.set('loading');
    this.errorMessage.set('');

    this.profileService.uploadCV(file).subscribe({
      next: (res) => {
        if (res.succeeded && res.data) {
          this.jobTitle.set(res.data.jobTitle || '');
          this.seniorityLevel.set(res.data.seniorityLevel || '');
          this.totalYearsOfExperience.set(res.data.totalYearsOfExperience || 0);
          this.skills.set(res.data.skills || []);
          this.uploadState.set('success');
        } else {
          this.uploadState.set('error');
          this.errorMessage.set(res.message || 'CV Extraction Failed.');
        }
      },
      error: (err) => {
        this.uploadState.set('error');
        this.errorMessage.set(extractApiError(err) || 'CV Extraction Failed. Please try again.');
      }
    });
  }

  removeSkill(index: number) {
    this.skills.update(current => {
      const newSkills = [...current];
      newSkills.splice(index, 1);
      return newSkills;
    });
  }

  addSkill() {
    const skillName = this.newSkill().trim();
    if (skillName) {
      this.skills.update(current => {
        if (!current.some(s => s.name.toLowerCase() === skillName.toLowerCase())) {
          const newSkillDetail: SkillDetails = {
            name: skillName,
            level: 'Intermediate',
            yearsOfExperience: 1,
            confidenceScore: 1.0
          };
          return [...current, newSkillDetail];
        }
        return current;
      });
      this.newSkill.set('');
    }
  }

  confirmAndSave() {
    if (this.skills().length === 0) {
      alert(this.translate.instant('PROFILE.NO_SKILLS_ERROR'));
      return;
    }

    // 1. Sanitize the Skills Array
    // Map to strictly match backend requirements and ensure exactly one IsPrimary: true
    // Remove confidenceScore and any other extraneous fields
    const sanitizedSkills = this.skills().map((skill, index) => {
      return {
        name: skill.name,
        level: skill.level,
        yearsOfExperience: skill.yearsOfExperience,
        isPrimary: index === 0 // Ensure exactly one skill (the first one) is primary
      };
    });

    // 2. Prepare Profile Data Payload
    const payload = {
      jobTitle: this.jobTitle(),
      seniorityLevel: this.seniorityLevel(),
      totalYearsOfExperience: this.totalYearsOfExperience(),
      skills: sanitizedSkills
    };

    // 3. Call the single confirmCv API
    this.profileService.confirmCv(payload).pipe(take(1)).subscribe({
      next: () => {
        alert('Profile saved successfully!');
        // Optional: Redirect the user, e.g., this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        console.error('Error confirming CV data:', err);
        alert('Failed to save profile details.');
      }
    });
  }
}
