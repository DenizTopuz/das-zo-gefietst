import { afterNextRender, ChangeDetectionStrategy, Component, computed, effect, HostListener, inject, Injector, signal, untracked } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, CanDeactivateFn, Router } from '@angular/router';
import { AlertComponent, ButtonDirective, FormFieldComponent, IconComponent, InputDirective, PillComponent, SwitcherComponent, SwitcherOption, ToastService } from '@ndwnu/design-system';
import { MapViewChange, NdwMapComponent } from '../../map/ndw-map.component';
import { Locatierecord, LOCATIERECORDS, LOCATIE_TYPEN, pointFeatures, RICHTINGEN } from '../data/lab-data';
import { FIELD_LABEL, Finding, LocatieDraft, LocatieField, validateLocatie, withStatus } from '../data/locatie-validation';
import { bindUrlState, hostWidth, LabStore } from '../lab-store';
import { LabDialogs } from '../shared/dialogs';
import { EditorActionsComponent } from '../shared/editor-actions.component';
import { ScopeToolbarComponent } from '../shared/scope-toolbar.component';
import { ScreenHeaderComponent } from '../shared/screen-header.component';
import { statusColor } from '../shared/status';
import { StatusMessageComponent } from '../shared/status-message.component';

const NARROW = 760;
/** Validation list (320) + form (≥ 560) + a usable map (≥ 400) side by side. */
const THREE_COLUMNS = 320 + 560 + 400 + 3 * 16 + 32;

const EMPTY: LocatieDraft = { title: '', type: '', location: '', direction: '', latitude: '', longitude: '' };
const toDraft = (r: LocatieDraft): LocatieDraft => ({ title: r.title, type: r.type, location: r.location, direction: r.direction, latitude: r.latitude, longitude: r.longitude });
const sameDraft = (a: LocatieDraft, b: LocatieDraft) => (Object.keys(a) as (keyof LocatieDraft)[]).every((k) => a[k] === b[k]);

type Plane = 'formulier' | 'validatie' | 'kaart';

/** T4 · Bewerken + context: een ruime editor met zichtbare validatie, een recordlijst en een kaart als contextvlak. */
@Component({
  selector: 'app-t4',
  imports: [
    AlertComponent, ButtonDirective, EditorActionsComponent, FormFieldComponent, IconComponent, InputDirective, NdwMapComponent, PillComponent,
    ScopeToolbarComponent, ScreenHeaderComponent, StatusMessageComponent, SwitcherComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './t4.page.html',
  styleUrl: './t4.page.scss',
})
export class T4Page {
  readonly #store = inject(LabStore);
  readonly #dialogs = inject(LabDialogs);
  readonly #router = inject(Router);
  readonly #route = inject(ActivatedRoute);
  readonly #toast = inject(ToastService);
  readonly #injector = inject(Injector);
  protected readonly state = this.#store.state('t4');
  protected readonly width = hostWidth();

  protected readonly records = signal<Locatierecord[]>(withStatus(LOCATIERECORDS));
  protected readonly currentId = signal<string>('');
  protected readonly draft = signal<LocatieDraft>({ ...EMPTY });
  protected readonly touched = signal<ReadonlySet<LocatieField>>(new Set());
  protected readonly submitted = signal(false);
  protected readonly savedAt = signal('');
  protected readonly pickOnMap = signal(false);
  protected readonly plane = signal<Plane>('formulier');
  protected readonly search = this.state.search;

  protected readonly types = LOCATIE_TYPEN;
  protected readonly directions = RICHTINGEN;
  protected readonly color = statusColor;
  protected readonly planeOptions: SwitcherOption[] = [
    { value: 'formulier', label: 'Formulier', icon: 'edit_note' },
    { value: 'validatie', label: 'Validatie', icon: 'rule' },
    { value: 'kaart', label: 'Kaart', icon: 'map' },
  ];

  protected readonly isNew = computed(() => this.currentId() === 'nieuw');
  protected readonly saved = computed<LocatieDraft>(() => {
    const r = this.records().find((x) => x.id === this.currentId());
    return r ? toDraft(r) : { ...EMPTY };
  });
  protected readonly dirty = computed(() => !sameDraft(this.draft(), this.saved()));
  protected readonly findings = computed<Finding[]>(() => validateLocatie(this.draft()));
  protected readonly errors = computed(() => this.findings().filter((f) => f.severity === 'Fout'));
  /** Findings of this record that must be shown as errors in the form. */
  protected readonly shown = computed(() => this.findings().filter((f) => this.submitted() || this.touched().has(f.field)));

  protected readonly narrow = computed(() => this.width() < NARROW);
  protected readonly layout = computed<'narrow' | 'two' | 'three'>(() => (this.narrow() ? 'narrow' : this.width() >= THREE_COLUMNS ? 'three' : 'two'));
  protected readonly showMap = computed(() => this.state.withMap());

  protected readonly recordList = computed(() => {
    const q = this.state.search().trim().toLowerCase();
    return this.records().filter((r) => !q || `${r.id} ${r.title} ${r.status} ${validateLocatie(r).map((f) => f.message).join(' ')}`.toLowerCase().includes(q));
  });
  protected readonly features = computed(() => {
    const draft = this.draft();
    const lat = Number(draft.latitude.replace(',', '.'));
    const lng = Number(draft.longitude.replace(',', '.'));
    const current = this.currentId();
    const list = this.records().map((r) => (r.id === current && Number.isFinite(lat) && Number.isFinite(lng) && draft.latitude && draft.longitude ? { ...r, coordinates: [lng, lat] as [number, number] } : r));
    return pointFeatures(this.state.demo() === 'normaal' || this.state.demo() === 'live' ? list : [], 'locatie');
  });
  protected readonly statusKind = computed<'loading' | 'error' | 'no-data' | null>(() => {
    switch (this.state.demo()) {
      case 'laden':
        return 'loading';
      case 'fout':
        return 'error';
      case 'geen-data':
        return 'no-data';
    }
    return null;
  });
  protected readonly currentTitle = computed(() => (this.isNew() ? 'Nieuw record' : `Record ${this.currentId()}`));

  readonly #urlId = toSignal(this.#route.queryParamMap, { initialValue: this.#route.snapshot.queryParamMap });

  constructor() {
    bindUrlState('t4', ['kaart']);

    // URL → record. A deep link, browser-back or a link from T5 can change the record; unsaved work is protected.
    effect(() => {
      const wanted = this.#urlId().get('id');
      untracked(() => void this.applyUrlRecord(wanted));
    });

    effect(() => {
      const dirty = this.dirty();
      untracked(() => this.state.dirty.set(dirty));
    });
  }

  // ───────────── record switching with protection of unsaved work ─────────────

  private async applyUrlRecord(wanted: string | null) {
    const current = this.currentId();
    const known = wanted === 'nieuw' || this.records().some((r) => r.id === wanted);
    if (!current && !known) {
      // First visit without a valid id: continue with the record that needs attention.
      const first = this.state.selectedId() && this.records().some((r) => r.id === this.state.selectedId()) ? this.state.selectedId()! : (this.records().find((r) => r.status !== 'Geldig') ?? this.records()[0]).id;
      this.setCurrent(first);
      void this.#router.navigate([], { relativeTo: this.#route, queryParams: { id: first }, queryParamsHandling: 'merge', replaceUrl: true });
      return;
    }
    if (!known || wanted === current) return;
    if (this.dirty() && !(await this.confirmLeave())) {
      void this.#router.navigate([], { relativeTo: this.#route, queryParams: { id: current }, queryParamsHandling: 'merge', replaceUrl: true });
      return;
    }
    this.setCurrent(wanted!);
  }

  private setCurrent(id: string) {
    this.currentId.set(id);
    this.state.selectedId.set(id === 'nieuw' ? null : id);
    this.draft.set({ ...this.saved() });
    this.touched.set(new Set());
    this.submitted.set(false);
    this.savedAt.set('');
    this.pickOnMap.set(false);
  }

  /** Ask what to do with unsaved changes. Resolves `true` when leaving/switching may continue. */
  async confirmLeave(): Promise<boolean> {
    if (!this.dirty()) return true;
    const choice = await this.#dialogs.confirm({
      title: 'Niet-opgeslagen wijzigingen',
      message: `Je hebt wijzigingen in ${this.isNew() ? 'het nieuwe record' : `record ${this.currentId()}`} die nog niet zijn opgeslagen. Wat wil je doen?`,
      actions: [
        { label: 'Opslaan en doorgaan', value: 'save', primary: true },
        { label: 'Wijzigingen verwerpen', value: 'discard' },
        { label: 'Blijven bewerken', value: 'stay' },
      ],
    });
    if (choice === 'discard') {
      this.draft.set({ ...this.saved() });
      return true;
    }
    if (choice === 'save') return this.save();
    return false;
  }

  @HostListener('window:beforeunload', ['$event'])
  protected onBeforeUnload(event: BeforeUnloadEvent) {
    if (this.dirty()) event.preventDefault();
  }

  protected async open(id: string) {
    if (id === this.currentId()) return;
    if (!(await this.confirmLeave())) return;
    void this.#router.navigate([], { relativeTo: this.#route, queryParams: { id }, queryParamsHandling: 'merge' });
  }

  // ───────────── editing ─────────────

  protected set(field: LocatieField, value: string) {
    this.draft.update((d) => ({ ...d, [field]: value }));
  }

  protected touch(field: LocatieField) {
    this.touched.update((t) => new Set(t).add(field));
  }

  protected errorFor(field: LocatieField): string {
    return this.shown().find((f) => f.field === field)?.message ?? '';
  }

  protected label(field: LocatieField) {
    return FIELD_LABEL[field];
  }

  /** Move focus to the field a finding refers to. */
  protected goTo(field: LocatieField) {
    document.querySelector<HTMLElement>(`[data-field="${field}"]`)?.focus();
    if (this.narrow()) this.plane.set('formulier');
  }

  protected save(): boolean {
    this.submitted.set(true);
    if (this.errors().length) {
      afterNextRender(() => document.getElementById('t4-summary')?.focus(), { injector: this.#injector });
      if (this.narrow()) this.plane.set('formulier');
      return false;
    }
    const now = new Date();
    const draft = this.draft();
    let id = this.currentId();
    if (this.isNew()) {
      id = `VILD-${32198 + this.records().filter((r) => !LOCATIERECORDS.some((l) => l.id === r.id)).length}`;
      const coordinates: [number, number] = [Number(draft.longitude.replace(',', '.')), Number(draft.latitude.replace(',', '.'))];
      this.records.update((list) => [{ ...LOCATIERECORDS[0], ...draft, id, status: 'Geldig', updatedAt: now, coordinates, area: 'Utrecht', owner: 'Wegbeheerder', description: '' }, ...list]);
    } else {
      this.records.update((list) =>
        withStatus(list.map((r) => (r.id === id ? { ...r, ...draft, updatedAt: now, coordinates: [Number(draft.longitude.replace(',', '.')) || r.coordinates[0], Number(draft.latitude.replace(',', '.')) || r.coordinates[1]] } : r))),
      );
    }
    this.currentId.set(id);
    this.savedAt.set(now.toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' }));
    this.submitted.set(false);
    this.touched.set(new Set());
    this.draft.set({ ...this.saved() });
    this.#toast.open(`${id} is opgeslagen.`);
    if (this.#urlId().get('id') !== id) void this.#router.navigate([], { relativeTo: this.#route, queryParams: { id }, queryParamsHandling: 'merge', replaceUrl: true });
    return true;
  }

  protected cancel() {
    this.draft.set({ ...this.saved() });
    this.touched.set(new Set());
    this.submitted.set(false);
    this.#toast.open('Wijzigingen verworpen.');
  }

  protected async newRecord() {
    await this.open('nieuw');
  }

  protected onMapClick(position: [number, number]) {
    if (!this.pickOnMap()) return;
    this.draft.update((d) => ({ ...d, longitude: position[0].toFixed(4), latitude: position[1].toFixed(4) }));
    this.touched.update((t) => new Set(t).add('latitude').add('longitude'));
    this.pickOnMap.set(false);
    this.#toast.open('Locatie gekozen op de kaart. Controleer de coördinaten.');
  }

  protected onMapView(_: MapViewChange) {}

  protected retry() {
    this.state.demo.set('laden');
    setTimeout(() => this.state.demo.set('normaal'), 700);
  }
}

/** Leaving T4 (another template, another page) asks what to do with unsaved changes first. */
export const t4LeaveGuard: CanDeactivateFn<T4Page> = (component) => component.confirmLeave();
