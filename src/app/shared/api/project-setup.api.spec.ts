import { describe, expect, it } from 'vitest';
import { normalizeProjectSetup } from './project-setup.api';

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
    });

    expect(setup.techStack.suggestion?.primaryStack.techStack).toEqual(['Angular', '.NET']);
    expect(setup.techStack.suggestion?.primaryStack.reasoning).toBe('Matches the team');
    expect(setup.techStack.suggestion?.idealStack.reasoning).toBe('Best fit');
    expect(setup.techStack.suggestion?.platformTargets).toEqual(['Web']);
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
