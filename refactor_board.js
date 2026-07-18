const fs = require('fs');

const boardFile = 'src/app/widgets/taskBoard/ui/board/board.component.ts';
let lines = fs.readFileSync(boardFile, 'utf8').split('\n');

const classIdx = lines.findIndex(l => l.includes('export class BoardComponent'));

// 1. Remove @Input and @Output
const toRemove = ['@Input() overrideSprintId', '@Input() overrideSprintStatus', '@Output() backToSprints', '@Output() sprintStatusChanged'];

for (let i = classIdx; i < lines.length; i++) {
    for (const token of toRemove) {
        if (lines[i].includes(token)) {
            lines[i] = '';
        }
    }
}

// 2. Add Route injection and update ngOnInit / ngOnChanges
const onChangesIdx = lines.findIndex(l => l.includes('ngOnChanges('));
const onChangesEnd = lines.findIndex((l, i) => i > onChangesIdx && l.includes('}'));
if (onChangesIdx !== -1 && onChangesEnd !== -1) {
    // Delete ngOnChanges
    for (let i = onChangesIdx; i <= onChangesEnd; i++) {
        lines[i] = '';
    }
}

const initIdx = lines.findIndex(l => l.includes('async ngOnInit() {'));
if (initIdx !== -1) {
    // Replace ngOnInit with route subscription
    const newInit = `
  overrideSprintId: string | null = null;
  overrideSprintStatus: string | null = null;
  private route = inject(ActivatedRoute);

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      this.overrideSprintId = params['sprintId'] || null;
      this.overrideSprintStatus = params['status'] || null;
      this.sprintStatus.set(this.overrideSprintStatus);
      this.loadWorkspaceData();
    });
  }`;
    lines.splice(initIdx, 3, newInit);
}

// Update imports
const importIdx = lines.findIndex(l => l.includes('import { Component'));
if (importIdx !== -1) {
    // Remove OnChanges, Input, Output
    lines[importIdx] = lines[importIdx].replace('OnChanges, ', '').replace('Input, ', '').replace('Output, ', '').replace('EventEmitter, ', '').replace('SimpleChanges ', '');
}
const routerImportIdx = lines.findIndex(l => l.includes('import { Router }'));
if (routerImportIdx !== -1) {
    lines[routerImportIdx] = "import { Router, ActivatedRoute } from '@angular/router';";
} else {
    lines.splice(importIdx + 1, 0, "import { Router, ActivatedRoute } from '@angular/router';");
}


// Replace emitters
for (let i = 0; i < lines.length; i++) {
    if (lines[i]) {
        if (lines[i].includes('this.backToSprints.emit()')) {
            lines[i] = `    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { sprintId: null, status: null },
      queryParamsHandling: 'merge',
      replaceUrl: true
    });`;
        }
        if (lines[i].includes('this.sprintStatusChanged.emit()')) {
            lines[i] = `    this.loadWorkspaceData();`;
        }
    }
}

fs.writeFileSync(boardFile, lines.filter(l => l !== '').join('\n'));
