// Frontend models simplified for the UI
export interface DeveloperSuggestion {
  employeeId: string;
  employeeName: string;
  score: number;          // finalScore mapped directly (0–100)
  reasonEn: string;
  reasonAr: string;
  rank: number;           // 1, 2, or 3 — position in rankedDevelopers
  initialRemainingHours: number;
}

export interface AssignmentSuggestion {
  taskId: string;
  taskTitleEn: string;
  taskTitleAr: string;
  estimatedHours: number;
  priority: string;
  type: string;
  assigneeId?: string;
  requiredSkills: { skillId: string; skillNameEn: string; skillNameAr: string }[];
  rankedDevelopers: DeveloperSuggestion[];   // top 3, ordered by rank
  isUnassignable?: boolean;
}

// Raw Backend DTOs
export interface TaskRequiredSkillDto {
  skillId: string;
  skillNameEn: string;
  skillNameAr: string;
}

export interface TaskSnapshotDto {
  taskId: string;
  titleEn: string;
  titleAr: string;
  estimatedHours: number;
  priority: string; // TaskPriority enum string
  effortSize: string; // EffortSize enum string
  type: string; // TaskType enum string
  assigneeId?: string;
  requiredSkills: TaskRequiredSkillDto[];
}

export interface DeveloperScoreDto {
  employeeId: string;
  finalScore: number;
}

export interface ExplainedDeveloperDto extends DeveloperScoreDto {
  reasonEn: string;
  reasonAr: string;
  fullName?: string; // Embedded from backend if available
  remainingHours: number;
}

export interface ExplainedTaskScoringResultDto {
  task: TaskSnapshotDto;
  rankedDevelopers: ExplainedDeveloperDto[];
  isUnassignable?: boolean;
}

export interface ExplainedAssignmentDto {
  projectId: string;
  sprintId: string;
  taskScores: ExplainedTaskScoringResultDto[];
}

export interface ConfirmAssignmentsRequest {
  assignments: { taskId: string; employeeId: string }[];
}
