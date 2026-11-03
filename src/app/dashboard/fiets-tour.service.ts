import { Injectable } from '@angular/core';
import { backButton, BaseTourService, cancelButton, finishButton, NdwStepOptions, nextButton } from '@ndwnu/design-system';

/**
 * Rondleiding door de fietsdata-verkenner, met de guided tour van het ontwerpsysteem (Shepherd).
 * Start één keer vanzelf; daarna alleen via de knop "Rondleiding starten" in het paneel.
 */
@Injectable({ providedIn: 'root' })
export class FietsTourService extends BaseTourService {
  protected storageKey = 'ndw-fietsdata-tour:v1';

  /** Wordt door de pagina gezet: kiest een voorbeeldwegvak en wacht tot de kaart er is. */
  prepare: () => Promise<void> = async () => {};

  protected getTourSteps(): NdwStepOptions[] {
    return [
      {
        id: 'wegvak',
        title: 'Klik een wegvak aan',
        text: 'Alle wegvakken in Nederland zijn klikbaar. Voor deze rondleiding hebben we alvast een wegvak voor u gekozen; het is lichtblauw.',
        attachTo: { element: '.tour-anchor', on: 'top' },
        beforeShowPromise: () => this.prepare(),
        buttons: [cancelButton, nextButton],
      },
      {
        id: 'cijfers',
        title: 'Zie de cijfers',
        text: 'Hier staan het aantal fietsers, de snelheid en de verdeling over beide richtingen, met grafieken per uur. Klik op een staaf om het uur te wijzigen.',
        attachTo: { element: 'aside.panel', on: 'left' },
        buttons: [backButton, nextButton],
      },
      {
        id: 'filters',
        title: 'Kies datum, tijd en richting',
        text: 'Elk onderdeel opent een paneel. De cijfers en grafieken passen zich direct aan. Richting A is heen, richting B is terug.',
        attachTo: { element: 'app-fiets-filterbar .pill', on: 'bottom' },
        buttons: [backButton, nextButton],
      },
      {
        id: 'zoeken',
        title: 'Of zoek een straat of plaats',
        text: 'Typ een straat, plaats of NWB-nummer. De kaart gaat er direct naartoe en kiest het wegvak.',
        attachTo: { element: '.map-search', on: 'bottom' },
        buttons: [backButton, finishButton],
      },
    ];
  }
}
