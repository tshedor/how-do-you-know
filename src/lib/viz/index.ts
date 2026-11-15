import type { GeneratedGraph, RenderedGraph } from '#lib/types';

export async function renderDotToSvg(_dot: string): Promise<string> {
  return '';
}

export async function renderGraphToSvg(graph: GeneratedGraph): Promise<RenderedGraph> {
  return { ...graph, svg: await renderDotToSvg(graph.dot) };
}

export async function renderAllDotsToSvg(graphs: GeneratedGraph[]): Promise<RenderedGraph[]> {
  return Promise.all(graphs.map((graph) => renderGraphToSvg(graph)));
}
