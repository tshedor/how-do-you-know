import type { PageExportSettings, RenderedGraph } from '#lib/types';

export async function downloadGraphsZip(
  _graphs: RenderedGraph[],
  _viewAllGraph: RenderedGraph | null,
  _settings: PageExportSettings
): Promise<void> {}

export async function openSingleGraphInTab(
  _graph: RenderedGraph,
  _settings: PageExportSettings,
  _targetWindow?: Window | null
): Promise<void> {}
