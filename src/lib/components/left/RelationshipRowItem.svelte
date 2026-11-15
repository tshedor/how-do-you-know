<script lang="ts">
  import { tick } from 'svelte';
  import type { RelationshipField, RelationshipRow } from '#lib/types';
  import NameCombobox from './NameCombobox.svelte';

  interface Props {
    row: RelationshipRow;
    knownNames?: string[];
    isHighlighted?: boolean;
    focusField?: RelationshipField | null;
    highlightPulse?: number;
    showVisibilityToggles?: boolean;
    isFromHidden?: boolean;
    isToHidden?: boolean;
    isEdgeHidden?: boolean;
    onUpdate?: (patch: Partial<Omit<RelationshipRow, 'id'>>) => void;
    onRemove?: () => void;
    onAdvanceFocus?: () => void;
    onTogglePersonHidden?: (name: string) => void;
    onToggleEdgeHidden?: () => void;
  }

  let {
    row,
    knownNames = [],
    isHighlighted = false,
    focusField = null,
    highlightPulse = 0,
    showVisibilityToggles = false,
    isFromHidden = false,
    isToHidden = false,
    isEdgeHidden = false,
    onUpdate = () => {},
    onRemove = () => {},
    onAdvanceFocus = () => {},
    onTogglePersonHidden,
    onToggleEdgeHidden
  }: Props = $props();

  let rowEl = $state<HTMLLIElement | null>(null);

  $effect(() => {
    if (isHighlighted && highlightPulse >= 0 && rowEl) {
      rowEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      if (focusField) {
        const selector =
          focusField === 'relation'
            ? '.row-item__relation-input'
            : `.row-item__cell--${focusField} input`;
        void tick().then(() => {
          rowEl?.querySelector<HTMLInputElement>(selector)?.focus({ preventScroll: true });
        });
      }
    }
  });

  function handleRelationKeydown(event: KeyboardEvent): void {
    if (event.key !== 'Tab' || event.shiftKey) return;
    event.preventDefault();
    onAdvanceFocus();
  }
</script>

<li bind:this={rowEl} class="row-item" class:is-highlighted={isHighlighted} data-row-id={row.id}>
  <div class="row-item__columns">
    <div class="row-item__cell row-item__cell--from">
      {#if showVisibilityToggles}
        <button
          type="button"
          tabindex="-1"
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
        options={knownNames.filter((name) => name.trim() !== row.to.trim())}
        placeholder="Name"
        onChange={(val) => onUpdate({ from: val.trim() === row.to.trim() ? '' : val })}
      />
    </div>

    <div class="row-item__cell row-item__cell--to">
      {#if showVisibilityToggles}
        <button
          type="button"
          tabindex="-1"
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
        options={knownNames.filter((name) => name.trim() !== row.from.trim())}
        placeholder="Name"
        onChange={(val) => onUpdate({ to: val.trim() === row.from.trim() ? '' : val })}
      />
    </div>

    <div class="row-item__cell row-item__cell--relation">
      {#if showVisibilityToggles}
        <button
          type="button"
          tabindex="-1"
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
        onkeydown={handleRelationKeydown}
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
        tabindex="-1"
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

<style>
  .row-item {
    position: relative;
    z-index: 0;
    margin: 0;
    background: inherit;
    transition:
      box-shadow var(--transition-fast),
      background-color var(--transition-fast);
  }

  .row-item:nth-child(even) {
    background: #f8fafc;
  }

  .row-item:focus-within {
    z-index: 40;
    background: #e9eef2;
  }

  .row-item.is-highlighted {
    z-index: 2;
    background: var(--color-accent-soft);
    box-shadow: inset 3px 0 0 var(--color-accent);
    animation: row-highlight 1.35s ease-out;
  }

  .row-item__columns {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) 30px;
    gap: 8px;
    align-items: center;
    padding: 12px 20px;
  }

  .row-item__cell {
    display: flex;
    align-items: center;
    gap: 3px;
    min-width: 0;
  }

  .row-item__cell--relation {
    grid-column: 1 / 3;
    grid-row: 2;
    margin-left: 20px;
  }

  .row-item__cell--actions {
    grid-column: 3;
    grid-row: 1;
    justify-content: center;
  }

  .row-item__relation-input {
    width: 100%;
    min-width: 0;
    height: 36px;
    padding: 7px 9px;
    border: 0;
    border-bottom: 1px solid var(--color-border-strong);
    border-radius: 0;
    outline: none;
    color: var(--color-text);
    font-size: 0.8125rem;
    line-height: 1.2;
    background: var(--color-surface);
    transition:
      border-color var(--transition-fast),
      box-shadow var(--transition-fast);
  }

  .row-item__relation-input::placeholder {
    color: #98a2b3;
  }

  .row-item__relation-input:hover {
    border-color: #aab4c3;
  }

  .row-item__relation-input:focus {
    border-color: var(--color-accent);
    box-shadow: none;
  }

  .visibility-toggle,
  .row-item__delete {
    display: inline-flex;
    flex: none;
    align-items: center;
    justify-content: center;
    padding: 0;
    border: 0;
    border-radius: 5px;
    background: transparent;
    transition:
      color var(--transition-fast),
      opacity var(--transition-fast),
      background-color var(--transition-fast);
  }

  .visibility-toggle {
    width: 22px;
    height: 30px;
    color: #667085;
  }

  .visibility-toggle:hover {
    color: var(--color-accent);
    background: var(--color-accent-soft);
  }

  .visibility-toggle.is-hidden {
    color: #98a2b3;
    opacity: 0.48;
  }

  .visibility-toggle.is-hidden:hover {
    color: var(--color-accent);
    opacity: 1;
  }

  .visibility-toggle :global(svg),
  .row-item__delete :global(svg) {
    display: block;
  }

  .row-item__delete {
    width: 28px;
    height: 32px;
    color: #98a2b3;
  }

  .row-item__delete:hover {
    color: var(--color-danger);
    background: #fff1f0;
  }

  @keyframes row-highlight {
    0% {
      box-shadow: inset 5px 0 0 var(--color-accent);
      background: #bbf7d0;
    }
    100% {
      box-shadow: inset 3px 0 0 var(--color-accent);
      background: var(--color-accent-soft);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .row-item,
    .visibility-toggle,
    .row-item__delete,
    .row-item__relation-input {
      transition: none;
    }

    .row-item.is-highlighted {
      animation: none;
      box-shadow: inset 3px 0 0 var(--color-accent);
    }
  }
</style>
