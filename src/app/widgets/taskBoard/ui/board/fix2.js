const fs = require('fs');
const file = 'c:/Users/peter/OneDrive/Desktop/Taskpilot/TaskPilot-Frontend/src/app/widgets/taskBoard/ui/board/board.component.ts';
let code = fs.readFileSync(file, 'utf8');

const brokenRegex = /'bg-primary\/10 text-primary': task\.priority === 'Low'[\s\S]*?\{\{ 'BOARD\.SHOW_MORE' \| translate: \{ count: remainingTasks\('todo'\) \} \}\}\r?\n\s*<\/button>/;

const replacement = `'bg-primary/10 text-primary': task.priority === 'Low'
                          }">
                      {{ ('BOARD.' + task.priority.toUpperCase()) | translate }}
                    </span>
                  </div>
                  <h4 class="font-bold text-text-primary text-[15px] mb-1" [attr.dir]="currentLang === 'ar' ? 'rtl' : 'ltr'">{{ getTaskTitle(task) }}</h4>
                  <p class="text-text-secondary text-xs line-clamp-2 mb-3" [attr.dir]="currentLang === 'ar' ? 'rtl' : 'ltr'">{{ getTaskDescription(task) }}</p>
                  <div class="flex items-center justify-between border-t border-border pt-3 mt-3">
                    <span class="text-xs text-text-secondary flex items-center gap-1">
                      <svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
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
                <div class="h-24 border border-dashed border-border rounded-xl flex items-center justify-center text-xs text-text-secondary">
                  {{ emptyColumnMessage('todo') }}
                </div>
              }
              @if (visibleTodo().length < filteredTodo().length) {
                <button type="button" (click)="showMore('todo')" class="w-full mt-3 py-2.5 rounded-xl border border-border bg-surface text-xs font-bold text-primary hover:bg-primary/5 transition-all">
                  {{ 'BOARD.SHOW_MORE' | translate: { count: remainingTasks('todo') } }}
                </button>`;

code = code.replace(brokenRegex, replacement);
fs.writeFileSync(file, code);
console.log('Fixed Todo');
