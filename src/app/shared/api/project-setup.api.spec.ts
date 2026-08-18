import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { environment } from '../../../environments/environment';
import { normalizeProjectSetup, ProjectSetupApi } from './project-setup.api';

describe('normalizeProjectSetup', () => {
  it('normalizes legacy PascalCase suggestion JSON returned through JsonElement', () => {
    const setup = normalizeProjectSetup({
      projectId: 'project-1',
      overallStatus: 'NeedsTechStack',
      techStack: {
        status: 'Suggested',
        suggestion: {
          PrimaryStack: { TechStack: ['Angular', '.NET'], Reasoning: 'Matches the team', Description: 'Primary' },
          IdealStack: { TechStack: ['Angular', '.NET', 'Redis'], Reasoning: 'Best fit', Description: 'Ideal' },
          PlatformTargets: ['Web'],
          ProjectType: 'SaaS',
          GapAnalysis: ['Redis'],
        },
      },
      wbs: { status: 'NotStarted' },
      skills: { status: 'NotStarted' },
      TeamContext: { ActiveMemberCount: 2, MembersWithSkillsCount: 1 },
    });

    expect(setup.techStack.suggestion?.primaryStack.techStack).toEqual(['Angular', '.NET']);
    expect(setup.techStack.suggestion?.primaryStack.reasoning).toBe('Matches the team');
    expect(setup.techStack.suggestion?.idealStack.reasoning).toBe('Best fit');
    expect(setup.techStack.suggestion?.platformTargets).toEqual(['Web']);
    expect(setup.teamContext).toEqual({ activeMemberCount: 2, membersWithSkillsCount: 1, teamStackAvailable: true });
    expect(setup.techStack.suggestion?.gapAnalysis).toEqual([expect.objectContaining({
      gapType: 'Unclassified', severity: 'Medium', summary: 'Redis', recommendation: 'Redis',
    })]);
  });

  it('normalizes structured skill gaps from the new setup contract', () => {
    const setup = normalizeProjectSetup({
      teamContext: { activeMemberCount: 3, membersWithSkillsCount: 2, teamStackAvailable: true },
      techStack: {
        status: 'Suggested',
        suggestion: {
          primaryStack: { techStack: ['Angular'], reasoning: 'Team fit' },
          idealStack: { techStack: ['Angular', 'Redis'], reasoning: 'Ideal fit' },
          gapAnalysis: [{
            skill: 'Redis', gapType: 'CapacityGap', severity: 'High', requiredCount: 2,
            availableCount: 1, availableFte: 0.5, summary: 'Limited Redis capacity', recommendation: 'Add capacity',
          }],
        },
      },
      wbs: {}, skills: {},
    });

    expect(setup.techStack.suggestion?.gapAnalysis[0]).toEqual(expect.objectContaining({
      skill: 'Redis', gapType: 'CapacityGap', severity: 'High', requiredCount: 2,
      availableCount: 1, availableFte: 0.5,
    }));
  });

  it('drops an incomplete suggestion instead of exposing unsafe nested values', () => {
    const setup = normalizeProjectSetup({
      techStack: { status: 'Suggested', suggestion: {} },
      wbs: {},
      skills: {},
    });

    expect(setup.techStack.suggestion).toBeUndefined();
  });
});

describe('ProjectSetupApi', () => {
  let api: ProjectSetupApi;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ProjectSetupApi, provideHttpClient(), provideHttpClientTesting()],
    });
    api = TestBed.inject(ProjectSetupApi);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpTesting.verify());

  it('loads the lightweight setup status endpoint', () => {
    const projectId = 'project-1';
    const expected = {
      succeeded: true,
      data: { projectId, wbsStatus: 'Succeeded' as const, isReady: true },
    };

    api.getStatus(projectId).subscribe(response => expect(response).toEqual(expected));

    const request = httpTesting.expectOne(`${environment.apiUrl}/projects/${projectId}/setup/status`);
    expect(request.request.method).toBe('GET');
    request.flush(expected);
  });
});
