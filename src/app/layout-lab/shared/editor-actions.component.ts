import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { ButtonDirective, IconComponent, PillComponent } from '@ndwnu/design-system';

/** Save / cancel with a clear edit status. The status is announced to assistive technology. */
@Component({
  selector: 'app-editor-actions',
  imports: [ButtonDirective, IconComponent, PillComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="actions">
      <button ndwButton type="submit"><ndw-icon>save</ndw-icon> Opslaan</button>
      <button ndwButton secondary type="button" (click)="cancel.emit()">Annuleren</button>
      <span class="status" role="status" aria-live="polite">
        @if (dirty()) {
          <ndw-pill color="yellow">Concept · niet opgeslagen</ndw-pill>
        } @else if (savedAt()) {
          <ndw-pill color="green">Opgeslagen om {{ savedAt() }}</ndw-pill>
        }
      </span>
    </div>
  `,
  styles: `
    .actions {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: var(--ndw-spacing-xs) var(--ndw-spacing-sm);
    }
    .status {
      margin-left: var(--ndw-spacing-xs);
    }
  `,
})
export class EditorActionsComponent {
  readonly dirty = input(false);
  readonly savedAt = input('');
  readonly cancel = output<void>();
}
