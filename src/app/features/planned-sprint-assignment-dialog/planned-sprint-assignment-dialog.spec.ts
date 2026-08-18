import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideTranslateService } from '@ngx-translate/core';

import { PlannedSprintAssignmentDialogComponent } from './planned-sprint-assignment-dialog';

describe('PlannedSprintAssignmentDialog', () => {
  let component: PlannedSprintAssignmentDialogComponent;
  let fixture: ComponentFixture<PlannedSprintAssignmentDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PlannedSprintAssignmentDialogComponent],
      providers: [provideTranslateService(), provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(PlannedSprintAssignmentDialogComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
