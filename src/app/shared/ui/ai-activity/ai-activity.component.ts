import { ChangeDetectionStrategy, Component, input } from '@angular/core';

export type AiActivityStatus = 'pending' | 'active' | 'complete' | 'error';

export interface AiActivityPhase {
  id: string;
  label: string;
  status: AiActivityStatus;
}

@Component({
  selector: 'app-ai-activity',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
    <section class="ai-activity" role="status" aria-live="polite" aria-busy="true">
      <div class="ai-visual" aria-hidden="true">
        <span class="ai-orbit ai-orbit-one"></span>
        <span class="ai-orbit ai-orbit-two"></span>
        <span class="ai-core">
          <svg viewBox="0 0 24 24" fill="none">
            <path d="M12 3v3m0 12v3M3 12h3m12 0h3M5.64 5.64l2.12 2.12m8.48 8.48 2.12 2.12m0-12.72-2.12 2.12M7.76 16.24l-2.12 2.12" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
            <circle cx="12" cy="12" r="3.25" stroke="currentColor" stroke-width="1.8"/>
          </svg>
        </span>
      </div>

      <div class="ai-copy">
        <div class="ai-kicker"><span></span> TaskPilot AI is working</div>
        <h3>{{ title() }}</h3>
        @if (description()) { <p>{{ description() }}</p> }

        @if (phases().length) {
          <ol class="ai-phases" aria-label="Generation progress">
            @for (phase of phases(); track phase.id) {
              <li [class]="'phase-' + phase.status">
                <span class="phase-marker">
                  @if (phase.status === 'complete') {
                    <svg viewBox="0 0 20 20" fill="none"><path d="m5 10 3 3 7-7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
                  } @else if (phase.status === 'error') {
                    <span>!</span>
                  } @else {
                    <span></span>
                  }
                </span>
                <span class="phase-label">{{ phase.label }}</span>
              </li>
            }
          </ol>
        }
      </div>
    </section>
  `,
  styles: [`
    :host { width: 100%; }
    .ai-activity { position: relative; display: grid; grid-template-columns: 7rem minmax(0, 1fr); gap: 1.5rem; align-items: center; overflow: hidden; border: 1px solid color-mix(in srgb, var(--primary) 24%, var(--border)); border-radius: 1.25rem; padding: 1.5rem; background: linear-gradient(135deg, color-mix(in srgb, var(--primary-soft) 78%, var(--surface)), var(--surface) 62%); box-shadow: var(--shadow-sm); animation: activity-in var(--motion-dialog) var(--ease-emphasized) both; }
    .ai-activity::after { position: absolute; inset: 0; content: ''; pointer-events: none; background: linear-gradient(110deg, transparent 30%, color-mix(in srgb, var(--accent) 8%, transparent), transparent 68%); transform: translateX(-100%); animation: scan var(--motion-ai) ease-in-out infinite; }
    .ai-visual { position: relative; display: grid; width: 6.5rem; height: 6.5rem; place-items: center; }
    .ai-core { z-index: 2; display: grid; width: 3.5rem; height: 3.5rem; place-items: center; border: 1px solid color-mix(in srgb, var(--accent) 48%, var(--border)); border-radius: 1.1rem; color: var(--primary); background: var(--surface); box-shadow: 0 12px 32px color-mix(in srgb, var(--primary) 18%, transparent); animation: core 1.8s ease-in-out infinite; }
    .ai-core svg { width: 1.65rem; }
    .ai-orbit { position: absolute; border: 1px solid color-mix(in srgb, var(--primary) 25%, transparent); border-radius: 999px; }
    .ai-orbit-one { inset: .55rem; animation: orbit 7s linear infinite; }
    .ai-orbit-one::before, .ai-orbit-two::before { position: absolute; width: .5rem; height: .5rem; content: ''; border-radius: 50%; background: var(--accent); box-shadow: 0 0 14px color-mix(in srgb, var(--accent) 62%, transparent); }
    .ai-orbit-one::before { top: -.25rem; left: 50%; }
    .ai-orbit-two { inset: 1.35rem; animation: orbit 5s linear infinite reverse; }
    .ai-orbit-two::before { right: -.25rem; top: 50%; background: var(--primary); }
    .ai-copy { position: relative; z-index: 1; min-width: 0; }
    .ai-kicker { display: flex; gap: .45rem; align-items: center; color: var(--primary); font-size: .68rem; font-weight: 800; letter-spacing: .11em; text-transform: uppercase; }
    .ai-kicker span { width: .45rem; height: .45rem; border-radius: 50%; background: var(--accent); animation: blink 1.25s ease-in-out infinite; }
    h3 { margin: .4rem 0 0; color: var(--text-primary); font-size: 1.12rem; font-weight: 800; letter-spacing: -.02em; }
    p { max-width: 42rem; margin: .35rem 0 0; color: var(--text-secondary); font-size: .82rem; line-height: 1.55; }
    .ai-phases { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: .5rem; margin: 1.15rem 0 0; padding: 0; list-style: none; }
    .ai-phases li { position: relative; display: flex; gap: .5rem; align-items: center; min-width: 0; color: var(--text-secondary); font-size: .72rem; font-weight: 650; }
    .ai-phases li:not(:last-child)::after { position: absolute; right: .1rem; bottom: -.38rem; left: 1.85rem; height: 2px; content: ''; background: var(--border); }
    .phase-marker { display: grid; flex: 0 0 auto; width: 1.45rem; height: 1.45rem; place-items: center; border: 1px solid var(--border-strong); border-radius: 50%; background: var(--surface); }
    .phase-marker svg { width: .95rem; }
    .phase-marker > span:empty { width: .35rem; height: .35rem; border-radius: 50%; background: var(--border-strong); }
    .phase-active { color: var(--text-primary) !important; }
    .phase-active .phase-marker { border-color: var(--accent); box-shadow: 0 0 0 4px color-mix(in srgb, var(--accent) 13%, transparent); }
    .phase-active .phase-marker > span { background: var(--accent); animation: blink 1s ease-in-out infinite; }
    .phase-complete .phase-marker { border-color: var(--success); color: #fff; background: var(--success); animation: complete .3s var(--ease-emphasized) both; }
    .phase-complete { color: var(--text-primary) !important; }
    .phase-error .phase-marker { border-color: var(--error); color: #fff; background: var(--error); }
    @keyframes activity-in { from { opacity: 0; transform: translateY(10px) scale(.99); } to { opacity: 1; transform: none; } }
    @keyframes scan { 55%, 100% { transform: translateX(100%); } }
    @keyframes orbit { to { transform: rotate(360deg); } }
    @keyframes core { 50% { transform: translateY(-2px); box-shadow: 0 15px 38px color-mix(in srgb, var(--primary) 24%, transparent); } }
    @keyframes blink { 50% { opacity: .35; transform: scale(.75); } }
    @keyframes complete { from { transform: scale(.65); } to { transform: scale(1); } }
    @media (max-width: 720px) { .ai-activity { grid-template-columns: 1fr; gap: .5rem; padding: 1.25rem; } .ai-visual { width: 5rem; height: 5rem; margin: 0 auto; } .ai-orbit-one { inset: 0; } .ai-orbit-two { inset: .75rem; } .ai-phases { grid-template-columns: 1fr 1fr; gap: .75rem; } .ai-phases li::after { display: none; } }
    @media (prefers-reduced-motion: reduce) { .ai-activity::after, .ai-core, .ai-orbit, .ai-kicker span, .phase-active .phase-marker > span { animation: none; } }
  `]
})
export class AiActivityComponent {
  readonly title = input.required<string>();
  readonly description = input('');
  readonly phases = input<readonly AiActivityPhase[]>([]);
}
