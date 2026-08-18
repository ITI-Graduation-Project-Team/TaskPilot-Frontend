export interface RequirementSessionUiState {
  completenessScore: number;
  pendingQuestions: string[];
  readyForFinalization: boolean;
}

const read = (value: any, camelCase: string, pascalCase: string): any =>
  value?.[camelCase] ?? value?.[pascalCase];

/**
 * Maps both the legacy RequirementSession payload and the newer discovery DTO.
 * Preserve the original confirmation policy used by the chat: Planning, no
 * remaining questions, >=85% completeness, or an explicit server-ready flag.
 * The finalize endpoint remains authoritative and prepares a missing legacy
 * FinalRequirements snapshot before creating the project.
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

  const hasStarted =
    completenessScore > 0 ||
    status != null ||
    finalRequirements != null ||
    serverReady != null ||
    questionPool.length > 0;

  return {
    completenessScore,
    pendingQuestions,
    readyForFinalization:
      hasStarted &&
      (status === 'Planning' ||
        pendingQuestions.length === 0 ||
        completenessScore >= 85 ||
        serverReady === true),
  };
}
