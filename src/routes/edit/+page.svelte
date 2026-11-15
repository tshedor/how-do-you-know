<script lang="ts">
  import { onMount } from 'svelte';
  import RightActionHeader from '#lib/components/actions/RightActionHeader.svelte';
  import StandaloneConfigBar from '#lib/components/config-bar/StandaloneConfigBar.svelte';
  import LeftPane from '#lib/components/left/LeftPane.svelte';
  import GraphCanvas from '#lib/components/viewer/GraphCanvas.svelte';
  import { openSingleGraphInTab } from '#lib/export';
  import { PartyMapGenerator } from '#lib/graph';
  import {
    addStandaloneRow,
    highlightStandaloneFirstRowForPerson,
    highlightStandaloneRowById,
    removeStandaloneRow,
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
  import type { RenderedGraph } from '#lib/types';
  import { initStandaloneUrlSync } from '#lib/url';
  import { renderGraphToSvg } from '#lib/viz';

  const generator = new PartyMapGenerator();

  let renderedGraph = $state<RenderedGraph | null>(null);
  let isRendering = $state(false);
  let errorMessage = $state<string | null>(null);
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

  async function handleViewSingle(): Promise<void> {
    const graph = renderedGraph;
    if (!graph || $standaloneUiStore.isExporting) return;

    const win = window.open('', '_blank');
    setStandaloneExporting(true);
    errorMessage = null;
    try {
      await openSingleGraphInTab(graph, $standaloneSettingsStore, win);
    } catch (error) {
      win?.close();
      errorMessage = error instanceof Error ? error.message : 'Unable to export graph.';
    } finally {
      setStandaloneExporting(false);
    }
  }
</script>

<svelte:head>
  <title>Edit PartyMap</title>
</svelte:head>

<main class="app-layout">
  <div class="app-layout__left">
    <LeftPane
      rows={$standaloneRowsStore}
      knownNames={$standaloneKnownNamesStore}
      highlightedRowId={$standaloneUiStore.highlightedRowId}
      highlightPulse={$standaloneUiStore.highlightPulse}
      showVisibilityToggles={true}
      hiddenPeople={$standaloneHiddenPeopleStore}
      hiddenEdgeRowIds={$standaloneHiddenEdgesStore}
      onAddRow={() => addStandaloneRow()}
      onUpdateRow={updateStandaloneRow}
      onRemoveRow={removeStandaloneRow}
      onTogglePersonHidden={toggleStandalonePersonHidden}
      onToggleEdgeHidden={toggleStandaloneEdgeHidden}
    />
  </div>
  <section class="app-layout__right">
    <RightActionHeader
      exportFormat={$standaloneSettingsStore.exportFormat}
      isExporting={$standaloneUiStore.isExporting}
      showGeneratorActions={false}
      onViewFormat={handleViewSingle}
      onSelectFormat={(exportFormat) => updateStandaloneSettings({ exportFormat })}
    />
    <GraphCanvas
      graph={renderedGraph}
      {isRendering}
      {errorMessage}
      onPersonClick={highlightStandaloneFirstRowForPerson}
      onEdgeClick={highlightStandaloneRowById}
    />
    <StandaloneConfigBar
      settings={$standaloneSettingsStore}
      onUpdateSettings={updateStandaloneSettings}
    />
  </section>
</main>
