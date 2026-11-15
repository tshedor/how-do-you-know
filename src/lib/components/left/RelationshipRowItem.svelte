<script lang="ts">
  import type { RelationshipRow } from '#lib/types';
  import NameCombobox from './NameCombobox.svelte';

  interface Props {
    row: RelationshipRow;
    knownNames?: string[];
    isHighlighted?: boolean;
    highlightPulse?: number;
    showVisibilityToggles?: boolean;
    isFromHidden?: boolean;
    isToHidden?: boolean;
    isEdgeHidden?: boolean;
    onUpdate?: (patch: Partial<Omit<RelationshipRow, 'id'>>) => void;
    onRemove?: () => void;
    onTogglePersonHidden?: (name: string) => void;
    onToggleEdgeHidden?: () => void;
  }

  let {
    row,
    knownNames = [],
    isHighlighted = false,
    highlightPulse = 0,
    showVisibilityToggles = false,
    isFromHidden = false,
    isToHidden = false,
    isEdgeHidden = false,
    onUpdate = () => {},
    onRemove = () => {},
    onTogglePersonHidden,
    onToggleEdgeHidden
  }: Props = $props();

  let rowEl = $state<HTMLLIElement | null>(null);

  $effect(() => {
    if (isHighlighted && highlightPulse >= 0 && rowEl) {
      rowEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  });
</script>

<li bind:this={rowEl} class="row-item" class:is-highlighted={isHighlighted} data-row-id={row.id}>
  <div class="row-item__columns">
    <div class="row-item__cell row-item__cell--from">
      {#if showVisibilityToggles}
        <button
          type="button"
          class="visibility-toggle"
          class:is-hidden={isFromHidden}
          aria-pressed={isFromHidden}
          aria-label={isFromHidden ? `Show ${row.from}` : `Hide ${row.from}`}
          onclick={() => onTogglePersonHidden?.(row.from)}
        >
          {#if isFromHidden}
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
              <path
                d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"
              />
              <line x1="1" y1="1" x2="23" y2="23" />
            </svg>
          {:else}
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
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          {/if}
        </button>
      {/if}
      <NameCombobox
        value={row.from}
        options={knownNames}
        placeholder="Name"
        onChange={(val) => onUpdate({ from: val })}
      />
    </div>

    <div class="row-item__cell row-item__cell--to">
      {#if showVisibilityToggles}
        <button
          type="button"
          class="visibility-toggle"
          class:is-hidden={isToHidden}
          aria-pressed={isToHidden}
          aria-label={isToHidden ? `Show ${row.to}` : `Hide ${row.to}`}
          onclick={() => onTogglePersonHidden?.(row.to)}
        >
          {#if isToHidden}
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
              <path
                d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"
              />
              <line x1="1" y1="1" x2="23" y2="23" />
            </svg>
          {:else}
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
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          {/if}
        </button>
      {/if}
      <NameCombobox
        value={row.to}
        options={knownNames}
        placeholder="Name"
        onChange={(val) => onUpdate({ to: val })}
      />
    </div>

    <div class="row-item__cell row-item__cell--relation">
      {#if showVisibilityToggles}
        <button
          type="button"
          class="visibility-toggle"
          class:is-hidden={isEdgeHidden}
          aria-pressed={isEdgeHidden}
          aria-label={
            isEdgeHidden ? `Show label for ${row.from} and ${row.to}` : `Hide label for ${row.from} and ${row.to}`
          }
          onclick={() => onToggleEdgeHidden?.()}
        >
          {#if isEdgeHidden}
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
              <path
                d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"
              />
              <line x1="1" y1="1" x2="23" y2="23" />
            </svg>
          {:else}
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
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          {/if}
        </button>
      {/if}
      <input
        type="text"
        class="row-item__relation-input"
        aria-label="Relationship between {row.from || 'person A'} and {row.to || 'person B'}"
        placeholder="Relationship"
        value={row.relation}
        oninput={(event) => {
          const target = event.currentTarget;
          if (target instanceof HTMLInputElement) {
            onUpdate({ relation: target.value });
          }
        }}
      />
    </div>

    <div class="row-item__cell row-item__cell--actions">
      <button
        type="button"
        class="row-item__delete"
        aria-label="Delete connection"
        onclick={() => onRemove()}
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
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
    </div>
  </div>
</li>
