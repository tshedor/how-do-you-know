import { beforeEach, describe, expect, it } from 'vitest';
import { get } from 'svelte/store';
import { DEFAULT_CONFIG, DEFAULT_PAGE_SETTINGS, SAMPLE_ROWS } from '#lib/constants/sampleData';
import {
  addGeneratorRow,
  generatorConfigStore,
  generatorKnownNamesStore,
  generatorRowsStore,
  generatorUiStore,
  highlightGeneratorFirstRowForPerson,
  importGeneratorRows,
  removeGeneratorRow,
  selectGeneratorGraph,
  setGeneratorConfig,
  setGeneratorRows,
  toggleGeneratorViewAll,
  updateGeneratorConfig,
  updateGeneratorRow
} from '#lib/stores/generatorState';
import {
  hydrateStandaloneState,
  highlightStandaloneRowById,
  importStandaloneRows,
  standaloneHiddenEdgesStore,
  standaloneHiddenPeopleStore,
  standaloneKnownNamesStore,
  standaloneRowsStore,
  standaloneSettingsStore,
  standaloneUiStore,
  toggleStandaloneEdgeHidden,
  toggleStandalonePersonHidden,
  updateStandaloneRow,
  updateStandaloneSettings
} from '#lib/stores/standaloneState';

describe('generator state', () => {
  beforeEach(() => {
    setGeneratorRows(SAMPLE_ROWS);
    setGeneratorConfig({ ...DEFAULT_CONFIG });
    generatorUiStore.set({
      selectedGraphIndex: 0,
      isViewingAll: false,
      highlightedRowId: null,
      highlightPulse: 0,
      isExporting: false
    });
  });

  it('updates rows and derives sorted known names', () => {
    const id = addGeneratorRow({ from: 'Zoe', to: 'Aaron', relation: 'Friends' });
    updateGeneratorRow(id, { relation: 'Collaborators' });

    expect(get(generatorRowsStore).find((row) => row.id === id)?.relation).toBe('Collaborators');
    expect(get(generatorKnownNamesStore)).toContain('Aaron');
    expect(get(generatorKnownNamesStore)).toContain('Zoe');

    removeGeneratorRow(id);
    expect(get(generatorRowsStore).some((row) => row.id === id)).toBe(false);
  });

  it('clamps graph selection and tracks view and highlight state', () => {
    setGeneratorConfig({ ...DEFAULT_CONFIG, graphCount: 3 });
    selectGeneratorGraph(2);
    expect(get(generatorUiStore).selectedGraphIndex).toBe(2);

    generatorConfigStore.set({ ...DEFAULT_CONFIG, graphCount: 1 });
    expect(get(generatorUiStore).selectedGraphIndex).toBe(0);

    toggleGeneratorViewAll();
    selectGeneratorGraph(8);
    expect(get(generatorUiStore)).toMatchObject({ selectedGraphIndex: 0, isViewingAll: false });

    highlightGeneratorFirstRowForPerson('Alice');
    expect(get(generatorUiStore)).toMatchObject({ highlightedRowId: 'sample-1', highlightPulse: 1 });
  });

  it('defaults graph count to rows divided by 20 until manually overridden', () => {
    setGeneratorRows([]);
    expect(get(generatorConfigStore).graphCount).toBe(1);

    const rows = Array.from({ length: 21 }, (_, index) => ({
      id: `row-${index}`,
      from: `Person ${index}`,
      to: `Person ${index + 1}`,
      relation: 'Connection'
    }));
    setGeneratorRows(rows);
    expect(get(generatorConfigStore).graphCount).toBe(2);

    updateGeneratorConfig({ graphCount: 4 });
    setGeneratorRows([
      ...rows,
      ...rows.map((row, index) => ({ ...row, id: `extra-${index}` }))
    ]);
    expect(get(generatorConfigStore).graphCount).toBe(4);
  });

  it('appends imported generator connections', () => {
    importGeneratorRows([{ from: 'Alice', to: 'Bob', relation: 'Imported' }]);
    expect(get(generatorRowsStore)).toHaveLength(SAMPLE_ROWS.length + 1);
    expect(get(generatorRowsStore).at(-1)).toMatchObject({ relation: 'Imported' });
  });
});

describe('standalone state', () => {
  beforeEach(() => {
    hydrateStandaloneState({
      rows: SAMPLE_ROWS,
      hiddenPeople: [],
      hiddenEdgeRowIds: [],
      settings: DEFAULT_PAGE_SETTINGS
    });
  });

  it('hydrates independent state and updates settings and rows', () => {
    updateStandaloneSettings({ orientation: 'portrait', nodeFontSize: 36 });
    updateStandaloneRow('sample-1', { relation: 'Updated relation' });

    expect(get(standaloneSettingsStore)).toMatchObject({
      orientation: 'portrait',
      nodeFontSize: 36
    });
    expect(get(standaloneRowsStore)[0].relation).toBe('Updated relation');
    expect(get(standaloneKnownNamesStore)).toEqual([
      'Alice',
      'Bob',
      'Dan',
      'Paul',
      'Peter',
      'Stan'
    ]);
  });

  it('appends imported standalone connections', () => {
    importStandaloneRows([{ from: 'Alice', to: 'Bob', relation: 'Imported' }]);
    expect(get(standaloneRowsStore)).toHaveLength(SAMPLE_ROWS.length + 1);
    expect(get(standaloneRowsStore).at(-1)).toMatchObject({ relation: 'Imported' });
  });

  it('toggles hidden people and edges and pulses highlights', () => {
    toggleStandalonePersonHidden('Bob');
    toggleStandaloneEdgeHidden('sample-1');
    expect(get(standaloneHiddenPeopleStore)).toEqual(['Bob']);
    expect(get(standaloneHiddenEdgesStore)).toEqual(['sample-1']);

    toggleStandalonePersonHidden('Bob');
    toggleStandaloneEdgeHidden('sample-1');
    expect(get(standaloneHiddenPeopleStore)).toEqual([]);
    expect(get(standaloneHiddenEdgesStore)).toEqual([]);

    highlightStandaloneRowById('sample-2');
    expect(get(standaloneUiStore)).toMatchObject({ highlightedRowId: 'sample-2', highlightPulse: 1 });
  });
});
