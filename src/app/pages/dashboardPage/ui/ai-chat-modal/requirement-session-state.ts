export interface RequirementSessionUiState {
  completenessScore: number;
  pendingQuestions: string[];
  readyForFinalization: boolean;
}

const read = (value: any, camelCase: string, pascalCase: string): any =>
  value?.[camelCase] ?? value?.[pascalCase];

/**
 * Maps both the legacy RequirementSession payload and the newer discovery DTO.
 * A completeness score is informative only; the backend can finalize a session
 * only after it has entered Planning and built FinalRequirements.
 */
export function getRequirementSessionUiState(response: any): RequirementSessionUiState {
  const data = response?.data ?? response;
  const legacyReport = read(data, 'completenessReport', 'CompletenessReport');
  const readinessReport = read(data, 'requirementCompletenessReport', 'RequirementCompletenessReport');

  const rawScore = Number(
    read(legacyReport, 'score', 'Score') ??
    read(readinessReport, 'overallCompleteness', 'OverallCompleteness') ??
    0,
  );
  const completenessScore = Math.max(
    0,
    Math.min(100, Math.round(rawScore <= 1 ? rawScore * 100 : rawScore)),
  );

  const questionPool =
    read(data, 'pendingQuestions', 'PendingQuestions') ??
    read(data, 'questionPool', 'QuestionPool') ??
    [];
  const pendingQuestions = (Array.isArray(questionPool) ? questionPool : [])
    .filter((question: any) => read(question, 'isAnswered', 'IsAnswered') !== true)
    .map((question: any) => read(question, 'question', 'Question'))
    .filter((question: unknown): question is string => typeof question === 'string' && question.trim().length > 0);

  const status = read(data, 'workflowState', 'WorkflowState') ?? read(data, 'status', 'Status');
  const finalRequirements = read(data, 'finalRequirements', 'FinalRequirements');
  const serverReady =
    read(readinessReport, 'readyForFinalization', 'ReadyForFinalization') ??
    read(legacyReport, 'readyForPlanning', 'ReadyForPlanning');

  return {
    completenessScore,
    pendingQuestions,
    readyForFinalization:
      status === 'Planning' &&
      finalRequirements != null &&
      serverReady !== false &&
      pendingQuestions.length === 0,
  };
}
