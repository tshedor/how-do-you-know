import { describe, expect, it } from 'vitest';
import {
  buildStandaloneEditUrl,
  decodeGeneratorState,
  decodeStandaloneState,
  encodeGeneratorState,
  encodeStandaloneState,
  encodeUrlPayload
} from '#lib/url/urlCodec';
import { DEFAULT_CONFIG, DEFAULT_PAGE_SETTINGS, SAMPLE_ROWS } from '#lib/constants/sampleData';
import type {
  GeneratedGraph,
  GraphConfig,
  RelationshipRow,
  StandaloneState
} from '#lib/types';

const CONFIG_FOR_ROUND_TRIP: GraphConfig = {
  ...DEFAULT_PAGE_SETTINGS,
  pageSize: '11x17',
  orientation: 'portrait',
  exportFormat: 'SVG',
  nodeFontSize: 55,
  edgeFontSize: 44,
  graphCount: 20,
  maxConnectionsPerNode: 7,
  hiddenEdgeLabelRatio: 0.25,
  hiddenNodeLabelRatio: 0.75,
  seed: 987654321
};

function corruptMiddle(encoded: string): string {
  const middle = Math.floor(encoded.length / 2);
  const replacement = encoded[middle] === 'A' ? 'B' : 'A';
  return encoded.slice(0, middle) + replacement + encoded.slice(middle + 1);
}

describe('generator state codec', () => {
  it('round-trips rows and the full graph config', () => {
    const encoded = encodeGeneratorState(SAMPLE_ROWS, CONFIG_FOR_ROUND_TRIP);
    expect(encoded).not.toMatch(/[+/=]/);

    const decoded = decodeGeneratorState(encoded);
    expect(decoded).not.toBeNull();
    expect(decoded?.rows).toEqual(SAMPLE_ROWS);
    expect(decoded?.config).toEqual(CONFIG_FOR_ROUND_TRIP);
  });

  it('round-trips 100 rows including quotes and backslashes', () => {
    const rows: RelationshipRow[] = Array.from({ length: 100 }, (_, index) => ({
      id: `row-${index + 1}`,
      from: `Person ${index + 1}`,
      to: `Friend ${((index + 1) % 100) + 1}`,
      relation: `Relation ${index + 1} with "quotes" & \\ backslash`
    }));

    const decoded = decodeGeneratorState(encodeGeneratorState(rows, DEFAULT_CONFIG));
    expect(decoded?.rows).toEqual(rows);
    expect(decoded?.config).toEqual(DEFAULT_CONFIG);
  });

  it('clamps out-of-range config values and falls back on invalid fields', () => {
    const encoded = encodeUrlPayload({
      v: 1,
      rows: SAMPLE_ROWS,
      config: {
        graphCount: 500,
        maxConnectionsPerNode: 0,
        hiddenEdgeLabelRatio: 3,
        hiddenNodeLabelRatio: -2,
        seed: -5,
        nodeFontSize: 999,
        edgeFontSize: 'nope'
      }
    });

    const decoded = decodeGeneratorState(encoded);
    expect(decoded?.config).toMatchObject({
      pageSize: '8.5x11',
      orientation: 'landscape',
      exportFormat: 'PNG',
      nodeFontSize: 200,
      edgeFontSize: DEFAULT_PAGE_SETTINGS.edgeFontSize,
      graphCount: 20,
      maxConnectionsPerNode: 1,
      hiddenEdgeLabelRatio: 1,
      hiddenNodeLabelRatio: 0,
      seed: 0
    });
  });

  it('returns null for malformed or corrupted payloads', () => {
    expect(decodeGeneratorState('')).toBeNull();
    expect(decodeGeneratorState('not-a-valid-url-payload!!!')).toBeNull();

    const valid = encodeGeneratorState(SAMPLE_ROWS, DEFAULT_CONFIG);
    expect(decodeGeneratorState(corruptMiddle(valid))).toBeNull();
    expect(decodeGeneratorState(valid.slice(0, valid.length - 8))).toBeNull();
    expect(decodeGeneratorState(`${valid}?`)).toBeNull();
  });

  it('returns null for payloads with the wrong shape or version', () => {
    expect(
      decodeGeneratorState(encodeUrlPayload({ v: 2, rows: SAMPLE_ROWS, config: DEFAULT_CONFIG }))
    ).toBeNull();
    expect(decodeGeneratorState(encodeUrlPayload(null))).toBeNull();
    expect(decodeGeneratorState(encodeUrlPayload('nope'))).toBeNull();
    expect(decodeGeneratorState(encodeUrlPayload({ v: 1, config: DEFAULT_CONFIG }))).toBeNull();
    expect(
      decodeGeneratorState(encodeUrlPayload({ v: 1, rows: 'nope', config: DEFAULT_CONFIG }))
    ).toBeNull();
  });
});

describe('standalone state codec', () => {
  it('round-trips rows, hidden sets, and settings', () => {
    const state: StandaloneState = {
      rows: SAMPLE_ROWS,
      hiddenPeople: ['Bob', 'Peter'],
      hiddenEdgeRowIds: ['sample-2', 'sample-4'],
      settings: {
        ...DEFAULT_PAGE_SETTINGS,
        orientation: 'portrait',
        exportFormat: 'SVG',
        nodeFontSize: 33,
        edgeFontSize: 27
      }
    };

    const decoded = decodeStandaloneState(encodeStandaloneState(state));
    expect(decoded).toEqual(state);
    expect(decoded?.rows[0].id).toBe('sample-1');
  });

  it('falls back to defaults for malformed standalone fields', () => {
    const encoded = encodeUrlPayload({
      v: 1,
      rows: [
        { id: 'x', from: 1, to: null, relation: true },
        'junk',
        { id: '', from: 'A', to: 'B', relation: 'C' }
      ],
      hiddenPeople: ['Bob', 42, ''],
      hiddenEdgeRowIds: 'nope',
      settings: { pageSize: '4x6', orientation: 'diagonal', exportFormat: 3, nodeFontSize: -10 }
    });

    const decoded = decodeStandaloneState(encoded);
    expect(decoded?.rows).toEqual([
      { id: 'x', from: '', to: '', relation: '' },
      { id: 'row-3', from: 'A', to: 'B', relation: 'C' }
    ]);
    expect(decoded?.hiddenPeople).toEqual(['Bob']);
    expect(decoded?.hiddenEdgeRowIds).toEqual([]);
    expect(decoded?.settings).toMatchObject({
      pageSize: '8.5x11',
      orientation: 'landscape',
      exportFormat: 'PNG',
      nodeFontSize: 1,
      edgeFontSize: DEFAULT_PAGE_SETTINGS.edgeFontSize
    });
  });

  it('returns null when rows are missing or the payload is malformed', () => {
    expect(decodeStandaloneState(encodeUrlPayload({ v: 1, settings: DEFAULT_PAGE_SETTINGS }))).toBeNull();
    expect(decodeStandaloneState(encodeUrlPayload('nope'))).toBeNull();
    expect(decodeStandaloneState(encodeUrlPayload({ v: 9, rows: [] }))).toBeNull();
  });
});

describe('buildStandaloneEditUrl', () => {
  it('derives hidden sets from graph visibility and encodes the edit URL', () => {
    const graph: GeneratedGraph = {
      index: 0,
      dot: 'strict graph G {}',
      rows: SAMPLE_ROWS,
      visiblePeople: ['Alice', 'Bob', 'Dan', 'Stan'],
      visibleEdgeRowIds: ['sample-1', 'sample-4']
    };

    const url = buildStandaloneEditUrl(graph, DEFAULT_PAGE_SETTINGS);
    expect(url.startsWith('/edit?g=')).toBe(true);

    const encoded = new URL(url, 'http://localhost').searchParams.get('g') ?? '';
    const decoded = decodeStandaloneState(encoded);
    expect(decoded?.rows).toEqual(SAMPLE_ROWS);
    expect(decoded?.hiddenPeople).toEqual(['Peter', 'Paul']);
    expect(decoded?.hiddenEdgeRowIds).toEqual(['sample-2', 'sample-3', 'sample-5']);
    expect(decoded?.settings).toEqual(DEFAULT_PAGE_SETTINGS);
  });

  it('honors a custom base path and strips trailing slashes', () => {
    const graph: GeneratedGraph = {
      index: 0,
      dot: '',
      rows: [],
      visiblePeople: [],
      visibleEdgeRowIds: []
    };

    expect(buildStandaloneEditUrl(graph, DEFAULT_PAGE_SETTINGS, '/app').startsWith('/app/edit?g=')).toBe(
      true
    );
    expect(buildStandaloneEditUrl(graph, DEFAULT_PAGE_SETTINGS, '/app/').startsWith('/app/edit?g=')).toBe(
      true
    );
    expect(buildStandaloneEditUrl(graph, DEFAULT_PAGE_SETTINGS).startsWith('/edit?g=')).toBe(true);
  });
});
