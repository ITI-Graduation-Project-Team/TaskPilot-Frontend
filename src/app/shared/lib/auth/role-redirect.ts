export function getRedirectForRole(role: string | null, isProfileCompleted?: boolean): string {
    if (role === 'ProjectManager') {
        return isProfileCompleted ? '/dashboard' : '/company-setup';
    }
    return '/dashboard'; // Default for Employee or unknown roles
}