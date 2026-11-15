import { deflateSync, inflateSync, strFromU8, strToU8 } from 'fflate';
import { DEFAULT_CONFIG, DEFAULT_PAGE_SETTINGS } from '#lib/constants/sampleData';
import type {
  ExportFormat,
  GeneratedGraph,
  GraphConfig,
  Orientation,
  PageExportSettings,
  PageSize,
  RelationshipRow,
  StandaloneState
} from '#lib/types';

export const GENERATOR_URL_PARAM = 's';
export const STANDALONE_URL_PARAM = 'g';

export interface GeneratorUrlState {
  rows: RelationshipRow[];
  config: GraphConfig;
}

const PAYLOAD_VERSION = 1;

const PAGE_SIZES: readonly PageSize[] = ['8.5x11', '11x17', '8.3x11.7'];
const ORIENTATIONS: readonly Orientation[] = ['landscape', 'portrait'];
const EXPORT_FORMATS: readonly ExportFormat[] = ['PNG', 'SVG', 'DOT'];

const GRAPH_COUNT_RANGE = [1, 20] as const;
const MAX_CONNECTIONS_RANGE = [1, 20] as const;
const RATIO_RANGE = [0, 1] as const;
const SEED_RANGE = [0, 0xffffffff] as const;
const NODE_FONT_SIZE_RANGE = [12, 124] as const;
const EDGE_FONT_SIZE_RANGE = [12, 124] as const;

function bytesToUrlBase64(bytes: Uint8Array): string {
  let binary = '';
  for (let index = 0; index < bytes.length; index += 1) {
    binary += String.fromCharCode(bytes[index]);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function urlBase64ToBytes(encoded: string): Uint8Array | null {
  const normalized = encoded.replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized + '='.repeat((4 - (normalized.length % 4)) % 4);
  try {
    const binary = atob(padded);
    const bytes = new Uint8Array(binary.length);
    for (let index = 0; index < binary.length; index += 1) {
      bytes[index] = binary.charCodeAt(index);
    }
    return bytes;
  } catch {
    return null;
  }
}

export function encodeUrlPayload(value: unknown): string {
  const json = JSON.stringify(value) ?? 'null';
  return bytesToUrlBase64(deflateSync(strToU8(json)));
}

export function decodeUrlPayload(encoded: string): unknown {
  const bytes = urlBase64ToBytes(encoded);
  if (!bytes) {
    return null;
  }
  try {
    return JSON.parse(strFromU8(inflateSync(bytes))) as unknown;
  } catch {
    return null;
  }
}

function clampNumber(value: unknown, fallback: number, min: number, max: number): number {
  const parsed = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(parsed)) {
    return fallback;
  }
  return Math.min(max, Math.max(min, parsed));
}

function clampInteger(value: unknown, fallback: number, min: number, max: number): number {
  return Math.round(clampNumber(value, fallback, min, max));
}

function pickOption<T extends string>(value: unknown, options: readonly T[], fallback: T): T {
  return options.includes(value as T) ? (value as T) : fallback;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function sanitizeStringList(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.filter((entry): entry is string => typeof entry === 'string' && entry.length > 0);
}

function sanitizeRows(value: unknown): RelationshipRow[] | null {
  if (!Array.isArray(value)) {
    return null;
  }
  const rows: RelationshipRow[] = [];
  value.forEach((entry, index) => {
    if (!isRecord(entry)) {
      return;
    }
    rows.push({
      id: typeof entry.id === 'string' && entry.id.trim() ? entry.id : `row-${index + 1}`,
      from: typeof entry.from === 'string' ? entry.from : '',
      to: typeof entry.to === 'string' ? entry.to : '',
      relation: typeof entry.relation === 'string' ? entry.relation : ''
    });
  });
  return rows;
}

function sanitizePageSettings(value: unknown): PageExportSettings {
  const record = isRecord(value) ? value : {};
  return {
    pageSize: pickOption(record.pageSize, PAGE_SIZES, DEFAULT_PAGE_SETTINGS.pageSize),
    orientation: pickOption(record.orientation, ORIENTATIONS, DEFAULT_PAGE_SETTINGS.orientation),
    exportFormat: pickOption(record.exportFormat, EXPORT_FORMATS, DEFAULT_PAGE_SETTINGS.exportFormat),
    nodeFontSize: clampInteger(
      record.nodeFontSize,
      DEFAULT_PAGE_SETTINGS.nodeFontSize,
      ...NODE_FONT_SIZE_RANGE
    ),
    edgeFontSize: clampInteger(
      record.edgeFontSize,
      DEFAULT_PAGE_SETTINGS.edgeFontSize,
      ...EDGE_FONT_SIZE_RANGE
    )
  };
}

function sanitizeConfig(value: unknown): GraphConfig {
  const record = isRecord(value) ? value : {};
  return {
    ...sanitizePageSettings(value),
    graphCount: clampInteger(record.graphCount, DEFAULT_CONFIG.graphCount, ...GRAPH_COUNT_RANGE),
    maxConnectionsPerNode: clampInteger(
      record.maxConnectionsPerNode,
      DEFAULT_CONFIG.maxConnectionsPerNode,
      ...MAX_CONNECTIONS_RANGE
    ),
    hiddenEdgeLabelRatio: clampNumber(
      record.hiddenEdgeLabelRatio,
      DEFAULT_CONFIG.hiddenEdgeLabelRatio,
      ...RATIO_RANGE
    ),
    hiddenNodeLabelRatio: clampNumber(
      record.hiddenNodeLabelRatio,
      DEFAULT_CONFIG.hiddenNodeLabelRatio,
      ...RATIO_RANGE
    ),
    seed: clampInteger(record.seed, DEFAULT_CONFIG.seed, ...SEED_RANGE)
  };
}

export function encodeGeneratorState(rows: RelationshipRow[], config: GraphConfig): string {
  return encodeUrlPayload({ v: PAYLOAD_VERSION, rows, config });
}

export function decodeGeneratorState(encoded: string): GeneratorUrlState | null {
  const payload = decodeUrlPayload(encoded);
  if (!isRecord(payload) || payload.v !== PAYLOAD_VERSION) {
    return null;
  }
  const rows = sanitizeRows(payload.rows);
  if (!rows) {
    return null;
  }
  return { rows, config: sanitizeConfig(payload.config) };
}

export function encodeStandaloneState(state: StandaloneState): string {
  return encodeUrlPayload({
    v: PAYLOAD_VERSION,
    rows: state.rows,
    hiddenPeople: state.hiddenPeople,
    hiddenEdgeRowIds: state.hiddenEdgeRowIds,
    settings: state.settings
  });
}

export function decodeStandaloneState(encoded: string): StandaloneState | null {
  const payload = decodeUrlPayload(encoded);
  if (!isRecord(payload) || payload.v !== PAYLOAD_VERSION) {
    return null;
  }
  const rows = sanitizeRows(payload.rows);
  if (!rows) {
    return null;
  }
  return {
    rows,
    hiddenPeople: sanitizeStringList(payload.hiddenPeople),
    hiddenEdgeRowIds: sanitizeStringList(payload.hiddenEdgeRowIds),
    settings: sanitizePageSettings(payload.settings)
  };
}

export function buildStandaloneEditUrl(
  graph: GeneratedGraph,
  settings: PageExportSettings,
  basePath = ''
): string {
  const visibleNode = new Set(graph.visibleNode);
  const people = new Set<string>();
  graph.rows.forEach((row) => {
    if (row.from.trim()) {
      people.add(row.from);
    }
    if (row.to.trim()) {
      people.add(row.to);
    }
  });
  const visibleEdgeRowIds = new Set(graph.visibleEdgeRowIds);
  const encoded = encodeStandaloneState({
    rows: graph.rows,
    hiddenPeople: [...people].filter((name) => !visibleNode.has(name)),
    hiddenEdgeRowIds: graph.rows
      .filter((row) => !visibleEdgeRowIds.has(row.id))
      .map((row) => row.id),
    settings
  });
  const base = basePath.replace(/\/+$/, '');
  return `${base}/edit?g=${encoded}`;
}
