<script lang="ts">
  import type { RenderedGraph } from '#lib/types';

  let {
    graph = null,
    isRendering = false,
    errorMessage = null,
    onPersonClick = () => undefined,
    onEdgeClick = () => undefined
  }: {
    graph?: RenderedGraph | null;
    isRendering?: boolean;
    errorMessage?: string | null;
    onPersonClick?: (name: string) => void;
    onEdgeClick?: (rowId: string) => void;
  } = $props();

  function stageClickAction(node: HTMLElement): { destroy(): void } {
    const handleClick = (event: MouseEvent): void => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      const nodeGroup = target.closest('g[id]');
      if (!nodeGroup) return;
      const groupId = nodeGroup.getAttribute('id');
      if (!groupId) return;
      if (groupId.startsWith('edge:')) {
        onEdgeClick(decodeURIComponent(groupId.slice(5)));
      } else if (groupId.startsWith('person:')) {
        onPersonClick(decodeURIComponent(groupId.slice(7)));
      }
    };
    node.addEventListener('click', handleClick);
    return {
      destroy() {
        node.removeEventListener('click', handleClick);
      }
    };
  }
</script>

<div class="graph-canvas" aria-busy={isRendering}>
  {#if graph}
    <div class="graph-canvas__stage" use:stageClickAction>
      {@html graph.svg}
    </div>
  {/if}
  {#if isRendering}
    <p class="graph-canvas__status" role="status">Rendering graph…</p>
  {/if}
  {#if errorMessage}
    <p class="graph-canvas__status" role="alert">{errorMessage}</p>
  {/if}
  {#if !graph && !isRendering && !errorMessage}
    <p class="graph-canvas__status">No graph to display.</p>
  {/if}
</div>
