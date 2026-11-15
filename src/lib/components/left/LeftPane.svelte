<script lang="ts">
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
    isViewingAll?: boolean;
    onToggleViewAll?: () => void;
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
    isViewingAll = false,
    onToggleViewAll,
    onAddRow = () => {},
    onUpdateRow = () => {},
    onRemoveRow = () => {},
    onTogglePersonHidden,
    onToggleEdgeHidden
  }: Props = $props();

  let hiddenPeopleSet = $derived(new Set(hiddenPeople));
  let hiddenEdgeRowIdSet = $derived(new Set(hiddenEdgeRowIds));
</script>

<aside class="left-pane" aria-label="Relationship editor">
  <header class="left-pane__header">
    <div class="left-pane__columns" aria-hidden="true">
      <span>Person A</span>
      <span>Person B</span>
      <span>Relationship</span>
      <span></span>
    </div>
  </header>

  <ul class="left-pane__rows">
    {#each rows as row (row.id)}
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
        onTogglePersonHidden={onTogglePersonHidden}
        onToggleEdgeHidden={onToggleEdgeHidden ? () => onToggleEdgeHidden(row.id) : undefined}
      />
    {:else}
      <li class="left-pane__empty">No connections yet. Add one below.</li>
    {/each}
  </ul>

  <footer class="left-pane__footer">
    <button type="button" class="add-row-btn" onclick={() => onAddRow()}>+ Add Connection</button>
    {#if onToggleViewAll}
      <button
        type="button"
        class="view-all-btn"
        class:is-active={isViewingAll}
        aria-pressed={isViewingAll}
        onclick={() => onToggleViewAll?.()}
      >
        View All
      </button>
    {/if}
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
    padding: 9px 12px 190px;
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

  .add-row-btn,
  .view-all-btn {
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

  .view-all-btn {
    flex: 0 0 auto;
    color: #344054;
    border-color: var(--color-border-strong);
    background: var(--color-surface);
  }

  .view-all-btn:hover {
    border-color: #aab4c3;
    background: var(--color-surface-subtle);
  }

  .view-all-btn.is-active {
    color: var(--color-accent);
    border-color: #aebdf4;
    background: var(--color-accent-soft);
    box-shadow: inset 0 0 0 1px rgb(49 87 213 / 7%);
  }
</style>
