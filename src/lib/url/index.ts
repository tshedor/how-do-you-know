import type { GeneratedGraph, PageExportSettings } from '#lib/types';

export function initGeneratorUrlSync(): () => void {
  return () => undefined;
}

export function initStandaloneUrlSync(): () => void {
  return () => undefined;
}

export function buildStandaloneEditUrl(
  _graph: GeneratedGraph,
  _settings: PageExportSettings,
  _basePath?: string
): string {
  return '/edit';
}
