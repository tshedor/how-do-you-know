<script lang="ts">
  import type { GraphConfig } from '#lib/types';
  import { DEFAULT_CONFIG } from '#lib/constants/sampleData';
  import LayoutAndFontControls from './LayoutAndFontControls.svelte';
  import PercentSliderPopover from './PercentSliderPopover.svelte';

  let {
    config = { ...DEFAULT_CONFIG },
    onUpdateConfig = () => {}
  }: {
    config?: GraphConfig;
    onUpdateConfig?: (patch: Partial<GraphConfig>) => void;
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
    <span class="config-field__label">Max Relationships per Person</span>
    <input
      type="number"
      min="1"
      max="20"
      step="1"
      value={config.maxConnectionsPerNode}
      aria-label="Max relationships per person"
      oninput={handleMaxConnectionsInput}
    />
  </label>

  <div class="config-field">
    <PercentSliderPopover
      label="Hidden Connection"
      value={config.hiddenEdgeLabelRatio}
      onChange={(val) => onUpdateConfig({ hiddenEdgeLabelRatio: val })}
    />
  </div>

  <div class="config-field">
    <PercentSliderPopover
      label="Hidden People"
      value={config.hiddenNodeLabelRatio}
      onChange={(val) => onUpdateConfig({ hiddenNodeLabelRatio: val })}
    />
  </div>

  <LayoutAndFontControls settings={config} onUpdate={onUpdateConfig} />
</footer>

<style>
  .config-bar {
    position: relative;
    z-index: 20;
    display: flex;
    flex: 0 0 auto;
    align-items: flex-end;
    flex-wrap: wrap;
    gap: 0.75rem 1rem;
    padding: 0.75rem 1rem;
    border-top: 1px solid var(--color-border, #dfe4ea);
    background: var(--color-surface, #ffffff);
    box-shadow: 0 -4px 16px rgb(15 23 42 / 4%);
  }

  .config-field {
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
    gap: 0.3rem;
    min-width: 0;
  }

  .config-field__label {
    color: var(--color-text-muted, #64748b);
    font-size: 0.6875rem;
    font-weight: 650;
    line-height: 1.2;
    white-space: nowrap;
  }

  .config-field input {
    width: 4.75rem;
    height: 2.35rem;
    padding: 0.4rem 0.5rem;
    border: 1px solid var(--color-border, #d5dce4);
    border-radius: 0.45rem;
    background: var(--color-surface, #ffffff);
    color: var(--color-text, #243447);
    font-size: 0.8125rem;
    font-variant-numeric: tabular-nums;
  }

  .config-field input:hover {
    border-color: var(--color-text-muted, #94a3b8);
  }

  .config-field input:focus-visible {
    border-color: var(--color-primary, #16a34a);
    outline: 2px solid var(--color-primary-soft, #eafbef);
    outline-offset: 0;
  }

  @media (max-width: 48rem) {
    .config-bar {
      gap: 0.625rem 0.75rem;
      padding: 0.625rem 0.75rem;
    }
  }
</style>
