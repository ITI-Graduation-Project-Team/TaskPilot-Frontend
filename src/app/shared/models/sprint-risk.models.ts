export interface ApiResponse<T> {
  isSuccess: boolean;
  isFailure: boolean;
  error: { code: string; message: string };
  errors: Array<{ code: string; message: string }>;
  value: T;
}

export interface SprintRiskAlertDto {
  id: string; // Guid
  riskType: string;
  severity: string; // e.g., "High", "Medium", "Low", "Critical"
  messageEn: string;
  messageAr: string;
  affectedTaskId: string | null; // Guid?
  affectedTaskTitle: string | null;
  affectedEmployeeId: string | null; // Guid?
  affectedEmployeeName: string | null;
  detectedAt: string; // ISO 8601 Date String
  isDismissed: boolean;
}

export interface SprintRiskSimulationResponseDto {
  alertId: string; // Guid
  scenarios: WhatIfScenarioDto[];
}

export interface WhatIfScenarioDto {
  titleEn: string;
  titleAr: string;
  descriptionEn: string;
  descriptionAr: string;
  projectedImpactEn: string;
  projectedImpactAr: string;
  suggestedAction: WhatIfActionDto;
}

export interface WhatIfActionDto {
  actionType: string; // Possible values: "Reassign" | "DropScope" | "ExtendSprint"
  targetTaskId: string | null; // Guid?
  suggestedEmployeeId: string | null; // Guid?
  extensionDays: number | null; 
  storyToDropId: string | null; // Guid?
}
