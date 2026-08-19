import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { of } from 'rxjs';
import { BacklogService, UserStoryDto } from '../../../../shared/api/backlog.service';
import { SprintPlanningService } from '../../../../shared/api/sprint-planning.service';
import { ProjectStateService } from '../../../../shared/services/project-state.service';
import { ToastService } from '../../../../shared/services/toast.service';
import { SprintPlanningViewComponent } from './sprint-planning-view.component';

const makeStory = (id: string, hours: number): UserStoryDto => ({
  id,
  projectId: 'project-1',
  title: id,
  priority: 'Medium',
  status: 'New',
  tasks: hours > 0
    ? [{
        id: `task-${id}`,
        userStoryId: id,
        title: 'Task',
        estimatedHours: hours,
        effortSize: 'Small',
        type: 'Feature',
        priority: 'Medium',
        status: 'ToDo',
      }]
    : [],
});

describe('SprintPlanningViewComponent hours calculation', () => {
  function createComponent(): SprintPlanningViewComponent {
    TestBed.configureTestingModule({
      providers: [
        { provide: SprintPlanningService, useValue: {} },
        { provide: BacklogService, useValue: {} },
        {
          provide: ProjectStateService,
          useValue: {
            selectedProjectId: signal<string | null>(null),
            projectEmployeeCount: signal(0),
          },
        },
        { provide: ToastService, useValue: { show: () => undefined } },
        { provide: Router, useValue: { navigate: () => Promise.resolve(true) } },
        { provide: ActivatedRoute, useValue: { queryParams: of({}) } },
      ],
    });

    return TestBed.runInInjectionContext(() => new SprintPlanningViewComponent());
  }

  function setCard(component: SprintPlanningViewComponent, removedStoryIds: string[] = []) {
    component.sprintCards.set([{
      sprint: {
        sprintNumber: 1,
        sprintTitle: 'Sprint 1',
        titleEn: 'Sprint 1',
        titleAr: 'Sprint 1',
        sprintGoalEn: '',
        sprintGoalAr: '',
        goalEn: '',
        goalAr: '',
        capacityExplanation: '',
        userStoryIds: ['one', 'two'],
      },
      removedStoryIds: new Set(removedStoryIds),
      totalHours: 0,
      visibleStories: [],
    }]);

    return component.sprintCards()[0];
  }

  it('returns zero when all stories are removed instead of the original API total', () => {
    const component = createComponent();
    component.apiTotalHours.set(63);
    const card = setCard(component, ['one', 'two']);

    expect(component.calcHours(card)).toBe(0);
  });

  it('recalculates a reduced scope from per-story suggestion hours', () => {
    const component = createComponent();
    component.apiTotalHours.set(63);
    component.suggestedStoriesMeta.set(new Map([
      ['one', { reason: '', priorityScore: 1, estimatedHours: 20 }],
      ['two', { reason: '', priorityScore: 1, estimatedHours: 43 }],
    ]));
    const card = setCard(component, ['two']);

    expect(component.calcHours(card)).toBe(20);
  });

  it('uses task estimates for visible backlog stories', () => {
    const component = createComponent();
    component.apiTotalHours.set(63);
    component.storiesMap.set(new Map([
      ['one', makeStory('one', 8)],
      ['two', makeStory('two', 13)],
    ]));
    const card = setCard(component, ['two']);

    expect(component.calcHours(card)).toBe(8);
  });
});
