import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../shared/api/auth.service';
import { isProfileCompleted } from '../../shared/lib/auth/cookie.helper';
import { getRedirectForRole } from '../../shared/lib/auth/role-redirect';

@Component({
  selector: 'app-not-found',
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main class="route-surface grid min-h-screen place-items-center px-5 py-12">
      <section class="ui-card relative w-full max-w-xl overflow-hidden p-8 text-center sm:p-12">
        <div class="pointer-events-none absolute -right-20 -top-24 h-56 w-56 rounded-full bg-primary/10 blur-3xl"></div>
        <div class="relative">
          <div class="mx-auto grid h-14 w-14 place-items-center rounded-2xl border border-primary/20 bg-primary-soft text-primary">
            <svg class="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M9.5 9a2.75 2.75 0 1 1 4.7 1.95c-1.17 1.15-2.2 1.62-2.2 3.05M12 18h.01" stroke-linecap="round"/></svg>
          </div>
          <p class="mt-6 text-xs font-extrabold uppercase tracking-[.18em] text-primary">404 · Page not found</p>
          <h1 class="mt-3 text-3xl font-extrabold tracking-tight text-text-primary">This page is off the board</h1>
          <p class="mx-auto mt-3 max-w-md text-sm leading-6 text-text-secondary">The link may be outdated or the page may have moved. Your workspace and project data are safe.</p>
          <a [routerLink]="homeLink" class="ui-button-primary mt-7 inline-flex items-center justify-center px-6">Back to TaskPilot</a>
        </div>
      </section>
    </main>
  `
})
export class NotFoundComponent {
  private readonly auth = inject(AuthService);
  readonly homeLink = this.auth.isLoggedIn()
    ? getRedirectForRole(this.auth.getUserRole(), isProfileCompleted())
    : '/';
}
