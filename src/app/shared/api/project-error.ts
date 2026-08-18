import { TranslateService } from '@ngx-translate/core';
import { ParsedApiError } from './api-error';

export const PROJECT_NAME_ALREADY_EXISTS = 'PROJECT_NAME_ALREADY_EXISTS';

export function getProjectErrorMessage(
  error: ParsedApiError | undefined,
  translate: TranslateService,
  fallbackKey = 'PROJECT_ERRORS.SAVE_FAILED',
): string {
  if (error?.code === PROJECT_NAME_ALREADY_EXISTS) {
    return translate.instant('PROJECT_ERRORS.NAME_ALREADY_EXISTS');
  }

  return error?.message || translate.instant(fallbackKey);
}
