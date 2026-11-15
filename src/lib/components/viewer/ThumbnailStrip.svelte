<script lang="ts">
  import type { RenderedGraph } from '#lib/types';

  let {
    graphs = [],
    selectedIndex = 0,
    isViewingAll = false,
    onSelect = () => undefined
  }: {
    graphs?: RenderedGraph[];
    selectedIndex?: number;
    isViewingAll?: boolean;
    onSelect?: (index: number) => void;
  } = $props();
</script>

{#if graphs.length > 1}
  <nav class="thumbnail-strip" aria-label="Generated graphs">
    {#each graphs as graph, i (graph.index)}
      <button
        type="button"
        class="thumbnail-card"
        class:is-selected={!isViewingAll && selectedIndex === i}
        aria-pressed={!isViewingAll && selectedIndex === i}
        aria-label="View graph {i + 1}"
        onclick={() => onSelect(i)}
      >
        <span class="thumbnail-card__preview">{@html graph.svg}</span>
        <span class="thumbnail-card__badge">{i + 1}</span>
      </button>
    {/each}
  </nav>
{/if}

<style>
  .thumbnail-strip {
    position: relative;
    z-index: 10;
    display: flex;
    flex: 0 0 auto;
    gap: 0.75rem;
    padding: 0.75rem 1rem;
    overflow-x: auto;
    overflow-y: hidden;
    border-bottom: 1px solid var(--color-border, #dfe4ea);
    background: var(--color-surface-muted, #f4f7fb);
    scrollbar-width: thin;
    scrollbar-color: var(--color-border, #cbd5e1) transparent;
    scroll-snap-type: x proximity;
  }

  .thumbnail-card {
    position: relative;
    display: block;
    flex: 0 0 4.5rem;
    width: 4.5rem;
    height: 3.375rem;
    padding: 0.35rem;
    overflow: hidden;
    border: 2px solid var(--color-border, #d5dce4);
    border-radius: 0.6rem;
    background: var(--color-surface, #ffffff);
    box-shadow: 0 2px 5px rgb(15 23 42 / 6%);
    cursor: pointer;
    scroll-snap-align: start;
    transition:
      border-color 150ms ease,
      box-shadow 150ms ease,
      transform 150ms ease;
  }

  .thumbnail-card:hover {
    border-color: var(--color-primary, #16a34a);
    transform: translateY(-1px);
  }

  .thumbnail-card:focus-visible {
    outline: 2px solid var(--color-primary, #16a34a);
    outline-offset: 2px;
  }

  .thumbnail-card.is-selected {
    border-color: var(--color-primary, #16a34a);
    box-shadow:
      0 0 0 3px var(--color-primary-soft, #eafbef),
      0 4px 10px rgb(15 23 42 / 10%);
  }

  .thumbnail-card__preview {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
    min-width: 0;
    min-height: 0;
    overflow: hidden;
    border-radius: 0.3rem;
    background: #ffffff;
    pointer-events: none;
  }

  .thumbnail-card__preview :global(svg) {
    display: block;
    width: 100%;
    height: 100%;
    max-width: 100%;
    max-height: 100%;
  }

  .thumbnail-card__badge {
    position: absolute;
    top: 0.25rem;
    right: 0.25rem;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 1rem;
    height: 1rem;
    padding: 0 0.25rem;
    border-radius: 999px;
    background: rgb(15 23 42 / 78%);
    color: #ffffff;
    font-size: 0.6875rem;
    font-weight: 700;
    font-variant-numeric: tabular-nums;
    line-height: 1;
    box-shadow: 0 1px 3px rgb(15 23 42 / 20%);
  }

  .thumbnail-card.is-selected .thumbnail-card__badge {
    background: var(--color-primary, #16a34a);
  }

  @media (max-width: 48rem) {
    .thumbnail-strip {
      gap: 0.625rem;
      padding: 0.625rem 0.75rem;
    }

    .thumbnail-card {
      flex-basis: 3.75rem;
      width: 3.75rem;
      height: 2.875rem;
    }
  }
</style>
