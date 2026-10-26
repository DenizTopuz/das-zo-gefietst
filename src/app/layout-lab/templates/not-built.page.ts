import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { AlertComponent } from '@ndwnu/design-system';
import { map } from 'rxjs';
import { templateInfo } from '../lab-store';
import { ScreenHeaderComponent } from '../shared/screen-header.component';

/** Placeholder for templates that are specified but not built yet (see LAYOUT-LAB-STATUS.md). */
@Component({
  selector: 'app-not-built',
  imports: [AlertComponent, ScreenHeaderComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-screen-header [title]="info()?.name ?? 'Template'" />
    <div class="body">
      <ndw-alert type="info">
        <strong>{{ info()?.code }} is nog niet gebouwd.</strong> De indeling en het gedrag staan beschreven in ANALYSE.md en CLAUDE-CODE-BRIEF.md; zie LAYOUT-LAB-STATUS.md voor wat er nog moet gebeuren.
      </ndw-alert>
      <p class="ndw-paragraph-lg">{{ info()?.summary }}</p>
      <p class="ndw-paragraph-md">Gebruik dit template wanneer: {{ info()?.useWhen }}</p>
    </div>
  `,
  styles: `
    :host {
      display: block;
    }
    .body {
      display: flex;
      flex-direction: column;
      gap: var(--ndw-spacing-md);
      padding: var(--ndw-spacing-lg) var(--ndw-spacing-md);
      max-width: 48rem;
    }
    p {
      margin: 0;
    }
  `,
})
export class NotBuiltPage {
  readonly #id = toSignal(inject(ActivatedRoute).data.pipe(map((d) => d['template'] as string)), { initialValue: '' });
  protected readonly info = computed(() => templateInfo(this.#id()));
}
