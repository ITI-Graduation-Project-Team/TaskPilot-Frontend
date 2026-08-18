export interface ScoringWeights {
  skillWeight: number;
  availabilityWeight: number;
  velocityWeight: number;
  experienceWeight: number;
}

export interface SkillGap {
  skillId: number;
  skillName: string;
  reason?: string;
}

export interface DeveloperSuggestion {
  employeeId: string;
  employeeName: string;
  jobTitle?: string;
  score: number;
  rank: number;
  skillScore: number;
  availabilityScore: number;
  velocityScore: number;
  hasHistoricalData: boolean;
  experienceScore: number;
  matchedSkillsCount: number;
  requiredSkillsCount: number;
  skillGaps: SkillGap[];
  maxSprintHours: number;
  currentAssignedHours: number;
  nonEditableHours: number;
  assignedBefore: number;
  assignedAfter: number;
  remainingAfter: number;
  hasSufficientCapacity: boolean;
}

export interface AssignmentSuggestion {
  taskId: string;
  taskTitleEn: string;
  taskTitleAr: string;
  estimatedHours: number;
  priority: string;
  type: string;
  assigneeId?: string;
  requiredSkills: { skillId: number; skillName: string }[];
  rankedDevelopers: DeveloperSuggestion[];
  isUnassignable?: boolean;
}

export interface AssignmentContext {
  suggestions: AssignmentSuggestion[];
  weights: ScoringWeights;
}

export interface ConfirmAssignmentsRequest {
  assignments: { taskId: string; employeeId: string | null }[];
  allowOverCapacity?: boolean;
}

export interface AssignTaskResult {
  taskId: string;
  previousEmployeeId?: string;
  employeeId?: string;
  changed: boolean;
  assignedHours?: number;
  maxSprintHours?: number;
  warnings: string[];
}

export interface AssignmentTeamMember {
  employeeId: string;
  fullName: string;
  jobTitle?: string;
}
