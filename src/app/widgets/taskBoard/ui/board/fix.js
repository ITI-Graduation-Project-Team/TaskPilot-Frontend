const fs = require('fs');
const file = 'c:/Users/peter/OneDrive/Desktop/Taskpilot/TaskPilot-Frontend/src/app/widgets/taskBoard/ui/board/board.component.ts';
let code = fs.readFileSync(file, 'utf8');

// Fix 1: Restore the ToDo column deleted block
const brokenBlock = `                      <svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {{ task.hours }}h
                    </span>
                <div class="h-24 border border-dashed border-border rounded-xl flex items-center justify-center text-xs text-text-secondary">`;

const restoredBlock = `                      <svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {{ task.hours }}h
                    </span>
                    <div class="flex items-center gap-3">
                      @if (task.permissions.canSummarize) {
                        <button (click)="openSummarizeChat(task)" class="text-xs text-primary font-semibold hover:underline flex items-center gap-1">
                          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                          {{ 'BOARD.SUMMARIZE' | translate }}
                        </button>
                      }
                      @if (task.permissions.canView) {
                        <button (click)="openEditModal(task)" class="text-xs text-primary font-semibold hover:underline">
                          {{ projectState.isProjectManager() && !isBoardReadonly() ? ('BOARD.EDIT' | translate) : ('BOARD.VIEW' | translate) }}
                        </button>
                      }
                    </div>
                  </div>
                </div>
              } @empty {
                <div class="h-24 border border-dashed border-border rounded-xl flex items-center justify-center text-xs text-text-secondary">`;

code = code.replace(brokenBlock, restoredBlock);

// Fix 2: Wrap unguarded openEditModal in InProgress, Review, and Done
// We will search for all unguarded ones
const unguardedPattern = /\s*<button \(click\)="openEditModal\(task\)" class="text-xs text-primary font-semibold hover:underline">\s*\{\{ projectState\.isProjectManager\(\)[^<]+<\/button>/g;

code = code.replace(unguardedPattern, (match) => {
    return `
                      @if (task.permissions.canView) {
                        <button (click)="openEditModal(task)" class="text-xs text-primary font-semibold hover:underline">
                          {{ projectState.isProjectManager() && !isBoardReadonly() ? ('BOARD.EDIT' | translate) : ('BOARD.VIEW' | translate) }}
                        </button>
                      }`;
});

fs.writeFileSync(file, code);
console.log('Fixed');
