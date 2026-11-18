<script lang="ts">
  import { tick } from 'svelte';
  import { parseRelationshipsCsv, type RelationshipCsvRow } from '#lib/csv';
  import type { RelationshipField, RelationshipRow } from '#lib/types';
  import RelationshipRowItem from './RelationshipRowItem.svelte';
  import HowToPlayModal from './HowToPlayModal.svelte';

  const MIN_PANE_WIDTH = 340;
  const MIN_GRAPH_WIDTH = 320;

  interface Props {
    rows?: RelationshipRow[];
    knownNames?: string[];
    highlightedRowId?: string | null;
    focusField?: RelationshipField | null;
    highlightPulse?: number;
    showVisibilityToggles?: boolean;
    hiddenPeople?: readonly string[];
    hiddenEdgeRowIds?: readonly string[];
    onAddRow?: () => void;
    onImportRows?: (rows: RelationshipCsvRow[]) => void;
    onResize?: (width: number) => void;
    onUpdateRow?: (id: string, patch: Partial<Omit<RelationshipRow, 'id'>>) => void;
    onRemoveRow?: (id: string) => void;
    onTogglePersonHidden?: (name: string) => void;
    onToggleEdgeHidden?: (rowId: string) => void;
  }

  let {
    rows = [],
    knownNames = [],
    highlightedRowId = null,
    focusField = null,
    highlightPulse = 0,
    showVisibilityToggles = false,
    hiddenPeople = [],
    hiddenEdgeRowIds = [],
    onAddRow = () => {},
    onImportRows,
    onResize = () => {},
    onUpdateRow = () => {},
    onRemoveRow = () => {},
    onTogglePersonHidden,
    onToggleEdgeHidden
  }: Props = $props();

  let hiddenPeopleSet = $derived(new Set(hiddenPeople));
  let hiddenEdgeRowIdSet = $derived(new Set(hiddenEdgeRowIds));
  let rowsEl = $state<HTMLUListElement | null>(null);
  let paneEl = $state<HTMLElement | null>(null);
  let fileInputEl = $state<HTMLInputElement | null>(null);
  let isDrawerOpen = $state(false);
  let isHowToPlayOpen = $state(false);
  let importError = $state<string | null>(null);
  let resizePointerId: number | null = null;
  let resizeStartX = 0;
  let resizeStartWidth = 0;

  $effect(() => {
    if (
      highlightedRowId &&
      focusField &&
      highlightPulse > 0 &&
      window.matchMedia('(max-width: 48rem)').matches
    ) {
      isDrawerOpen = true;
    }
  });

  function handleWindowKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      if (isHowToPlayOpen) {
        closeHowToPlay();
      } else {
        isDrawerOpen = false;
      }
    }
  }

  function clampPaneWidth(width: number): number {
    const maximum = Math.max(MIN_PANE_WIDTH, window.innerWidth - MIN_GRAPH_WIDTH);
    return Math.min(maximum, Math.max(MIN_PANE_WIDTH, width));
  }

  function handleResizeStart(event: PointerEvent): void {
    const handle = event.currentTarget;
    if (event.button !== 0 || !(handle instanceof HTMLButtonElement) || !paneEl) return;
    event.preventDefault();
    resizePointerId = event.pointerId;
    resizeStartX = event.clientX;
    resizeStartWidth = paneEl.getBoundingClientRect().width;
    handle.setPointerCapture(event.pointerId);
  }

  function handleResizeMove(event: PointerEvent): void {
    if (event.pointerId !== resizePointerId) return;
    onResize(clampPaneWidth(resizeStartWidth + event.clientX - resizeStartX));
  }

  function handleResizeEnd(event: PointerEvent): void {
    const handle = event.currentTarget;
    if (event.pointerId !== resizePointerId || !(handle instanceof HTMLButtonElement)) return;
    if (handle.hasPointerCapture(event.pointerId)) {
      handle.releasePointerCapture(event.pointerId);
    }
    resizePointerId = null;
  }

  function handleResizeKeydown(event: KeyboardEvent): void {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
    event.preventDefault();
    const direction = event.key === 'ArrowRight' ? 1 : -1;
    const distance = event.shiftKey ? 48 : 16;
    onResize(
      clampPaneWidth(
        (paneEl?.getBoundingClientRect().width ?? MIN_PANE_WIDTH) + direction * distance
      )
    );
  }

  function closeHowToPlay(): void {
    isHowToPlayOpen = false;
  }

async function handleCsvImport(event: Event): Promise<void> {
    const input = event.currentTarget;
    if (!(input instanceof HTMLInputElement) || !onImportRows) return;
    const file = input.files?.[0];
    if (!file) return;
    const importRows = onImportRows;
    importError = null;
    try {
      const importedRows = parseRelationshipsCsv(await file.text());
      if (importedRows.length === 0) {
        throw new Error('The CSV must contain at least one connection.');
      }
      importRows(importedRows);
    } catch (error) {
      importError = error instanceof Error ? error.message : 'Unable to import the CSV.';
    } finally {
      input.value = '';
    }
  }

  async function advanceRowFocus(index: number): Promise<void> {
    if (index === rows.length - 1) {
      onAddRow();
    }
    await tick();
    const nextRow = rowsEl?.querySelectorAll<HTMLElement>('.row-item')[index + 1];
    nextRow?.querySelector<HTMLInputElement>('input[type="text"]')?.focus();
  }
</script>

<svelte:window onkeydown={handleWindowKeydown} />

<button
  type="button"
  class="mobile-connections-toggle"
  aria-label="Edit connections"
  aria-controls="connections-drawer"
  aria-expanded={isDrawerOpen}
  title="Edit connections"
  onclick={() => (isDrawerOpen = true)}
>
  <svg
    width="26"
    height="26"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
  >
    <circle cx="7" cy="7" r="3" />
    <circle cx="17" cy="17" r="3" />
    <path d="m9.5 9.5 5 5" />
  </svg>
</button>
{#if isDrawerOpen}
  <button
    type="button"
    class="mobile-drawer-backdrop"
    aria-label="Close connections drawer"
    onclick={() => (isDrawerOpen = false)}
  ></button>
{/if}

<aside
  bind:this={paneEl}
  id="connections-drawer"
  class="left-pane"
  class:is-open={isDrawerOpen}
  aria-label="Relationship editor"
  role={isDrawerOpen ? 'dialog' : undefined}
  aria-modal={isDrawerOpen ? true : undefined}
>
  <div class="mobile-drawer-heading">
    <span>Connections</span>
    <button
      type="button"
      class="mobile-drawer-close"
      aria-label="Close connections drawer"
      onclick={() => (isDrawerOpen = false)}
    >
      &times;
    </button>
  </div>
  <header class="left-pane__header">
    <div class="left-pane__title-row">
      <span class="left-pane__title">How Do You Know: The Game</span>
      <button
        type="button"
        class="left-pane__help-btn"
        aria-label="How does this game work?"
        aria-haspopup="dialog"
        title="How does this game work?"
        onclick={() => (isHowToPlayOpen = true)}
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="10" />
          <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
      </button>
    </div>
  </header>

  <ul class="left-pane__rows" bind:this={rowsEl}>
    {#each rows as row, index (row.id)}
      <RelationshipRowItem
        {row}
        {knownNames}
        isHighlighted={row.id === highlightedRowId}
        {focusField}
        {highlightPulse}
        {showVisibilityToggles}
        isFromHidden={hiddenPeopleSet.has(row.from)}
        isToHidden={hiddenPeopleSet.has(row.to)}
        isEdgeHidden={hiddenEdgeRowIdSet.has(row.id)}
        onUpdate={(patch) => onUpdateRow(row.id, patch)}
        onRemove={() => onRemoveRow(row.id)}
        onAdvanceFocus={() => void advanceRowFocus(index)}
        onTogglePersonHidden={onTogglePersonHidden}
        onToggleEdgeHidden={onToggleEdgeHidden ? () => onToggleEdgeHidden(row.id) : undefined}
      />
    {:else}
      <li class="left-pane__empty">No connections yet. Add one below.</li>
    {/each}
  </ul>

  <footer class="left-pane__footer">
    <button type="button" class="add-row-btn" onclick={() => onAddRow()}>+ Add Connection</button>
    {#if onImportRows}
      <input
        bind:this={fileInputEl}
        class="left-pane__file-input"
        type="file"
        accept=".csv,text/csv"
        aria-label="CSV file"
        onchange={handleCsvImport}
      />
      <button type="button" class="import-csv-btn" onclick={() => fileInputEl?.click()}>
        <span>Import CSV</span>
        <span class="csv-help" aria-hidden="true">
          ?
          <span class="csv-help__tooltip">From,To,Connection</span>
        </span>
      </button>
    {/if}
    {#if importError}
      <p class="import-error" role="alert">{importError}</p>
    {/if}
  </footer>
  <button
    type="button"
    class="left-pane__resize-handle"
    aria-label="Resize connections pane with arrow keys or by dragging"
    onpointerdown={handleResizeStart}
    onpointermove={handleResizeMove}
    onpointerup={handleResizeEnd}
    onpointercancel={handleResizeEnd}
    onkeydown={handleResizeKeydown}
  ></button>
</aside>

<HowToPlayModal open={isHowToPlayOpen} onClose={closeHowToPlay} />

<style>
  .left-pane {
    position: relative;
    display: flex;
    flex-direction: column;
    width: 100%;
    height: 100%;
    min-height: 0;
    overflow: hidden;
    color: var(--color-text);
    background: var(--color-surface);
  }

  .left-pane__header {
    z-index: 10;
    flex: none;
    padding: 15px 20px 11px;
    border-bottom: 1px solid var(--color-border);
    background: var(--color-surface-subtle);
  }

  .left-pane__title-row {
    display: flex;
    align-items: center;
    gap: 0.6rem;
  }

  .left-pane__title {
    color: var(--color-text);
    font-size: 1rem;
    font-weight: 700;
    line-height: 1.2;
    letter-spacing: 0.02em;
  }

  .left-pane__help-btn {
    display: inline-flex;
    flex: none;
    align-items: center;
    justify-content: center;
    width: 1.5rem;
    height: 1.5rem;
    padding: 0;
    border: 1px solid var(--color-border-strong);
    border-radius: 50%;
    background: var(--color-surface);
    color: var(--color-text-muted);
    transition:
      color var(--transition-fast),
      border-color var(--transition-fast),
      background-color var(--transition-fast);
  }

  .left-pane__help-btn:hover,
  .left-pane__help-btn:focus-visible {
    border-color: var(--color-accent);
    color: var(--color-accent);
    background: var(--color-accent-soft);
  }

  .left-pane__rows {
    flex: 1 1 auto;
    min-height: 0;
    margin: 0;
    padding: 0 0 190px;
    overflow-x: visible;
    overflow-y: auto;
    overscroll-behavior: contain;
    scroll-padding-block: 70px 200px;
    scrollbar-gutter: stable;
    list-style: none;
  }

  .left-pane__empty {
    margin: 8px;
    padding: 28px 18px;
    border: 1px dashed var(--color-border-strong);
    border-radius: 9px;
    color: var(--color-text-muted);
    font-size: 0.875rem;
    text-align: center;
    background: var(--color-surface-subtle);
  }

  .left-pane__footer {
    position: sticky;
    bottom: 0;
    z-index: 30;
    display: flex;
    flex: none;
    flex-wrap: wrap;
    gap: 8px;
    padding: 12px;
    border-top: 1px solid var(--color-border);
    background: rgb(255 255 255 / 96%);
    box-shadow: 0 -8px 20px rgb(16 24 40 / 4%);
    backdrop-filter: blur(8px);
  }

  .left-pane__file-input {
    display: none;
  }

  .left-pane__resize-handle {
    position: absolute;
    top: 0;
    right: 0;
    bottom: 0;
    z-index: 45;
    width: 10px;
    padding: 0;
    border: 0;
    background: transparent;
    cursor: col-resize;
    touch-action: none;
  }

  .left-pane__resize-handle::after {
    position: absolute;
    top: 0;
    bottom: 0;
    left: 4px;
    width: 2px;
    background: transparent;
    content: '';
    transition: background-color var(--transition-fast);
  }

  .left-pane__resize-handle:hover::after,
  .left-pane__resize-handle:focus-visible::after {
    background: var(--color-accent);
  }

  .left-pane__resize-handle:focus-visible {
    outline: none;
  }

  .add-row-btn {
    min-height: 38px;
    padding: 8px 13px;
    border: 1px solid transparent;
    border-radius: var(--radius-control);
    font-size: 0.8125rem;
    font-weight: 650;
    line-height: 1.2;
    transition:
      color var(--transition-fast),
      border-color var(--transition-fast),
      background-color var(--transition-fast),
      box-shadow var(--transition-fast);
  }

  .add-row-btn {
    flex: 1 1 auto;
    color: #ffffff;
    border-color: var(--color-accent);
    background: var(--color-accent);
    box-shadow: 0 1px 2px rgb(16 24 40 / 8%);
  }

  .add-row-btn:hover {
    border-color: var(--color-accent-hover);
    background: var(--color-accent-hover);
  }

  .import-csv-btn {
    display: inline-flex;
    flex: 1 1 auto;
    align-items: center;
    justify-content: center;
    gap: 7px;
    min-height: 38px;
    padding: 8px 11px;
    border: 1px solid var(--color-border-strong);
    border-radius: var(--radius-control);
    background: var(--color-surface);
    color: var(--color-text);
    font-size: 0.8125rem;
    font-weight: 650;
    white-space: nowrap;
  }

  .import-csv-btn:hover {
    border-color: var(--color-accent);
    color: var(--color-accent-hover);
    background: var(--color-accent-soft);
  }

  .csv-help {
    position: relative;
    display: inline-flex;
    flex: none;
    align-items: center;
    justify-content: center;
    width: 16px;
    height: 16px;
    border: 1px solid currentColor;
    border-radius: 50%;
    font-size: 0.6875rem;
    line-height: 1;
  }

  .csv-help__tooltip {
    position: absolute;
    right: -8px;
    bottom: calc(100% + 10px);
    z-index: 50;
    width: max-content;
    padding: 6px 8px;
    border-radius: 5px;
    background: var(--color-text);
    color: var(--color-surface);
    box-shadow: var(--shadow-dropdown);
    font-size: 0.75rem;
    font-weight: 500;
    opacity: 0;
    pointer-events: none;
    transform: translateY(3px);
    transition:
      opacity var(--transition-fast),
      transform var(--transition-fast);
  }

  .csv-help:hover .csv-help__tooltip {
    opacity: 1;
    transform: translateY(0);
  }

  .import-error {
    flex-basis: 100%;
    margin: 0;
    color: var(--color-danger);
    font-size: 0.75rem;
    line-height: 1.4;
  }

  @media (max-width: 48rem) {
    .left-pane__resize-handle {
      display: none;
    }

    .left-pane {
      position: fixed;
      inset: 0 auto 0 0;
      z-index: 100;
      width: min(92vw, 26rem);
      max-width: 100%;
      height: 100dvh;
      visibility: hidden;
      box-shadow: 12px 0 32px rgb(15 23 42 / 20%);
      transform: translateX(-105%);
      transition:
        transform 180ms ease,
        visibility 180ms ease;
    }

    .left-pane.is-open {
      visibility: visible;
      transform: translateX(0);
    }

    .left-pane__header {
      display: none;
    }

    .left-pane__rows {
      padding-top: 3.75rem;
    }

    .left-pane__footer {
      padding-bottom: max(0.75rem, env(safe-area-inset-bottom));
    }
  }

  @media (max-width: 48rem) and (prefers-reduced-motion: reduce) {
    .left-pane {
      transition: none;
    }
  }
</style>
