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

<style>
  .graph-canvas {
    position: relative;
    display: block;
    flex: 1;
    min-width: 0;
    min-height: 0;
    padding: 1.5rem;
    overflow: auto;
    overscroll-behavior: contain;
    background: var(--color-canvas, #edf1f5);
    scrollbar-width: thin;
  }

  .graph-canvas__stage {
    display: flex;
    align-items: center;
    justify-content: center;
    width: max-content;
    min-width: 100%;
    height: max-content;
    min-height: 100%;
    overflow: visible;
    border: 1px solid var(--color-border, #d5dce4);
    background: #ffffff;
    box-shadow:
      0 2px 5px rgb(15 23 42 / 8%),
      0 14px 35px rgb(15 23 42 / 8%);
    transition: opacity 150ms ease;
  }

  .graph-canvas__stage :global(svg) {
    display: block;
    flex: none;
    max-width: none;
    max-height: none;
    width: auto;
    height: auto;
  }

  .graph-canvas__stage :global(svg g[id^='person:']),
  .graph-canvas__stage :global(svg g[id^='edge:']) {
    cursor: pointer;
  }

  .graph-canvas__stage :global(svg g[id^='person:']:hover),
  .graph-canvas__stage :global(svg g[id^='edge:']:hover) {
    opacity: 0.78;
  }

  .graph-canvas[aria-busy='true'] .graph-canvas__stage {
    opacity: 0.6;
  }

  .graph-canvas__status {
    z-index: 2;
    max-width: min(32rem, 90%);
    margin: 0;
    padding: 0.7rem 0.9rem;
    border: 1px solid var(--color-border, #dfe4ea);
    border-radius: 0.55rem;
    background: var(--color-surface, #ffffff);
    color: var(--color-text-muted, #64748b);
    box-shadow: 0 5px 18px rgb(15 23 42 / 10%);
    font-size: 0.8125rem;
    line-height: 1.45;
    text-align: center;
  }

  .graph-canvas__stage + .graph-canvas__status {
    position: absolute;
    bottom: 1rem;
    left: 50%;
    transform: translateX(-50%);
  }

  .graph-canvas__status[role='alert'] {
    border-color: var(--color-danger, #dc2626);
    color: var(--color-danger, #b91c1c);
  }

  @media (max-width: 48rem) {
    .graph-canvas {
      padding: 0.75rem;
    }
  }
</style>
