import { apiClient } from './axios.instance';

/* ── Shared response shape ─────────────────────────── */
export interface ApiError {
  code: string;
  description: string;
}

export interface ApiResponse<T = unknown> {
  succeeded: boolean;
  message: string;
  errors?: ApiError[];
  data?: T;
}

/* ── Payloads ──────────────────────────────────────── */
export interface RegisterPayload {
  firstNameEn: string;
  lastNameEn: string;
  firstNameAr: string;
  lastNameAr: string;
  email: string;
  password: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface ResetPasswordPayload {
  otp: string;
  email: string;
  password: string;
}

/** Extract a human-readable error string from the API response */
export function extractApiError(err: any): string {
  const data = err?.response?.data as ApiResponse | undefined;
  if (data?.errors?.length) {
    return data.errors.map((e) => e.description).join(' ');
  }
  if (data?.message) return data.message;
  return 'Something went wrong. Please try again.';
}


const NO_CREDS = { withCredentials: false };

export const authApi = {
  register: (payload: RegisterPayload, role: string) =>
    apiClient.post<ApiResponse>(`/Auth/register?Role=${role}`, payload, NO_CREDS),

  confirmEmail: (payload: { email: string; otp: string }) =>
    apiClient.post<ApiResponse>('/Auth/confirm-email', payload, NO_CREDS),

  login: (payload: LoginPayload) =>
    apiClient.post<ApiResponse>('/Auth/login', payload, NO_CREDS),

  forgotPassword: (payload: { email: string }) =>
    apiClient.post<ApiResponse>('/Auth/forgot-password', payload, NO_CREDS),

  resetPassword: (payload: ResetPasswordPayload) =>
    apiClient.post<ApiResponse>('/Auth/reset-password', payload, NO_CREDS),
};
