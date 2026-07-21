export interface TeamPulseDto {
  teamBurnoutRisk: number;
  kpis: DashboardKpisDto;
  liveActivity: ActivityFeedItemDto[];
  members: TeamPulseMemberDto[];
  charts: TeamPulseChartsDto;
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
  riskFactors: {
    workload: number;
    pace: number;
    engagement: number;
  };
  trendDirection: string;
  history: number[];
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
