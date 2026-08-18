import { describe, expect, it } from 'vitest';
import { TranslateService } from '@ngx-translate/core';
import { getProjectErrorMessage } from './project-error';

describe('getProjectErrorMessage', () => {
  const translate = {
    instant: (key: string) => ({
      'PROJECT_ERRORS.NAME_ALREADY_EXISTS': 'Choose another project name.',
      'PROJECT_ERRORS.SAVE_FAILED': 'Could not save the project.',
    })[key] ?? key,
  } as TranslateService;

  it('maps the duplicate project code to a friendly localized message', () => {
    const message = getProjectErrorMessage({
      status: 409,
      code: 'PROJECT_NAME_ALREADY_EXISTS',
      message: 'Database error',
      errors: [],
    }, translate);

    expect(message).toBe('Choose another project name.');
  });

  it('preserves a safe backend message for other failures', () => {
    const message = getProjectErrorMessage({
      status: 400,
      code: 'INVALID_INPUT',
      message: 'The project name is required.',
      errors: [],
    }, translate);

    expect(message).toBe('The project name is required.');
  });
});
