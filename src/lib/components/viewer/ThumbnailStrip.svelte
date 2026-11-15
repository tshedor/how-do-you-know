<script lang="ts">
  import type { GeneratedGraph } from '#lib/types';

  let {
    graphs = [],
    selectedGraphIndex = 0,
    onSelect = () => undefined
  }: {
    graphs?: GeneratedGraph[];
    selectedGraphIndex?: number;
    onSelect?: (index: number) => void;
  } = $props();
</script>

<nav aria-label="Generated graphs">
  {#each graphs as graph (graph.index)}
    <button
      type="button"
      aria-pressed={selectedGraphIndex === graph.index}
      onclick={() => onSelect(graph.index)}
    >
      Graph {graph.index + 1}
    </button>
  {/each}
</nav>
