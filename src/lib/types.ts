export type PageSize = '8.5x11' | '11x17' | '8.3x11.7';
export type Orientation = 'landscape' | 'portrait';
export type ExportFormat = 'PNG' | 'SVG' | 'DOT';
export type RelationshipField = 'from' | 'to' | 'relation';

export interface RelationshipRow {
  id: string;
  from: string;
  to: string;
  relation: string;
}

export interface PageExportSettings {
  pageSize: PageSize;
  orientation: Orientation;
  exportFormat: ExportFormat;
  nodeFontSize: number;
  edgeFontSize: number;
}

export interface GraphConfig extends PageExportSettings {
  graphCount: number;
  maxConnectionsPerNode: number;
  hiddenEdgeLabelRatio: number;
  hiddenNodeLabelRatio: number;
  seed: number;
}

export interface StandaloneState {
  rows: RelationshipRow[];
  hiddenPeople: string[];
  hiddenEdgeRowIds: string[];
  settings: PageExportSettings;
}

export interface GeneratedGraph {
  index: number;
  dot: string;
  rows: RelationshipRow[];
  visibleNode: string[];
  visibleEdgeRowIds: string[];
}

export interface RenderedGraph extends GeneratedGraph {
  svg: string;
}

export interface GeneratorUiState {
  selectedGraphIndex: number;
  isViewingAll: boolean;
  highlightedRowId: string | null;
  focusField: RelationshipField | null;
  highlightPulse: number;
  isExporting: boolean;
}

export interface StandaloneUiState {
  highlightedRowId: string | null;
  focusField: RelationshipField | null;
  highlightPulse: number;
  isExporting: boolean;
}
