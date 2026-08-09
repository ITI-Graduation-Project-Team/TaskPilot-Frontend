import { AxiosError } from 'axios';

export interface ApiErrorDetail {
  code: string;
  description: string;
}

export interface ParsedApiError {
  status?: number;
  code?: string;
  message: string;
  errors: ApiErrorDetail[];
}

interface ApiErrorEnvelope {
  message?: string;
  errors?: ApiErrorDetail[] | Record<string, string | string[]>;
  error?: Partial<ApiErrorDetail>;
  code?: string;
  description?: string;
}

/**
 * Normalizes TaskPilot's ApiResponse failure envelope and ASP.NET validation
 * problem details into one predictable frontend shape.
 */
export function parseApiError(
  error: unknown,
  fallbackMessage = 'Something went wrong. Please try again.',
): ParsedApiError {
  const axiosError = error as AxiosError<ApiErrorEnvelope>;
  const raw =
    axiosError?.response?.data ??
    (error as { error?: ApiErrorEnvelope })?.error ??
    (error as ApiErrorEnvelope);
  const errors = normalizeErrors(raw?.errors);

  if (errors.length === 0 && raw?.error?.code) {
    errors.push({
      code: raw.error.code,
      description: raw.error.description ?? raw.message ?? fallbackMessage,
    });
  }

  if (errors.length === 0 && raw?.code) {
    errors.push({
      code: raw.code,
      description: raw.description ?? raw.message ?? fallbackMessage,
    });
  }

  const message =
    errors
      .map((item) => item.description)
      .filter(Boolean)
      .join(' ') ||
    raw?.message ||
    (error instanceof Error ? error.message : '') ||
    fallbackMessage;

  return {
    status: axiosError?.response?.status ?? (error as { status?: number })?.status,
    code: errors[0]?.code,
    message,
    errors,
  };
}

function normalizeErrors(errors: ApiErrorEnvelope['errors']): ApiErrorDetail[] {
  if (!errors) return [];

  if (Array.isArray(errors)) {
    return errors
      .filter((item) => item && typeof item === 'object')
      .map((item) => ({
        code: item.code ?? '',
        description: item.description ?? '',
      }));
  }

  return Object.entries(errors).flatMap(([field, value]) => {
    const messages = Array.isArray(value) ? value : [value];
    return messages.map((message) => ({ code: field, description: String(message) }));
  });
}
