import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, inject, Injectable, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { ButtonDirective, CardContentComponent, CardFooterComponent, ModalComponent, ModalHeaderComponent, ModalService } from '@ndwnu/design-system';
import { Filters } from '../lab-store';
import { FilterGroup, FilterPanelComponent } from './filter-panel.component';

// ───────────── Alle filters in a dialog (narrow screens) ─────────────

export interface FilterDialogData {
  groups: readonly FilterGroup[];
  filters: Filters;
  inViewAvailable: boolean;
}

@Component({
  selector: 'app-filter-dialog',
  imports: [ButtonDirective, CardContentComponent, CardFooterComponent, FilterPanelComponent, ModalComponent, ModalHeaderComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ndw-modal size="sm" role="dialog" aria-label="Alle filters">
      <ndw-modal-header>Alle filters</ndw-modal-header>
      <ndw-card-content>
        <app-filter-panel mode="dialog" [groups]="data.groups" [filters]="draft()" [inViewAvailable]="data.inViewAvailable" (filtersChange)="draft.set($event)" />
      </ndw-card-content>
      <ndw-card-footer>
        <button ndwButton secondary type="button" (click)="ref.close()">Annuleren</button>
        <button ndwButton type="button" (click)="ref.close(draft())">Toepassen</button>
      </ndw-card-footer>
    </ndw-modal>
  `,
})
export class FilterDialogComponent {
  protected readonly data = inject<FilterDialogData>(DIALOG_DATA);
  protected readonly ref = inject<DialogRef<Filters | undefined>>(DialogRef);
  /** Edits stay a draft until "Toepassen"; "Annuleren" leaves the applied filters untouched. */
  protected readonly draft = signal<Filters>(this.data.filters);
}

// ───────────── Confirmation with several choices (unsaved changes) ─────────────

export interface ConfirmAction {
  label: string;
  value: string;
  primary?: boolean;
}

export interface ConfirmData {
  title: string;
  message: string;
  actions: readonly ConfirmAction[];
}

@Component({
  selector: 'app-confirm-dialog',
  imports: [ButtonDirective, CardContentComponent, CardFooterComponent, ModalComponent, ModalHeaderComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ndw-modal size="sm" role="alertdialog" [attr.aria-label]="data.title">
      <ndw-modal-header>{{ data.title }}</ndw-modal-header>
      <ndw-card-content>
        <p class="ndw-paragraph-lg">{{ data.message }}</p>
      </ndw-card-content>
      <ndw-card-footer>
        @for (action of data.actions; track action.value) {
          <button ndwButton [attr.secondary]="action.primary ? null : ''" type="button" (click)="ref.close(action.value)">{{ action.label }}</button>
        }
      </ndw-card-footer>
    </ndw-modal>
  `,
})
export class ConfirmDialogComponent {
  protected readonly data = inject<ConfirmData>(DIALOG_DATA);
  protected readonly ref = inject<DialogRef<string | undefined>>(DialogRef);
}

@Injectable({ providedIn: 'root' })
export class LabDialogs {
  readonly #modal = inject(ModalService);

  /** Resolves with the applied filters, or `undefined` when cancelled. */
  async filters(data: FilterDialogData): Promise<Filters | undefined> {
    const ref = this.#modal.open(FilterDialogComponent, { data, ariaModal: true, restoreFocus: true }) as DialogRef<Filters | undefined>;
    return firstValueFrom(ref.closed) as Promise<Filters | undefined>;
  }

  /** Resolves with the chosen action value, or `undefined` when dismissed (Escape). */
  async confirm(data: ConfirmData): Promise<string | undefined> {
    const ref = this.#modal.open(ConfirmDialogComponent, { data, ariaModal: true, restoreFocus: true, role: 'alertdialog' }) as DialogRef<string | undefined>;
    return firstValueFrom(ref.closed) as Promise<string | undefined>;
  }
}
