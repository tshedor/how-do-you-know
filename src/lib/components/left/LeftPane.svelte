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
