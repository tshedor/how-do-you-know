<script lang="ts">
  import { onMount } from 'svelte';
  import * as appPaths from '$app/paths';
  import RightActionHeader from '#lib/components/actions/RightActionHeader.svelte';
  import GeneratorConfigBar from '#lib/components/config-bar/GeneratorConfigBar.svelte';
  import LeftPane from '#lib/components/left/LeftPane.svelte';
  import GraphCanvas from '#lib/components/viewer/GraphCanvas.svelte';
  import ThumbnailStrip from '#lib/components/viewer/ThumbnailStrip.svelte';
  import { downloadGraphsZip, openSingleGraphInTab } from '#lib/export';
  import { GraphGenerator } from '#lib/graph/GraphGenerator';
  import {
    addGeneratorRow,
    generatorConfigStore,
    generatorKnownNamesStore,
    generatorRowsStore,
    generatorUiStore,
    highlightGeneratorFirstRowForPerson,
    highlightGeneratorRowById,
    importGeneratorRows,
    removeGeneratorRow,
    reshuffleGeneratorSeed,
    selectGeneratorGraph,
    setGeneratorExporting,
    toggleGeneratorViewAll,
    updateGeneratorConfig,
    updateGeneratorRow
  } from '#lib/stores/generatorState';
  import type { ExportFormat, GeneratedGraph, RenderedGraph } from '#lib/types';
  import { buildStandaloneEditUrl } from '#lib/url/urlCodec';
  import { initGeneratorUrlSync } from '#lib/url/urlSync';
  import { renderAllDotsToSvg, renderGraphToSvg } from '#lib/viz';

  const { base } = appPaths as typeof appPaths & { base: string };
  const generator = new GraphGenerator();

  let generatedGraphs = $derived(
    generator.generate($generatorRowsStore, $generatorConfigStore)
  );
  let generatedViewAll = $derived(
    generator.buildViewAll($generatorRowsStore, $generatorConfigStore)
  );
  let renderedGraphs = $state<RenderedGraph[]>([]);
  let renderedViewAll = $state<RenderedGraph | null>(null);
  let isRendering = $state(false);
  let errorMessage = $state<string | null>(null);
  let connectionsPaneWidth = $state<number | null>(null);
  let renderSequence = 0;

  let displayedGraph = $derived(
    $generatorUiStore.isViewingAll
      ? renderedViewAll
      : (renderedGraphs[$generatorUiStore.selectedGraphIndex] ?? null)
  );

  onMount(() => initGeneratorUrlSync());

  $effect(() => {
    const graphs = generatedGraphs;
    const viewAll = generatedViewAll;
    const sequence = ++renderSequence;
    isRendering = true;
    errorMessage = null;
    void renderGraphs(graphs, viewAll, sequence);
  });

  async function renderGraphs(
    graphs: GeneratedGraph[],
    viewAll: GeneratedGraph,
    sequence: number
  ): Promise<void> {
    try {
      const [nextGraphs, nextViewAll] = await Promise.all([
        renderAllDotsToSvg(graphs),
        renderGraphToSvg(viewAll)
      ]);
      if (sequence !== renderSequence) return;
      renderedGraphs = nextGraphs;
      renderedViewAll = nextViewAll;
    } catch (error) {
      if (sequence !== renderSequence) return;
      errorMessage = error instanceof Error ? error.message : 'Unable to render the graph.';
    } finally {
      if (sequence === renderSequence) {
        isRendering = false;
      }
    }
  }

  function exportStandalone(): void {
    if (!displayedGraph) return;
    const url = buildStandaloneEditUrl(displayedGraph, $generatorConfigStore, base);
    window.open(url, '_blank');
  }

  async function exportGraphs(): Promise<void> {
    if ($generatorUiStore.isExporting || renderedGraphs.length === 0) return;
    setGeneratorExporting(true);
    errorMessage = null;
    try {
      await downloadGraphsZip(renderedGraphs, renderedViewAll, $generatorConfigStore);
    } catch (error) {
      errorMessage = error instanceof Error ? error.message : 'Unable to export the graphs.';
    } finally {
      setGeneratorExporting(false);
    }
  }

  async function viewCurrentGraph(format: ExportFormat): Promise<void> {
    const graph = displayedGraph;
    if (!graph || $generatorUiStore.isExporting) return;

    const win = window.open('', '_blank');
    setGeneratorExporting(true);
    errorMessage = null;
    try {
      await openSingleGraphInTab(
        graph,
        { ...$generatorConfigStore, exportFormat: format },
        win
      );
    } catch (error) {
      win?.close();
      errorMessage = error instanceof Error ? error.message : 'Unable to view the graph.';
    } finally {
      setGeneratorExporting(false);
    }
  }
</script>

<svelte:head>
  <title>PartyMap</title>
</svelte:head>

<main class="app-layout">
  <div
    class="app-layout__left"
    style:--connections-pane-width={connectionsPaneWidth === null
      ? undefined
      : `${connectionsPaneWidth}px`}
  >
    <LeftPane
      rows={$generatorRowsStore}
      knownNames={$generatorKnownNamesStore}
      highlightedRowId={$generatorUiStore.highlightedRowId}
      focusField={$generatorUiStore.focusField}
      highlightPulse={$generatorUiStore.highlightPulse}
      showVisibilityToggles={false}
      onAddRow={() => addGeneratorRow()}
      onImportRows={importGeneratorRows}
      onResize={(width) => (connectionsPaneWidth = width)}
      onUpdateRow={updateGeneratorRow}
      onRemoveRow={removeGeneratorRow}
    />
  </div>
  <section class="app-layout__right">
    <RightActionHeader
      exportFormat={$generatorConfigStore.exportFormat}
      isExporting={$generatorUiStore.isExporting}
      showGeneratorActions={true}
      canExportStandalone={displayedGraph !== null}
      canViewGraph={displayedGraph !== null}
      isViewingAll={$generatorUiStore.isViewingAll}
      onReshuffle={reshuffleGeneratorSeed}
      onExportStandalone={exportStandalone}
      onExportGraphs={exportGraphs}
      onToggleViewAll={toggleGeneratorViewAll}
      onViewFormat={viewCurrentGraph}
      onSelectFormat={(format) => updateGeneratorConfig({ exportFormat: format })}
    />
    <ThumbnailStrip
      graphs={renderedGraphs}
      selectedIndex={$generatorUiStore.selectedGraphIndex}
      isViewingAll={$generatorUiStore.isViewingAll}
      onSelect={selectGeneratorGraph}
    />
    <GraphCanvas
      graph={displayedGraph}
      {isRendering}
      {errorMessage}
      onPersonClick={highlightGeneratorFirstRowForPerson}
      onEdgeClick={highlightGeneratorRowById}
    />
    <GeneratorConfigBar config={$generatorConfigStore} onUpdateConfig={updateGeneratorConfig} />
  </section>
</main>
