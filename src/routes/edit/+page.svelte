<script lang="ts">
  import { onMount } from 'svelte';
  import RightActionHeader from '#lib/components/actions/RightActionHeader.svelte';
  import StandaloneConfigBar from '#lib/components/config-bar/StandaloneConfigBar.svelte';
  import LeftPane from '#lib/components/left/LeftPane.svelte';
  import GraphCanvas from '#lib/components/viewer/GraphCanvas.svelte';
  import { openSingleGraphInTab } from '#lib/export';
  import { GraphGenerator } from '#lib/graph/GraphGenerator';
  import {
    addStandaloneRow,
    highlightStandaloneFirstRowForPerson,
    highlightStandaloneRowById,
    importStandaloneRows,
    removeStandaloneRow,
    resetStandaloneSettings,
    setStandaloneExporting,
    standaloneHiddenEdgesStore,
    standaloneHiddenPeopleStore,
    standaloneKnownNamesStore,
    standaloneRowsStore,
    standaloneSettingsStore,
    standaloneUiStore,
    toggleStandaloneEdgeHidden,
    toggleStandalonePersonHidden,
    updateStandaloneRow,
    updateStandaloneSettings
  } from '#lib/stores/standaloneState';
  import type { ExportFormat, RenderedGraph } from '#lib/types';
  import { initStandaloneUrlSync } from '#lib/url/urlSync';
  import { renderGraphToSvg } from '#lib/viz';

  const generator = new GraphGenerator();

  let renderedGraph = $state<RenderedGraph | null>(null);
  let isRendering = $state(false);
  let errorMessage = $state<string | null>(null);
  let connectionsPaneWidth = $state<number | null>(null);
  let renderSequence = 0;

  onMount(() => initStandaloneUrlSync());

  $effect(() => {
    const graph = generator.buildStandalone(
      $standaloneRowsStore,
      $standaloneSettingsStore,
      $standaloneHiddenPeopleStore,
      $standaloneHiddenEdgesStore
    );
    const sequence = ++renderSequence;
    isRendering = true;
    errorMessage = null;

    void (async () => {
      try {
        const rendered = await renderGraphToSvg(graph);
        if (sequence === renderSequence) {
          renderedGraph = rendered;
        }
      } catch (error) {
        if (sequence === renderSequence) {
          errorMessage = error instanceof Error ? error.message : 'Unable to render graph.';
        }
      } finally {
        if (sequence === renderSequence) {
          isRendering = false;
        }
      }
    })();

    return () => {
      if (sequence === renderSequence) {
        renderSequence += 1;
      }
    };
  });

  async function handleViewSingle(format: ExportFormat): Promise<void> {
    const graph = renderedGraph;
    if (!graph || $standaloneUiStore.isExporting) return;

    const win = window.open('', '_blank');
    setStandaloneExporting(true);
    errorMessage = null;
    try {
      await openSingleGraphInTab(
        graph,
        { ...$standaloneSettingsStore, exportFormat: format },
        win
      );
    } catch (error) {
      win?.close();
      errorMessage = error instanceof Error ? error.message : 'Unable to export graph.';
    } finally {
      setStandaloneExporting(false);
    }
  }
</script>

<svelte:head>
  <title>Edit Graph | How Do You Know</title>
</svelte:head>

<main class="app-layout">
  <div
    class="app-layout__left"
    style:--connections-pane-width={connectionsPaneWidth === null
      ? undefined
      : `${connectionsPaneWidth}px`}
  >
    <LeftPane
      rows={$standaloneRowsStore}
      knownNames={$standaloneKnownNamesStore}
      highlightedRowId={$standaloneUiStore.highlightedRowId}
      focusField={$standaloneUiStore.focusField}
      highlightPulse={$standaloneUiStore.highlightPulse}
      showVisibilityToggles={true}
      hiddenPeople={$standaloneHiddenPeopleStore}
      hiddenEdgeRowIds={$standaloneHiddenEdgesStore}
      onAddRow={() => addStandaloneRow()}
      onImportRows={importStandaloneRows}
      onResize={(width) => (connectionsPaneWidth = width)}
      onUpdateRow={updateStandaloneRow}
      onRemoveRow={removeStandaloneRow}
      onTogglePersonHidden={toggleStandalonePersonHidden}
      onToggleEdgeHidden={toggleStandaloneEdgeHidden}
    />
  </div>
  <section class="app-layout__right">
    <RightActionHeader
      isExporting={$standaloneUiStore.isExporting}
      showGeneratorActions={false}
      canViewGraph={renderedGraph !== null}
      onViewFormat={handleViewSingle}
    />
    <StandaloneConfigBar
      settings={$standaloneSettingsStore}
      onUpdateSettings={updateStandaloneSettings}
      onResetSettings={resetStandaloneSettings}
    />
    <GraphCanvas
      graph={renderedGraph}
      {isRendering}
      {errorMessage}
      onPersonClick={highlightStandaloneFirstRowForPerson}
      onEdgeClick={highlightStandaloneRowById}
    />
  </section>
</main>
