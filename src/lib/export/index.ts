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
  const extension =
    settings.exportFormat === 'PNG' ? 'png' : settings.exportFormat === 'SVG' ? 'svg' : 'txt';
  const entries: ZipEntry[] = [];

  for (let index = 0; index < graphs.length; index++) {
    const graph = graphs[index];
    entries.push({
      name: `graph-${index + 1}.${extension}`,
      data: await graphToExportBytes(graph, settings)
    });
  }

  if (viewAllGraph) {
    entries.push({
      name: `view-all.${extension}`,
      data: await graphToExportBytes(viewAllGraph, settings)
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
  const bytes = await graphToExportBytes(graph, settings);
  const mimeType =
    settings.exportFormat === 'PNG'
      ? 'image/png'
      : settings.exportFormat === 'SVG'
        ? 'image/svg+xml'
        : 'text/plain;charset=utf-8';
  const blob = new Blob([bytes as Uint8Array<ArrayBuffer>], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const target = targetWindow ?? window.open('', '_blank');
  if (target) {
    target.location.href = url;
  }
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

async function graphToExportBytes(
  graph: RenderedGraph,
  settings: PageExportSettings
): Promise<Uint8Array> {
  if (settings.exportFormat === 'PNG') {
    return svgToPng300DpiBytes(graph.svg, settings.pageSize, settings.orientation);
  }
  return new TextEncoder().encode(settings.exportFormat === 'DOT' ? graph.dot : graph.svg);
}
