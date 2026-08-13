import { describe, expect, it } from 'vitest';
import { getRequirementSessionUiState } from './requirement-session-state';

describe('getRequirementSessionUiState', () => {
  it('does not finalize from completeness alone while final requirements are missing', () => {
    const state = getRequirementSessionUiState({
      status: 'RequirementValidation',
      completenessReport: { score: 1, readyForPlanning: true },
      questionPool: [],
      finalRequirements: null,
    });

    expect(state.completenessScore).toBe(100);
    expect(state.pendingQuestions).toEqual([]);
    expect(state.readyForFinalization).toBe(false);
  });

  it('allows finalization only after the backend has prepared the Planning snapshot', () => {
    const state = getRequirementSessionUiState({
      Status: 'Planning',
      CompletenessReport: { Score: 1, ReadyForPlanning: true },
      QuestionPool: [],
      FinalRequirements: { BusinessRequirements: ['Create tasks'] },
    });

    expect(state.readyForFinalization).toBe(true);
  });

  it('supports the discovery DTO percentage and pending-question shape', () => {
    const state = getRequirementSessionUiState({
      workflowState: 'ClarificationRequired',
      requirementCompletenessReport: {
        overallCompleteness: 85,
        readyForFinalization: true,
      },
      pendingQuestions: [{ question: 'Who are the users?' }],
    });

    expect(state.completenessScore).toBe(85);
    expect(state.pendingQuestions).toEqual(['Who are the users?']);
    expect(state.readyForFinalization).toBe(false);
  });
});
