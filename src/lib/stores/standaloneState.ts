import { derived, get, writable } from 'svelte/store';
import { DEFAULT_PAGE_SETTINGS, SAMPLE_ROWS } from '#lib/constants/sampleData';
import type {
  PageExportSettings,
  RelationshipField,
  RelationshipRow,
  StandaloneState,
  StandaloneUiState
} from '#lib/types';

let nextRowId = 1;

const initialUiState = (): StandaloneUiState => ({
  highlightedRowId: null,
  focusField: null,
  highlightPulse: 0,
  isExporting: false
});

const copyRows = (rows: RelationshipRow[]): RelationshipRow[] => rows.map((row) => ({ ...row }));

const createRow = (row: Partial<RelationshipRow>): RelationshipRow => ({
  id: row.id ?? `standalone-row-${nextRowId++}`,
  from: row.from ?? '',
  to: row.to ?? '',
  relation: row.relation ?? ''
});

export const standaloneRowsStore = writable<RelationshipRow[]>(copyRows(SAMPLE_ROWS));
export const standaloneHiddenPeopleStore = writable<string[]>([]);
export const standaloneHiddenEdgesStore = writable<string[]>([]);
export const standaloneSettingsStore = writable<PageExportSettings>({
  ...DEFAULT_PAGE_SETTINGS
});
export const standaloneKnownNamesStore = derived(standaloneRowsStore, ($rows) =>
  [...new Set($rows.flatMap((row) => [row.from, row.to]).filter(Boolean))].sort((a, b) =>
    a.localeCompare(b)
  )
);
export const standaloneUiStore = writable<StandaloneUiState>(initialUiState());

export function addStandaloneRow(row: Partial<RelationshipRow> = {}): string {
  const newRow = createRow(row);
  standaloneRowsStore.update((rows) => [...rows, newRow]);
  return newRow.id;
}

export function importStandaloneRows(rows: Array<Omit<RelationshipRow, 'id'>>): void {
  standaloneRowsStore.update((currentRows) => [...currentRows, ...rows.map(createRow)]);
}

export function updateStandaloneRow(
  id: string,
  patch: Partial<Omit<RelationshipRow, 'id'>>
): void {
  standaloneRowsStore.update((rows) =>
    rows.map((row) => (row.id === id ? { ...row, ...patch, id } : row))
  );
}

export function removeStandaloneRow(id: string): void {
  standaloneRowsStore.update((rows) => rows.filter((row) => row.id !== id));
  standaloneHiddenEdgesStore.update((rowIds) => rowIds.filter((rowId) => rowId !== id));
  standaloneUiStore.update((state) =>
    state.highlightedRowId === id
      ? { ...state, highlightedRowId: null, focusField: null }
      : state
  );
}

export function toggleStandalonePersonHidden(name: string): void {
  standaloneHiddenPeopleStore.update((names) =>
    names.includes(name) ? names.filter((hiddenName) => hiddenName !== name) : [...names, name]
  );
}

export function toggleStandaloneEdgeHidden(rowId: string): void {
  standaloneHiddenEdgesStore.update((rowIds) =>
    rowIds.includes(rowId) ? rowIds.filter((id) => id !== rowId) : [...rowIds, rowId]
  );
}

export function updateStandaloneSettings(patch: Partial<PageExportSettings>): void {
  standaloneSettingsStore.update((settings) => ({ ...settings, ...patch }));
}

export function resetStandaloneSettings(): void {
  standaloneSettingsStore.set({ ...DEFAULT_PAGE_SETTINGS });
}

export function hydrateStandaloneState(state: StandaloneState): void {
  standaloneRowsStore.set(copyRows(state.rows));
  standaloneHiddenPeopleStore.set([...state.hiddenPeople]);
  standaloneHiddenEdgesStore.set([...state.hiddenEdgeRowIds]);
  standaloneSettingsStore.set({ ...state.settings });
  standaloneUiStore.set(initialUiState());
}

export function highlightStandaloneRowById(
  id: string | null,
  focusField: RelationshipField | null = 'relation'
): void {
  standaloneUiStore.update((state) => ({
    ...state,
    highlightedRowId: id,
    focusField,
    highlightPulse: state.highlightPulse + 1
  }));
}

export function highlightStandaloneFirstRowForPerson(name: string): void {
  const row = get(standaloneRowsStore).find(({ from, to }) => from === name || to === name);
  highlightStandaloneRowById(row?.id ?? null, row ? (row.from === name ? 'from' : 'to') : null);
}

export function setStandaloneExporting(isExporting: boolean): void {
  standaloneUiStore.update((state) => ({ ...state, isExporting }));
}
