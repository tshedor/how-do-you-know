<script lang="ts">
  import { tick } from 'svelte';
  import type { RelationshipRow } from '#lib/types';
  import RelationshipRowItem from './RelationshipRowItem.svelte';

  interface Props {
    rows?: RelationshipRow[];
    knownNames?: string[];
    highlightedRowId?: string | null;
    highlightPulse?: number;
    showVisibilityToggles?: boolean;
    hiddenPeople?: readonly string[];
    hiddenEdgeRowIds?: readonly string[];
    onAddRow?: () => void;
    onUpdateRow?: (id: string, patch: Partial<Omit<RelationshipRow, 'id'>>) => void;
    onRemoveRow?: (id: string) => void;
    onTogglePersonHidden?: (name: string) => void;
    onToggleEdgeHidden?: (rowId: string) => void;
  }

  let {
    rows = [],
    knownNames = [],
    highlightedRowId = null,
    highlightPulse = 0,
    showVisibilityToggles = false,
    hiddenPeople = [],
    hiddenEdgeRowIds = [],
    onAddRow = () => {},
    onUpdateRow = () => {},
    onRemoveRow = () => {},
    onTogglePersonHidden,
    onToggleEdgeHidden
  }: Props = $props();

  let hiddenPeopleSet = $derived(new Set(hiddenPeople));
  let hiddenEdgeRowIdSet = $derived(new Set(hiddenEdgeRowIds));
  let rowsEl = $state<HTMLUListElement | null>(null);
  let isDrawerOpen = $state(false);

  function handleWindowKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      isDrawerOpen = false;
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
    <div class="left-pane__columns" aria-hidden="true">
      <span>Person A</span>
      <span>Person B</span>
      <span>Relationship</span>
      <span></span>
    </div>
  </header>

  <ul class="left-pane__rows" bind:this={rowsEl}>
    {#each rows as row, index (row.id)}
      <RelationshipRowItem
        {row}
        {knownNames}
        isHighlighted={row.id === highlightedRowId}
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
  </footer>
</aside>

<style>
  .left-pane {
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

  .left-pane__columns {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) minmax(0, 1.12fr) 30px;
    gap: 8px;
    align-items: center;
    color: var(--color-text-muted);
    font-size: 0.6875rem;
    font-weight: 700;
    letter-spacing: 0.055em;
    line-height: 1.2;
    text-transform: uppercase;
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
    gap: 8px;
    padding: 12px;
    border-top: 1px solid var(--color-border);
    background: rgb(255 255 255 / 96%);
    box-shadow: 0 -8px 20px rgb(16 24 40 / 4%);
    backdrop-filter: blur(8px);
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

  @media (max-width: 48rem) {
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
      margin-top: 3.75rem;
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
