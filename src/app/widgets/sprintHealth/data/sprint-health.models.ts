export interface TeamPulseDto {
  teamBurnoutRisk: number;
  summary: SprintHealthSummaryDto;
  kpis: DashboardKpisDto;
  liveActivity: ActivityFeedItemDto[];
  members: TeamPulseMemberDto[];
  needsAttention: NeedsAttentionItemDto[];
  risks: SprintHealthRiskDto[];
  charts: TeamPulseChartsDto;
}

export interface SprintHealthSummaryDto {
  deliveryStatus: string;
  progressPercent: number;
  effortProgressPercent: number;
  doneTasks: number;
  totalTasks: number;
  completedEstimatedHours: number;
  totalEstimatedHours: number;
  remainingHours: number;
  workingDaysLeft: number;
  teamRemainingCapacity: number;
  capacityUsagePercent: number;
  estimatedWorkingDaysNeeded: number;
  spareCapacityHours: number;
  overloadedCount: number;
  unassignedHighPriorityCount: number;
  stuckTasksCount: number;
  estimateExceededCount: number;
  reviewTasksCount: number;
}

export interface DashboardKpisDto {
  sprintProgressValue: string;
  sprintProgressSubtext: string;
  sprintVelocityValue: number;
  sprintVelocitySubtext: string;
  sprintHealthValue: number;
  sprintHealthSubtext: string;
  teamBurnoutRiskValue: number;
  teamBurnoutRiskSubtext: string;
}

export interface ActivityFeedItemDto {
  id: string;
  initials: string;
  name: string;
  actionType: string;
  description: string;
  timestamp: string;
  timeAgo: string;
  agentTag: string;
}

export interface TeamPulseMemberDto {
  employeeId: string;
  initials: string;
  name: string;
  jobTitle: string;
  riskLevel: string;
  burnoutScore: number;
  assignedRemainingHours: number;
  availableRemainingHours: number;
  remainingCapacityDeltaHours: number;
  completedEstimatedHours: number;
  usagePercent: number;
  workloadPressurePercent: number;
  activeTasksCount: number;
  highPriorityTasksCount: number;
  stuckTasksCount: number;
  estimateExceededTasksCount: number;
  reviewTasksCount: number;
  loadStatus: string;
  riskFactors: {
    workload: number;
    pace: number;
    engagement: number;
  };
  trendDirection: string;
  history: number[];
}

export interface NeedsAttentionItemDto {
  type: string;
  severity: string;
  title: string;
  description: string;
  actionLabel: string;
  taskId?: string;
  employeeId?: string;
}

export interface SprintHealthRiskDto {
  type: string;
  severity: string;
  label: string;
  description: string;
  count: number;
}

export interface TeamPulseChartsDto {
  burndown: {
    labels: string[];
    idealTrend: number[];
    actualTrend: number[];
  };
  workload: {
    labels: string[];
    series: number[];
  };
  topContributors: {
    initials: string;
    name: string;
    completedHours: number;
    completedTasksCount: number;
  }[];
}
