import { describe, expect, it } from 'vitest';
import { CompanyEmployee, ProjectEmployee } from '../../../../shared/api/team-collaboration.service';
import { resolveEmployeePickerEmptyState } from './team-view.component';

const employee = (overrides: Partial<CompanyEmployee> = {}): CompanyEmployee => ({
  employeeId: 'employee-1',
  fullName: 'Employee One',
  email: 'employee@example.com',
  jobTitle: 'Developer',
  availabilityStatus: 'Available',
  ...overrides,
});

const projectMember = (employeeId: string): ProjectEmployee => ({
  employeeId,
  fullName: 'Project Member',
  email: 'member@example.com',
  role: 'Developer',
});

describe('resolveEmployeePickerEmptyState', () => {
  it('distinguishes loading and API errors from an empty company', () => {
    expect(resolveEmployeePickerEmptyState([], [], true, false)).toBe('loading');
    expect(resolveEmployeePickerEmptyState([], [], false, true)).toBe('error');
    expect(resolveEmployeePickerEmptyState([], [], false, false)).toBe('noEmployees');
  });

  it('reports all assigned only when every active employee belongs to this project', () => {
    expect(resolveEmployeePickerEmptyState(
      [employee()], [projectMember('employee-1')], false, false)).toBe('allAssigned');
  });

  it('reports employees assigned elsewhere as unavailable instead of assigned here', () => {
    expect(resolveEmployeePickerEmptyState(
      [employee({ availabilityStatus: 'PartiallyBusy' })], [], false, false)).toBe('noneAvailable');
  });

  it('returns no empty state when an assignable employee exists', () => {
    expect(resolveEmployeePickerEmptyState([employee()], [], false, false)).toBeNull();
  });
});
