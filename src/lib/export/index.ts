import { zipSync } from 'fflate';
import type { PageExportSettings, RenderedGraph } from '#lib/types';
import { svgToPng300DpiBytes } from './png300Dpi';

export const ZIP_FILENAME = 'partymap-graphs.zip';

interface ZipEntry {
  name: string;
  data: Uint8Array;
}

export async function buildGraphsZipBytes(
  graphs: RenderedGraph[],
  viewAllGraph: RenderedGraph | null,
  settings: PageExportSettings
): Promise<Uint8Array> {
  const isPng = settings.exportFormat === 'PNG';
  const extension = isPng ? 'png' : 'svg';
  const entries: ZipEntry[] = [];

  for (let index = 0; index < graphs.length; index++) {
    const graph = graphs[index];
    entries.push({
      name: `graph-${index + 1}.${extension}`,
      data: await graphToExportBytes(graph, isPng, settings)
    });
  }

  if (viewAllGraph) {
    entries.push({
      name: `view-all.${extension}`,
      data: await graphToExportBytes(viewAllGraph, isPng, settings)
    });
  }

  const files: Record<string, Uint8Array> = {};
  for (const entry of entries) {
    files[entry.name] = entry.data;
  }
  return zipSync(files);
}

export async function downloadGraphsZip(
  graphs: RenderedGraph[],
  viewAllGraph: RenderedGraph | null,
  settings: PageExportSettings
): Promise<void> {
  const bytes = await buildGraphsZipBytes(graphs, viewAllGraph, settings);
  const blob = new Blob([bytes as Uint8Array<ArrayBuffer>], { type: 'application/zip' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = ZIP_FILENAME;
  anchor.click();
  URL.revokeObjectURL(url);
}

export async function openSingleGraphInTab(
  graph: RenderedGraph,
  settings: PageExportSettings,
  targetWindow?: Window | null
): Promise<void> {
  const isPng = settings.exportFormat === 'PNG';
  const bytes = await graphToExportBytes(graph, isPng, settings);
  const blob = new Blob([bytes as Uint8Array<ArrayBuffer>], { type: isPng ? 'image/png' : 'image/svg+xml' });
  const url = URL.createObjectURL(blob);
  const target = targetWindow ?? window.open('', '_blank');
  if (target) {
    target.location.href = url;
  }
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

async function graphToExportBytes(
  graph: RenderedGraph,
  isPng: boolean,
  settings: PageExportSettings
): Promise<Uint8Array> {
  if (isPng) {
    return svgToPng300DpiBytes(graph.svg, settings.pageSize, settings.orientation);
  }
  return new TextEncoder().encode(graph.svg);
}
