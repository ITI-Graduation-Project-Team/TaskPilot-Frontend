import { describe, expect, it } from 'vitest';
import { getRequirementSessionUiState } from './requirement-session-state';

describe('getRequirementSessionUiState', () => {
  it('allows confirmation when deterministic completeness reaches 100%', () => {
    const state = getRequirementSessionUiState({
      status: 'RequirementValidation',
      completenessReport: { score: 1, readyForPlanning: true },
      questionPool: [],
      finalRequirements: null,
    });

    expect(state.completenessScore).toBe(100);
    expect(state.pendingQuestions).toEqual([]);
    expect(state.readyForFinalization).toBe(true);
  });

  it('allows confirmation at 100% even when validation returned advisory questions', () => {
    const state = getRequirementSessionUiState({
      status: 'RequirementValidation',
      completenessReport: { score: 1, readyForPlanning: true },
      questionPool: [
        { question: 'Validation Issue: clarify the performance target', isAnswered: false },
      ],
      finalRequirements: null,
    });

    expect(state.completenessScore).toBe(100);
    expect(state.readyForFinalization).toBe(true);
  });

  it('allows finalization after the backend has prepared the Planning snapshot', () => {
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
    expect(state.readyForFinalization).toBe(true);
  });

  it('does not enable confirmation for an empty, unstarted payload', () => {
    const state = getRequirementSessionUiState({});

    expect(state.completenessScore).toBe(0);
    expect(state.readyForFinalization).toBe(false);
  });
});
