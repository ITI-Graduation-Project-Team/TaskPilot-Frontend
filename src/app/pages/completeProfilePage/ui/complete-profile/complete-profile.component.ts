import { Component, signal, ViewChild, ElementRef, Inject } from '@angular/core';
import { CommonModule, DOCUMENT } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { 
  ProfileService, 
  SkillDetails, 
  CvExtractionData,
  mapSeniorityLevelToBackend,
  mapSeniorityLevelToFrontend,
  mapSkillLevelToBackend,
  mapSkillLevelToFrontend
} from '../../../../shared/api/profile.service';
import { extractApiError } from '../../../../shared/api/auth.api';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { ToastService } from '../../../../shared/services/toast.service';

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
  seniorityLevel = signal<string>('MidLevel');
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
    private toastService: ToastService,
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
          this.seniorityLevel.set(mapSeniorityLevelToFrontend(res.data.seniorityLevel));
          this.totalYearsOfExperience.set(res.data.totalYearsOfExperience || 0);
          let mapped = (res.data.skills || []).map(s => ({
            name: s.name,
            level: mapSkillLevelToFrontend(s.level),
            yearsOfExperience: s.yearsOfExperience || 1,
            confidenceScore: s.confidenceScore || 1.0,
            isPrimary: s.isPrimary || false
          }));

          // Ensure exactly one primary skill
          if (mapped.length > 0) {
            const primaryCount = mapped.filter(s => s.isPrimary).length;
            if (primaryCount !== 1) {
              mapped.forEach(s => s.isPrimary = false);
              mapped[0].isPrimary = true;
            }
          }

          this.skills.set(mapped);
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
      const wasPrimary = current[index].isPrimary;
      const newSkills = [...current];
      newSkills.splice(index, 1);
      if (wasPrimary && newSkills.length > 0) {
        newSkills[0].isPrimary = true;
      }
      return newSkills;
    });
  }

  addSkill() {
    const skillName = this.newSkill().trim();
    if (skillName) {
      this.skills.update(current => {
        if (!current.some(s => s.name.toLowerCase() === skillName.toLowerCase())) {
          const isFirst = current.length === 0;
          const newSkillDetail: SkillDetails = {
            name: skillName,
            level: 'Intermediate',
            yearsOfExperience: 1,
            confidenceScore: 1.0,
            isPrimary: isFirst
          };
          return [...current, newSkillDetail];
        }
        return current;
      });
      this.newSkill.set('');
    }
  }

  setPrimarySkill(index: number) {
    this.skills.update(current => {
      return current.map((s, i) => ({ ...s, isPrimary: i === index }));
    });
  }

  confirmAndSave() {
    if (this.skills().length === 0) {
      this.toastService.show('Please add at least one skill.', 'error');
      return;
    }

    this.uploadState.set('loading');

    // Failsafe: ensure exactly one primary skill before sending
    this.skills.update(current => {
      if (current.length > 0) {
        const primaryCount = current.filter(s => s.isPrimary).length;
        if (primaryCount !== 1) {
          const newSkills = current.map(s => ({ ...s, isPrimary: false }));
          newSkills[0].isPrimary = true;
          return newSkills;
        }
      }
      return current;
    });

    const payload = {
      jobTitle: this.jobTitle(),
      seniorityLevel: mapSeniorityLevelToBackend(this.seniorityLevel()),
      totalYearsOfExperience: this.totalYearsOfExperience(),
      skills: this.skills().map(s => ({
        name: s.name,
        level: mapSkillLevelToBackend(s.level),
        yearsOfExperience: s.yearsOfExperience,
        isPrimary: s.isPrimary || false
      }))
    };

    this.profileService.confirmProfile(payload).subscribe({
      next: (res) => {
        localStorage.setItem('isProfileCompleted', 'true');
        this.toastService.show('🎉 Profile saved successfully!', 'success');
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.uploadState.set('error');
        this.errorMessage.set(extractApiError(err) || 'Failed to save profile. Please check fields.');
      }
    });
  }
}
