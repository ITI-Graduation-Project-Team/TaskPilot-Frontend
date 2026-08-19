import { afterEach, describe, expect, it, vi } from 'vitest';
import { apiClient } from '../axios.instance';
import { TelemetryService } from './telemetry.service';

describe('TelemetryService', () => {
  afterEach(() => vi.restoreAllMocks());

  it('loads the managed-projects summary endpoint', async () => {
    const expected = {
      succeeded: true,
      data: { totalOperations: 12, totalTokens: 1_200, totalCostUsd: 0.5, averageResponseTimeMs: 2_000 },
    };
    const getSpy = vi.spyOn(apiClient, 'get').mockResolvedValue({ data: expected });

    const result = await new TelemetryService().getManagedProjectsSummary();

    expect(getSpy).toHaveBeenCalledWith('/ai-telemetry/projects/summary');
    expect(result).toEqual(expected);
  });
});
