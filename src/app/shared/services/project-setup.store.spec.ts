import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ProjectSetupApi, ProjectSetupDto } from '../api/project-setup.api';
import { ProjectSetupStatusChangedDto } from '../models/notification.model';
import { NotificationHubService } from './notification-hub.service';
import { ProjectSetupStore } from './project-setup.store';

describe('ProjectSetupStore realtime synchronization', () => {
  const statusChange = signal<ProjectSetupStatusChangedDto | null>(null);
  const connectionRevision = signal(0);
  const setup: ProjectSetupDto = {
    projectId: 'project-1',
    projectName: 'Project One',
    overallStatus: 'ReadyForWbs',
    teamContext: { activeMemberCount: 1, membersWithSkillsCount: 1, teamStackAvailable: true },
    techStack: { status: 'Confirmed', confirmedStack: ['Angular'], platforms: ['Web'], projectType: 'Web' },
    wbs: {
      status: 'NotStarted', attemptCount: 0, itemsProcessed: 0, itemsCreated: 0,
      secondaryItemsCreated: 0, itemsSkipped: 0,
    },
    skills: {
      status: 'NotStarted', attemptCount: 0, itemsProcessed: 0, itemsCreated: 0,
      secondaryItemsCreated: 0, itemsSkipped: 0,
    },
  };
  let api: { get: ReturnType<typeof vi.fn> };
  let store: ProjectSetupStore;

  beforeEach(() => {
    statusChange.set(null);
    connectionRevision.set(0);
    api = {
      get: vi.fn(() => of({ succeeded: true, data: setup })),
    };
    TestBed.configureTestingModule({
      providers: [
        ProjectSetupStore,
        { provide: ProjectSetupApi, useValue: api },
        {
          provide: NotificationHubService,
          useValue: {
            latestProjectSetupStatusChange: statusChange.asReadonly(),
            connectionRevision: connectionRevision.asReadonly(),
          },
        },
      ],
    });
    store = TestBed.inject(ProjectSetupStore);
  });

  it('refreshes only when the SignalR event belongs to the active project', async () => {
    await store.start('project-1');

    statusChange.set({
      projectId: 'project-2', stage: 'Wbs', status: 'Running', occurredAt: new Date().toISOString(),
    });
    TestBed.flushEffects();
    await Promise.resolve();
    expect(api.get).toHaveBeenCalledTimes(1);

    statusChange.set({
      projectId: 'project-1', stage: 'Wbs', status: 'Running', occurredAt: new Date().toISOString(),
    });
    TestBed.flushEffects();
    await vi.waitFor(() => expect(api.get).toHaveBeenCalledTimes(2));

    store.stop();
  });

  it('refreshes after SignalR reconnects to recover missed events', async () => {
    await store.start('project-1');

    connectionRevision.set(1);
    TestBed.flushEffects();
    await vi.waitFor(() => expect(api.get).toHaveBeenCalledTimes(2));

    store.stop();
  });
});
