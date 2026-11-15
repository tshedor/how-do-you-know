<script lang="ts">
  import type { GraphConfig } from '#lib/types';
  import LayoutAndFontControls from './LayoutAndFontControls.svelte';
  import PercentSliderPopover from './PercentSliderPopover.svelte';

  let {
    config,
    onUpdateConfig
  }: {
    config: GraphConfig;
    onUpdateConfig: (patch: Partial<GraphConfig>) => void;
  } = $props();

  function clampInt(raw: number, min: number, max: number, fallback: number): number {
    if (!Number.isFinite(raw)) return fallback;
    return Math.min(max, Math.max(min, Math.round(raw)));
  }

  function handleGraphCountInput(event: Event): void {
    const input = event.currentTarget as HTMLInputElement;
    onUpdateConfig({
      graphCount: clampInt(Number.parseFloat(input.value), 1, 20, 1)
    });
  }

  function handleMaxConnectionsInput(event: Event): void {
    const input = event.currentTarget as HTMLInputElement;
    onUpdateConfig({
      maxConnectionsPerNode: clampInt(Number.parseFloat(input.value), 1, 20, 1)
    });
  }
</script>

<footer class="config-bar config-bar--generator">
  <label class="config-field">
    <span class="config-field__label">Graphs</span>
    <input
      type="number"
      min="1"
      max="20"
      step="1"
      value={config.graphCount}
      aria-label="Number of graphs"
      oninput={handleGraphCountInput}
    />
  </label>

  <label class="config-field">
    <span class="config-field__label">Max Connections/Node</span>
    <input
      type="number"
      min="1"
      max="20"
      step="1"
      value={config.maxConnectionsPerNode}
      aria-label="Max connections per node"
      oninput={handleMaxConnectionsInput}
    />
  </label>

  <div class="config-field">
    <PercentSliderPopover
      label="Hidden Edges"
      value={config.hiddenEdgeLabelRatio}
      onChange={(val) => onUpdateConfig({ hiddenEdgeLabelRatio: val })}
    />
  </div>

  <div class="config-field">
    <PercentSliderPopover
      label="Hidden Nodes"
      value={config.hiddenNodeLabelRatio}
      onChange={(val) => onUpdateConfig({ hiddenNodeLabelRatio: val })}
    />
  </div>

  <LayoutAndFontControls settings={config} onUpdate={onUpdateConfig} />
</footer>
