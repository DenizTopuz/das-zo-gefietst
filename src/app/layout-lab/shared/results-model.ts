import { computed, Signal } from '@angular/core';
import { LabRecord } from '../data/lab-data';
import { filterCount, TemplateState } from '../lab-store';

const text = (r: LabRecord) => `${r.id} ${r.title} ${r.type} ${r.status} ${r.location} ${r.owner}`.toLowerCase();

function compareBy(key: string, a: LabRecord, b: LabRecord): number {
  switch (key) {
    case 'updatedAt':
      return a.updatedAt.getTime() - b.updatedAt.getTime();
    case 'title':
      return a.id.localeCompare(b.id, 'nl', { numeric: true });
    default: {
      const left = String((a as unknown as Record<string, unknown>)[key] ?? '');
      const right = String((b as unknown as Record<string, unknown>)[key] ?? '');
      return left.localeCompare(right, 'nl', { numeric: true });
    }
  }
}

/**
 * One result set for the map, the list/table and the counts: the same records, filtered and sorted
 * by the template's state. A filter that no longer matches simply drops the record everywhere.
 */
export function createResults<T extends LabRecord>(records: Signal<readonly T[]>, state: TemplateState) {
  const filtered = computed(() => {
    const q = state.search().trim().toLowerCase();
    const f = state.filters();
    const bounds = f.inView ? state.mapBounds() : null;
    const { key, dir } = state.sort();
    return records()
      .filter(
        (r) =>
          (!q || text(r).includes(q)) &&
          (!f.status.length || f.status.includes(r.status)) &&
          (!f.type.length || f.type.includes(r.type)) &&
          (!bounds || (r.coordinates[0] >= bounds[0] && r.coordinates[0] <= bounds[2] && r.coordinates[1] >= bounds[1] && r.coordinates[1] <= bounds[3])),
      )
      .sort((a, b) => (dir === 'asc' ? 1 : -1) * compareBy(key, a, b));
  });

  return {
    filtered,
    total: computed(() => records().length),
    activeFilterCount: computed(() => filterCount(state.filters())),
    hasQuery: computed(() => state.search().trim().length > 0 || filterCount(state.filters()) > 0),
    selected: computed(() => records().find((r) => r.id === state.selectedId())),
  };
}
