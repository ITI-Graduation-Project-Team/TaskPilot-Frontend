import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PlannedSprintAssignmentDialog } from './planned-sprint-assignment-dialog';

describe('PlannedSprintAssignmentDialog', () => {
  let component: PlannedSprintAssignmentDialog;
  let fixture: ComponentFixture<PlannedSprintAssignmentDialog>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PlannedSprintAssignmentDialog],
    }).compileComponents();

    fixture = TestBed.createComponent(PlannedSprintAssignmentDialog);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
