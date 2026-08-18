import { TestBed } from '@angular/core/testing';
import { UserStoryDto } from '../../../../shared/api/backlog.service';
import { SprintStoryPickerComponent } from './sprint-story-picker.component';

const makeStory = (id: string, title: string, hours: number): UserStoryDto => ({
  id,
  projectId: 'project-1',
  title,
  description: '',
  acceptanceCriteria: '',
  priority: 'Medium',
  status: 'New',
  tasks:
    hours > 0
      ? [
          {
            id: `task-${id}`,
            userStoryId: id,
            title: 'Task',
            estimatedHours: hours,
            effortSize: 'Small',
            type: 'Feature',
            priority: 'Medium',
            status: 'ToDo',
          },
        ]
      : [],
});

describe('SprintStoryPickerComponent', () => {
  it('excludes stories that are already selected', async () => {
    await TestBed.configureTestingModule({
      imports: [SprintStoryPickerComponent],
    }).compileComponents();
    const fixture = TestBed.createComponent(SprintStoryPickerComponent);
    fixture.componentRef.setInput('stories', [
      makeStory('one', 'One', 3),
      makeStory('two', 'Two', 5),
    ]);
    fixture.componentRef.setInput('selectedStoryIds', ['one']);
    fixture.detectChanges();

    expect(fixture.componentInstance.availableStories().map((story) => story.id)).toEqual(['two']);
  });

  it('calculates the hours added by the selected stories', async () => {
    await TestBed.configureTestingModule({
      imports: [SprintStoryPickerComponent],
    }).compileComponents();
    const fixture = TestBed.createComponent(SprintStoryPickerComponent);
    fixture.componentRef.setInput('stories', [
      makeStory('one', 'One', 3),
      makeStory('two', 'Two', 5),
    ]);
    fixture.detectChanges();

    fixture.componentInstance.toggle('one');
    fixture.componentInstance.toggle('two');

    expect(fixture.componentInstance.chosenHours()).toBe(8);
  });

  it('emits the selected story IDs', async () => {
    await TestBed.configureTestingModule({
      imports: [SprintStoryPickerComponent],
    }).compileComponents();
    const fixture = TestBed.createComponent(SprintStoryPickerComponent);
    fixture.componentRef.setInput('stories', [makeStory('one', 'One', 3)]);
    fixture.detectChanges();
    const emitted: string[][] = [];
    fixture.componentInstance.storiesAdded.subscribe((ids) => emitted.push(ids));

    fixture.componentInstance.toggle('one');
    fixture.componentInstance.addSelected();

    expect(emitted).toEqual([['one']]);
  });
});
