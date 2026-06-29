const ROLE_MAP: Record<string, string> = {
    ProjectManager: '/company-setup',
    Employee: '/dashboard',
};

export function getRedirectForRole(role: string | null): string {
    return role ? (ROLE_MAP[role] ?? '/dashboard') : '/dashboard';
}