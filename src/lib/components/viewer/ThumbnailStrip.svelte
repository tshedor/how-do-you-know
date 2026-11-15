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
