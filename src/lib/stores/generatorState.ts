import { derived, get, writable } from 'svelte/store';
import { DEFAULT_CONFIG, SAMPLE_ROWS } from '#lib/constants/sampleData';
import type {
  GeneratorUiState,
  GraphConfig,
  RelationshipField,
  RelationshipRow
} from '#lib/types';

let nextRowId = 1;
let usesDefaultGraphCount = true;

export const getDefaultGraphCount = (rowCount: number): number =>
  Math.min(20, Math.max(1, Math.ceil(rowCount / 20)));

const initialUiState = (): GeneratorUiState => ({
  selectedGraphIndex: 0,
  isViewingAll: false,
  highlightedRowId: null,
  focusField: null,
  highlightPulse: 0,
  isExporting: false
});

const copyRows = (rows: RelationshipRow[]): RelationshipRow[] => rows.map((row) => ({ ...row }));

const createRow = (row: Partial<RelationshipRow>): RelationshipRow => ({
  id: row.id ?? `row-${nextRowId++}`,
  from: row.from ?? '',
  to: row.to ?? '',
  relation: row.relation ?? ''
});

export const generatorRowsStore = writable<RelationshipRow[]>(copyRows(SAMPLE_ROWS));
export const generatorConfigStore = writable<GraphConfig>({ ...DEFAULT_CONFIG });
export const generatorKnownNamesStore = derived(generatorRowsStore, ($rows) =>
  [...new Set($rows.flatMap((row) => [row.from, row.to]).filter(Boolean))].sort((a, b) =>
    a.localeCompare(b)
  )
);
export const generatorUiStore = writable<GeneratorUiState>(initialUiState());

generatorRowsStore.subscribe((rows) => {
  if (!usesDefaultGraphCount) return;
  const graphCount = getDefaultGraphCount(rows.length);
  generatorConfigStore.update((config) =>
    config.graphCount === graphCount ? config : { ...config, graphCount }
  );
});

generatorConfigStore.subscribe(({ graphCount }) => {
  generatorUiStore.update((state) =>
    state.selectedGraphIndex >= graphCount ? { ...state, selectedGraphIndex: 0 } : state
  );
});

export function addGeneratorRow(row: Partial<RelationshipRow> = {}): string {
  const newRow = createRow(row);
  generatorRowsStore.update((rows) => [...rows, newRow]);
  return newRow.id;
}

export function updateGeneratorRow(
  id: string,
  patch: Partial<Omit<RelationshipRow, 'id'>>
): void {
  generatorRowsStore.update((rows) =>
    rows.map((row) => (row.id === id ? { ...row, ...patch, id } : row))
  );
}

export function removeGeneratorRow(id: string): void {
  generatorRowsStore.update((rows) => rows.filter((row) => row.id !== id));
  generatorUiStore.update((state) =>
    state.highlightedRowId === id
      ? { ...state, highlightedRowId: null, focusField: null }
      : state
  );
}

export function setGeneratorRows(rows: RelationshipRow[]): void {
  generatorRowsStore.set(copyRows(rows));
}

export function importGeneratorRows(rows: Array<Omit<RelationshipRow, 'id'>>): void {
  generatorRowsStore.update((currentRows) => [...currentRows, ...rows.map(createRow)]);
}

export function updateGeneratorConfig(patch: Partial<GraphConfig>): void {
  if (patch.graphCount !== undefined) {
    usesDefaultGraphCount = false;
  }
  generatorConfigStore.update((config) => ({ ...config, ...patch }));
}

export function setGeneratorConfig(config: GraphConfig): void {
  usesDefaultGraphCount =
    config.graphCount === getDefaultGraphCount(get(generatorRowsStore).length);
  generatorConfigStore.set({ ...config });
}

export function reshuffleGeneratorSeed(): void {
  const seed = Math.floor(Math.random() * 0x100000000);
  updateGeneratorConfig({ seed });
}

export function selectGeneratorGraph(index: number): void {
  const { graphCount } = get(generatorConfigStore);
  const normalizedIndex = Number.isFinite(index) ? Math.max(0, Math.trunc(index)) : 0;
  generatorUiStore.update((state) => ({
    ...state,
    selectedGraphIndex: normalizedIndex >= graphCount ? 0 : normalizedIndex,
    isViewingAll: false
  }));
}

export function toggleGeneratorViewAll(): void {
  generatorUiStore.update((state) => ({ ...state, isViewingAll: !state.isViewingAll }));
}

export function highlightGeneratorRowById(
  id: string | null,
  focusField: RelationshipField | null = 'relation'
): void {
  generatorUiStore.update((state) => ({
    ...state,
    highlightedRowId: id,
    focusField,
    highlightPulse: state.highlightPulse + 1
  }));
}

export function highlightGeneratorFirstRowForPerson(name: string): void {
  const row = get(generatorRowsStore).find(({ from, to }) => from === name || to === name);
  highlightGeneratorRowById(row?.id ?? null, row ? (row.from === name ? 'from' : 'to') : null);
}

export function setGeneratorExporting(isExporting: boolean): void {
  generatorUiStore.update((state) => ({ ...state, isExporting }));
}
