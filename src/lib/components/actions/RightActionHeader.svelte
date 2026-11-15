<script lang="ts">
  import type { ExportFormat } from '#lib/types';
  import ExportSplitButton from './ExportSplitButton.svelte';

  let {
    exportFormat = 'PNG',
    isExporting = false,
    showGeneratorActions = false,
    canExportStandalone = false,
    isViewingAll = false,
    onReshuffle,
    onExportStandalone,
    onToggleViewAll,
    onViewFormat = () => undefined,
    onSelectFormat = () => undefined
  }: {
    exportFormat?: ExportFormat;
    isExporting?: boolean;
    showGeneratorActions?: boolean;
    canExportStandalone?: boolean;
    isViewingAll?: boolean;
    onReshuffle?: () => void;
    onExportStandalone?: () => void;
    onToggleViewAll?: () => void;
    onViewFormat?: () => void;
    onSelectFormat?: (fmt: ExportFormat) => void;
  } = $props();
</script>

<header class="right-action-header" aria-label="Map actions">
  {#if showGeneratorActions}
    <button type="button" class="action-btn" onclick={() => onReshuffle?.()}>
      <svg
        width="16"
        height="16"
        viewBox="0 0 16 16"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        aria-hidden="true"
        focusable="false"
      >
        <path d="M2 4h9M8 1l3 3-3 3M14 12H5M8 15l-3-3 3-3" />
      </svg>
      Reshuffle
    </button>
    <button
      type="button"
      class="action-btn view-all-btn"
      class:is-active={isViewingAll}
      aria-pressed={isViewingAll}
      onclick={() => onToggleViewAll?.()}
    >
      View All
    </button>
    <button
      type="button"
      class="action-btn export-btn"
      disabled={!canExportStandalone}
      onclick={() => onExportStandalone?.()}
    >
      <svg
        width="16"
        height="16"
        viewBox="0 0 16 16"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        aria-hidden="true"
        focusable="false"
      >
        <path d="M9 2h5v5M14 2L8 8M11 9v4H3V5h4" />
      </svg>
      Export
    </button>
  {/if}
  <ExportSplitButton
    format={exportFormat}
    isExporting={isExporting}
    onAction={onViewFormat}
    onSelectFormat={onSelectFormat}
  />
</header>

<style>
  .right-action-header {
    position: relative;
    z-index: 30;
    display: flex;
    flex: 0 0 auto;
    justify-content: flex-end;
    align-items: center;
    gap: 0.5rem;
    min-height: 3.75rem;
    padding: 0.75rem 1rem;
    border-bottom: 1px solid var(--color-border, #dfe4ea);
    background: var(--color-surface, #ffffff);
  }

  .action-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.45rem;
    min-height: 2.35rem;
    padding: 0.5rem 0.85rem;
    border: 1px solid var(--color-border, #d5dce4);
    border-radius: 0.5rem;
    background: var(--color-surface, #ffffff);
    color: var(--color-text, #243447);
    font-size: 0.8125rem;
    font-weight: 600;
    line-height: 1;
    white-space: nowrap;
    cursor: pointer;
    transition:
      background-color 150ms ease,
      border-color 150ms ease,
      box-shadow 150ms ease,
      color 150ms ease;
  }

  .action-btn:hover:not(:disabled) {
    border-color: var(--color-primary, #16a34a);
    background: var(--color-surface-muted, #f4f7fb);
    color: var(--color-primary, #15803d);
  }

  .action-btn:focus-visible {
    outline: 2px solid var(--color-primary, #16a34a);
    outline-offset: 2px;
  }

  .view-all-btn.is-active {
    border-color: var(--color-primary, #16a34a);
    background: var(--color-primary-soft, #eafbef);
    color: var(--color-primary, #15803d);
  }

  .action-btn:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }

  .action-btn svg {
    flex: 0 0 auto;
  }

  @media (max-width: 48rem) {
    .right-action-header {
      min-height: 3.25rem;
      padding: 0.625rem 0.75rem;
    }
  }
</style>
