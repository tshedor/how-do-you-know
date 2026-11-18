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

export async function printGraphs(
  graphs: RenderedGraph[],
  viewAllGraph: RenderedGraph | null,
  settings: PageExportSettings
): Promise<void> {
  const pngs: string[] = [];
  for (const graph of graphs) {
    const bytes = await graphToExportBytes(graph, settings);
    pngs.push(await toDataUrl(bytes, 'image/png'));
  }
  if (viewAllGraph) {
    const bytes = await graphToExportBytes(viewAllGraph, settings);
    pngs.push(await toDataUrl(bytes, 'image/png'));
  }

  const images = pngs.map((src) => `<img src="${src}" alt="Graph" />`).join('');
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Print Graphs | How Do You Know</title>
  <style>
    @page { margin: 0; }
    html, body { margin: 0; padding: 0; }
    img {
      display: block;
      max-width: 100%;
      height: auto;
      break-after: page;
      page-break-after: always;
    }
    img:last-child {
      break-after: auto;
      page-break-after: auto;
    }
  </style>
</head>
<body>
  ${images}
</body>
</html>`;

  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    throw new Error('Unable to open print window. Please allow popups.');
  }
  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
  setTimeout(() => printWindow.print(), 300);
}

async function toDataUrl(bytes: Uint8Array, mimeType: string): Promise<string> {
  const blob = new Blob([bytes as Uint8Array<ArrayBuffer>], { type: mimeType });
  return await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('Failed to encode image for print'));
    reader.readAsDataURL(blob);
  });
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
