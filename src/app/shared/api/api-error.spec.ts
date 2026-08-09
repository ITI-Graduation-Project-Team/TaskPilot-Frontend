import { describe, expect, it } from 'vitest';
import { parseApiError } from './api-error';

describe('parseApiError', () => {
  it('reads TaskPilot ApiResponse errors', () => {
    const parsed = parseApiError({
      response: {
        status: 409,
        data: {
          succeeded: false,
          message: 'Sprint.AnotherAlreadyPlanned',
          errors: [
            { code: 'ANOTHER_SPRINT_ALREADY_PLANNED', description: 'Sprint.AnotherAlreadyPlanned' },
          ],
        },
      },
    });

    expect(parsed.status).toBe(409);
    expect(parsed.code).toBe('ANOTHER_SPRINT_ALREADY_PLANNED');
    expect(parsed.message).toBe('Sprint.AnotherAlreadyPlanned');
  });

  it('normalizes ASP.NET validation errors', () => {
    const parsed = parseApiError({
      response: {
        status: 400,
        data: { errors: { TitleEn: ['Title is required.'] } },
      },
    });

    expect(parsed.code).toBe('TitleEn');
    expect(parsed.message).toBe('Title is required.');
  });

  it('supports the legacy singular error shape', () => {
    const parsed = parseApiError({
      response: {
        status: 400,
        data: { error: { code: 'INVALID_INPUT', description: 'Invalid input.' } },
      },
    });

    expect(parsed.code).toBe('INVALID_INPUT');
    expect(parsed.message).toBe('Invalid input.');
  });
});
