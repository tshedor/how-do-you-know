import type { GeneratedGraph, RenderedGraph } from '#lib/types';
import type { Viz } from '@viz-js/viz';

let vizInstance: Promise<Viz> | null = null;

function getVizInstance(): Promise<Viz> {
  if (!vizInstance) {
    vizInstance = import('@viz-js/viz').then((vizModule) => vizModule.instance());
  }
  return vizInstance;
}

export async function renderDotToSvg(dot: string): Promise<string> {
  const viz = await getVizInstance();
  const result = viz.render(dot, { format: 'svg' });
  if (result.status === 'failure') {
    const messages = result.errors.map((error) => error.message).join('; ');
    throw new Error(`Graphviz rendering failed: ${messages}`);
  }
  return result.output;
}

export async function renderGraphToSvg(graph: GeneratedGraph): Promise<RenderedGraph> {
  return { ...graph, svg: await renderDotToSvg(graph.dot) };
}

export async function renderAllDotsToSvg(graphs: GeneratedGraph[]): Promise<RenderedGraph[]> {
  return Promise.all(graphs.map((graph) => renderGraphToSvg(graph)));
}
