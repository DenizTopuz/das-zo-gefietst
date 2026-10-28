import { Injectable, signal, TemplateRef } from '@angular/core';

/**
 * Lets a page put its own controls in the right half of the app's top bar. The page registers an
 * `ng-template` while it is shown and clears it when it goes away.
 */
@Injectable({ providedIn: 'root' })
export class TopbarSlot {
  readonly template = signal<TemplateRef<unknown> | null>(null);
}
