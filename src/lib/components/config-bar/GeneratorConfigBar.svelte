<script lang="ts">
  import type { GraphConfig } from '#lib/types';
  import { DEFAULT_CONFIG } from '#lib/constants/sampleData';
  import LayoutAndFontControls from './LayoutAndFontControls.svelte';
  import PercentSliderPopover from './PercentSliderPopover.svelte';

  let {
    config = { ...DEFAULT_CONFIG },
    onUpdateConfig = () => {},
    onResetConfig = () => {}
  }: {
    config?: GraphConfig;
    onUpdateConfig?: (patch: Partial<GraphConfig>) => void;
    onResetConfig?: () => void;
  } = $props();

  let isDrawerOpen = $state(false);

  function handleWindowKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      isDrawerOpen = false;
    }
  }

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

<svelte:window onkeydown={handleWindowKeydown} />

<footer class="config-bar config-bar--generator" class:is-open={isDrawerOpen}>
  <button
    type="button"
    class="mobile-toolbar-toggle"
    aria-label="Open graph settings"
    aria-controls="generator-settings-drawer"
    aria-expanded={isDrawerOpen}
    title="Graph settings"
    onclick={() => (isDrawerOpen = true)}
  >
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true">
      <path d="M6 3v14M14 3v14" />
      <rect x="3.5" y="6" width="5" height="4" rx="1" fill="currentColor" stroke="none" />
      <rect x="11.5" y="11" width="5" height="4" rx="1" fill="currentColor" stroke="none" />
    </svg>
  </button>
  {#if isDrawerOpen}
    <button
      type="button"
      class="mobile-drawer-backdrop"
      aria-label="Close graph settings"
      onclick={() => (isDrawerOpen = false)}
    ></button>
  {/if}
  <div
    id="generator-settings-drawer"
    class="config-bar__content"
    class:is-open={isDrawerOpen}
    aria-label="Graph settings"
    role={isDrawerOpen ? 'dialog' : undefined}
    aria-modal={isDrawerOpen ? true : undefined}
  >
    <div class="mobile-drawer-heading">
      <span>Graph Settings</span>
      <button
        type="button"
        class="mobile-drawer-close"
        aria-label="Close graph settings"
        onclick={() => (isDrawerOpen = false)}
      >
        &times;
      </button>
    </div>
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
      <span class="config-field__label">Max Relationships</span>
      <input
        type="number"
        min="1"
        max="20"
        step="1"
        value={config.maxConnectionsPerNode}
        aria-label="Max relationships"
        oninput={handleMaxConnectionsInput}
      />
    </label>

    <div class="config-field">
      <PercentSliderPopover
        label="Shown Connections"
        value={1 - config.hiddenEdgeLabelRatio}
        onChange={(val) => onUpdateConfig({ hiddenEdgeLabelRatio: 1 - val })}
      />
    </div>

    <div class="config-field">
      <PercentSliderPopover
        label="Shown Names"
        value={1 - config.hiddenNodeLabelRatio}
        onChange={(val) => onUpdateConfig({ hiddenNodeLabelRatio: 1 - val })}
      />
    </div>

    <LayoutAndFontControls settings={config} onUpdate={onUpdateConfig} onReset={onResetConfig} />
  </div>
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

  .config-bar__content {
    display: flex;
    align-items: flex-end;
    flex-wrap: wrap;
    gap: inherit;
    width: 100%;
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
      z-index: 70;
      justify-content: flex-end;
      min-height: 3.5rem;
      padding: 0.5rem 0.75rem;
    }

    .config-bar.is-open {
      z-index: 85;
    }

    .config-bar__content {
      position: fixed;
      top: 0;
      right: 0;
      bottom: 0;
      z-index: 90;
      display: flex;
      flex-direction: column;
      align-items: stretch;
      justify-content: flex-start;
      gap: 1rem;
      width: min(90vw, 24rem);
      padding: 4.75rem 1rem 1rem;
      overflow-y: auto;
      border-left: 1px solid var(--color-border);
      background: var(--color-surface);
      box-shadow: -12px 0 32px rgb(15 23 42 / 20%);
      visibility: hidden;
      transform: translateX(105%);
      transition:
        transform 180ms ease,
        visibility 180ms ease;
    }

    .config-bar__content.is-open {
      visibility: visible;
      transform: translateX(0);
    }

    .config-field input {
      width: 100%;
    }
  }

  @media (max-width: 48rem) and (prefers-reduced-motion: reduce) {
    .config-bar__content {
      transition: none;
    }
  }
</style>
