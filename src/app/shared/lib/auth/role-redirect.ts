export function getRedirectForRole(role: string | null, isProfileCompleted?: boolean): string {
    if (role === 'ProjectManager') {
        return isProfileCompleted ? '/dashboard' : '/company-setup';
    }
    if (role === 'Employee') {
        return isProfileCompleted ? '/employee-dashboard' : '/complete-profile';
    }
    return '/dashboard'; // Default for unknown roles
}