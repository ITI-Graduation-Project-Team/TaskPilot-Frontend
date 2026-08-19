import { computed, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideTranslateService, TranslateService } from '@ngx-translate/core';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ProjectStateService } from '../../../../shared/services/project-state.service';
import { TelemetryService } from '../../../../shared/api/Telemetry-api/telemetry.service';
import { AiTelemetryComponent } from './ai-telemetry.component';

describe('AiTelemetryComponent', () => {
  const loading = signal(false);
  const isProjectManager = signal(true);
  const selectedProjectId = signal<string | null>('project-1');
  const projects = signal([
    createProject('project-1', 'Project One', 'المشروع الأول'),
    createProject('project-2', 'Project Two', 'المشروع الثاني'),
  ]);
  const selectedProject = computed(() => projects().find(project => project.id === selectedProjectId()) ?? null);

  let fixture: ComponentFixture<AiTelemetryComponent>;
  let telemetry: {
    getManagedProjectsSummary: ReturnType<typeof vi.fn>;
    getEmployeeSummary: ReturnType<typeof vi.fn>;
    getProjectSummary: ReturnType<typeof vi.fn>;
    getProjectMembersUsage: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    loading.set(false);
    isProjectManager.set(true);
    selectedProjectId.set('project-1');
    telemetry = {
      getManagedProjectsSummary: vi.fn().mockResolvedValue({
        succeeded: true,
        data: { totalOperations: 12, totalTokens: 1_200, totalCostUsd: 0.5, averageResponseTimeMs: 2_000 },
      }),
      getEmployeeSummary: vi.fn().mockResolvedValue({
        succeeded: true,
        data: { totalOperations: 3, totalTokens: 300, totalCostUsd: 0.1, averageResponseTimeMs: 500 },
      }),
      getProjectSummary: vi.fn().mockImplementation((projectId: string) => Promise.resolve({
        succeeded: true,
        data: {
          projectId,
          projectName: projectId,
          totalOperations: 4,
          totalTokens: 400,
          totalCostUsd: 0.2,
          averageResponseTimeMs: 1_000,
          modelUsageCounts: {},
        },
      })),
      getProjectMembersUsage: vi.fn().mockResolvedValue({ succeeded: true, data: [] }),
    };

    await TestBed.configureTestingModule({
      imports: [AiTelemetryComponent],
      providers: [
        provideTranslateService(),
        { provide: TelemetryService, useValue: telemetry },
        {
          provide: ProjectStateService,
          useValue: { loading, isProjectManager, selectedProjectId, selectedProject },
        },
      ],
    }).compileComponents();

    const translate = TestBed.inject(TranslateService);
    translate.setTranslation('en', {
      TELEMETRY: {
        ALL_PROJECTS_TITLE: 'All Projects Usage', ALL_PROJECTS_DESC: 'All projects description',
        TITLE: 'AI Telemetry', PM_DESC: 'Project description', EMP_DESC: 'Employee description', ROLE_EMP: 'My Usage',
        LOADING: 'Loading', NO_PROJECT: 'No project', NO_PROJECT_DESC: 'Select a project', METRIC_OPS: 'Operations',
        METRIC_TOKENS: 'Tokens', METRIC_COST: 'Cost', METRIC_LATENCY: 'Latency', MODEL_USAGE: 'Models',
        TEAM_USAGE: 'Team', OPS: 'ops', NO_DATA: 'No data', NO_TEAM_DATA: 'No team data', RETRY: 'Retry',
        ALL_PROJECTS_ERROR: 'Portfolio failed', DETAIL_ERROR: 'Details failed',
      },
    });
    translate.setTranslation('ar', {
      TELEMETRY: {
        ALL_PROJECTS_TITLE: 'استهلاك كل المشاريع', ALL_PROJECTS_DESC: 'وصف كل المشاريع',
        TITLE: 'إحصائيات الذكاء الاصطناعي', PM_DESC: 'وصف المشروع', EMP_DESC: 'وصف الموظف', ROLE_EMP: 'استخدامي',
        LOADING: 'جاري التحميل', NO_PROJECT: 'لا يوجد مشروع', NO_PROJECT_DESC: 'حدد مشروعًا', METRIC_OPS: 'العمليات',
        METRIC_TOKENS: 'التوكنز', METRIC_COST: 'التكلفة', METRIC_LATENCY: 'الاستجابة', MODEL_USAGE: 'النماذج',
        TEAM_USAGE: 'الفريق', OPS: 'عملية', NO_DATA: 'لا توجد بيانات', NO_TEAM_DATA: 'لا توجد بيانات للفريق',
        RETRY: 'إعادة المحاولة', ALL_PROJECTS_ERROR: 'فشل الإجمالي', DETAIL_ERROR: 'فشلت التفاصيل',
      },
    });
    await translate.use('en');
  });

  it('loads the portfolio and selected project independently for a project manager', async () => {
    await createComponent();

    expect(telemetry.getManagedProjectsSummary).toHaveBeenCalledTimes(1);
    expect(telemetry.getProjectSummary).toHaveBeenCalledWith('project-1');
    expect(telemetry.getEmployeeSummary).not.toHaveBeenCalled();
    expect(fixture.nativeElement.textContent).toContain('All Projects Usage');
    expect(fixture.nativeElement.textContent).toContain('Project One');
  });

  it('reloads only project details when the selected project changes', async () => {
    await createComponent();

    selectedProjectId.set('project-2');
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(telemetry.getManagedProjectsSummary).toHaveBeenCalledTimes(1);
    expect(telemetry.getProjectSummary).toHaveBeenLastCalledWith('project-2');
    expect(fixture.nativeElement.textContent).toContain('Project Two');
  });

  it('uses the Arabic project name when Arabic is active', async () => {
    await TestBed.inject(TranslateService).use('ar');
    await createComponent();

    expect(fixture.nativeElement.textContent).toContain('المشروع الأول');
    expect(fixture.nativeElement.textContent).not.toContain('Project One');
  });

  it('keeps the employee view free of the all-projects card', async () => {
    isProjectManager.set(false);
    selectedProjectId.set(null);
    await createComponent();

    expect(telemetry.getEmployeeSummary).toHaveBeenCalledTimes(1);
    expect(telemetry.getManagedProjectsSummary).not.toHaveBeenCalled();
    expect(fixture.nativeElement.textContent).not.toContain('All Projects Usage');
    expect(fixture.nativeElement.textContent).toContain('My Usage');
  });

  it('shows a portfolio error without hiding successful project details', async () => {
    telemetry.getManagedProjectsSummary.mockRejectedValue(new Error('Portfolio unavailable'));
    await createComponent();

    expect(fixture.nativeElement.textContent).toContain('Portfolio unavailable');
    expect(fixture.nativeElement.textContent).toContain('Project One');
    expect(fixture.nativeElement.textContent).toContain('4');
  });

  async function createComponent(): Promise<void> {
    fixture = TestBed.createComponent(AiTelemetryComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    await vi.waitFor(() => expect(fixture.componentInstance.detailLoading()).toBe(false));
    if (isProjectManager()) {
      await vi.waitFor(() => expect(fixture.componentInstance.portfolioLoading()).toBe(false));
    }
    fixture.detectChanges();
  }
});

function createProject(id: string, nameEn: string, nameAr: string) {
  return {
    id, name: nameEn, nameEn, nameAr, description: '', companyId: 'company-1', managerId: 'manager-1',
  };
}
