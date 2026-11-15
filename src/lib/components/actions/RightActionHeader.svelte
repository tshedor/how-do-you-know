<script lang="ts">
  import type { ExportFormat } from '#lib/types';
  import ExportSplitButton from './ExportSplitButton.svelte';

  let {
    exportFormat = 'PNG',
    isExporting = false,
    showGeneratorActions = false,
    canExportStandalone = false,
    canViewGraph = false,
    isViewingAll = false,
    onReshuffle,
    onExportStandalone,
    onExportGraphs,
    onToggleViewAll,
    onViewFormat = () => undefined,
    onSelectFormat = () => undefined
  }: {
    exportFormat?: ExportFormat;
    isExporting?: boolean;
    showGeneratorActions?: boolean;
    canExportStandalone?: boolean;
    canViewGraph?: boolean;
    isViewingAll?: boolean;
    onReshuffle?: () => void;
    onExportStandalone?: () => void;
    onExportGraphs?: () => void;
    onToggleViewAll?: () => void;
    onViewFormat?: (format: ExportFormat) => void;
    onSelectFormat?: (fmt: ExportFormat) => void;
  } = $props();

  let viewFormat = $state<ExportFormat>('PNG');
  let isDrawerOpen = $state(false);

  function handleWindowKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      isDrawerOpen = false;
    }
  }
</script>

<svelte:window onkeydown={handleWindowKeydown} />

<header class="right-action-header" class:is-open={isDrawerOpen} aria-label="Map actions">
  <button
    type="button"
    class="mobile-toolbar-toggle"
    aria-label="Open graph actions"
    aria-controls="graph-actions-drawer"
    aria-expanded={isDrawerOpen}
    title="Graph actions"
    onclick={() => (isDrawerOpen = true)}
  >
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true">
      <path d="M3 5h14M3 10h14M3 15h14" />
      <circle cx="7" cy="5" r="1.5" fill="currentColor" stroke="none" />
      <circle cx="13" cy="10" r="1.5" fill="currentColor" stroke="none" />
      <circle cx="8" cy="15" r="1.5" fill="currentColor" stroke="none" />
    </svg>
  </button>
  {#if isDrawerOpen}
    <button
      type="button"
      class="mobile-drawer-backdrop"
      aria-label="Close graph actions"
      onclick={() => (isDrawerOpen = false)}
    ></button>
  {/if}
  <div
    id="graph-actions-drawer"
    class="right-action-header__content"
    class:is-open={isDrawerOpen}
    aria-label="Graph actions"
    role={isDrawerOpen ? 'dialog' : undefined}
    aria-modal={isDrawerOpen ? true : undefined}
  >
    <div class="mobile-drawer-heading">
      <span>Graph Actions</span>
      <button
        type="button"
        class="mobile-drawer-close"
        aria-label="Close graph actions"
        onclick={() => (isDrawerOpen = false)}
      >
        &times;
      </button>
    </div>
    {#if showGeneratorActions}
      <button
        type="button"
        class="action-btn view-all-btn"
        class:is-active={isViewingAll}
        aria-pressed={isViewingAll}
        onclick={() => onToggleViewAll?.()}
      >
        View All
      </button>
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
        Detach
      </button>
    {/if}
    <ExportSplitButton
      format={viewFormat}
      actionLabel="View"
      secondary={true}
      disabled={!canViewGraph || isExporting}
      onAction={() => onViewFormat(viewFormat)}
      onSelectFormat={(format) => (viewFormat = format)}
    />
    {#if showGeneratorActions}
      <ExportSplitButton
        format={exportFormat}
        actionLabel="Export"
        isExporting={isExporting}
        disabled={!canViewGraph}
        onAction={() => onExportGraphs?.()}
        onSelectFormat={onSelectFormat}
      />
    {/if}
  </div>
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

  .right-action-header__content {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    justify-content: flex-end;
    gap: 0.5rem;
    width: 100%;
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

  .view-all-btn {
    margin-right: auto;
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
      z-index: 70;
      min-height: 3.5rem;
      padding: 0.5rem 0.75rem;
    }

    .right-action-header.is-open {
      z-index: 85;
    }

    .right-action-header__content {
      position: fixed;
      top: 0;
      right: 0;
      bottom: 0;
      z-index: 90;
      display: flex;
      flex-direction: column;
      flex-wrap: nowrap;
      align-items: stretch;
      justify-content: flex-start;
      gap: 0.75rem;
      width: min(86vw, 20rem);
      padding: 4.75rem 1rem 1rem;
      border-left: 1px solid var(--color-border);
      background: var(--color-surface);
      box-shadow: -12px 0 32px rgb(15 23 42 / 20%);
      visibility: hidden;
      transform: translateX(105%);
      transition:
        transform 180ms ease,
        visibility 180ms ease;
    }

    .right-action-header__content.is-open {
      visibility: visible;
      transform: translateX(0);
    }

    .right-action-header__content .action-btn {
      width: 100%;
    }

    .right-action-header__content .view-all-btn {
      margin-right: 0;
      margin-bottom: 0.5rem;
    }

    .right-action-header__content :global(.split-cta) {
      display: flex;
      width: 100%;
    }

    .right-action-header__content :global(.split-cta__main) {
      flex: 1;
    }
  }

  @media (max-width: 48rem) and (prefers-reduced-motion: reduce) {
    .right-action-header__content {
      transition: none;
    }
  }
</style>
