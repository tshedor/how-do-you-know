import type { GraphConfig, PageExportSettings, RelationshipRow } from '#lib/types';

export const SAMPLE_ROWS: RelationshipRow[] = [
  { id: 'sample-1', from: 'Bob', to: 'Alice', relation: 'Sunday night drum circle' },
  { id: 'sample-2', from: 'Dan', to: 'Stan', relation: 'Started drum circle' },
  { id: 'sample-3', from: 'Peter', to: 'Paul', relation: 'Monday night sewing circle' },
  { id: 'sample-4', from: 'Bob', to: 'Stan', relation: 'Work nemesis' },
  { id: 'sample-5', from: 'Stan', to: 'Peter', relation: 'Wombmates' }
];

export const DEFAULT_PAGE_SETTINGS: PageExportSettings = {
  pageSize: '8.5x11',
  orientation: 'landscape',
  exportFormat: 'PNG',
  nodeFontSize: 42,
  edgeFontSize: 38
};

export const DEFAULT_CONFIG: GraphConfig = {
  ...DEFAULT_PAGE_SETTINGS,
  graphCount: 1,
  maxConnectionsPerNode: 4,
  hiddenEdgeLabelRatio: 0,
  hiddenNodeLabelRatio: 0,
  seed: 123456789
};
