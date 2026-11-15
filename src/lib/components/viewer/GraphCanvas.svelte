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

  let zoom = $state(1);
  let panX = $state(0);
  let panY = $state(0);
  let isPanning = $state(false);
  let activePointerId: number | null = null;
  let startPointerX = 0;
  let startPointerY = 0;
  let lastPointerX = 0;
  let lastPointerY = 0;
  let didPan = false;

  $effect(() => {
    graph;
    zoom = 1;
    panX = 0;
    panY = 0;
    isPanning = false;
    activePointerId = null;
    didPan = false;
  });

  function stageClickAction(node: HTMLElement): { destroy(): void } {
    const handleClick = (event: MouseEvent): void => {
      if (didPan) {
        didPan = false;
        return;
      }
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

  function isMobileViewport(): boolean {
    return window.matchMedia('(max-width: 48rem)').matches;
  }

  function handleWheel(event: WheelEvent): void {
    if (!graph || isMobileViewport()) return;
    event.preventDefault();
    const factor = event.deltaY > 0 ? 1.05 : 1 / 1.05;
    zoom = Math.min(8, Math.max(0.25, zoom * factor));
  }

  function resetView(): void {
    zoom = 1;
    panX = 0;
    panY = 0;
  }

  function handlePointerDown(event: PointerEvent): void {
    const viewport = event.currentTarget;
    if (
      !graph ||
      isMobileViewport() ||
      event.button !== 0 ||
      !(viewport instanceof HTMLDivElement)
    ) {
      return;
    }
    activePointerId = event.pointerId;
    startPointerX = event.clientX;
    startPointerY = event.clientY;
    lastPointerX = event.clientX;
    lastPointerY = event.clientY;
    didPan = false;
    isPanning = false;
  }

  function handlePointerMove(event: PointerEvent): void {
    if (activePointerId !== event.pointerId) return;
    if (!didPan) {
      const distance = Math.hypot(event.clientX - startPointerX, event.clientY - startPointerY);
      if (distance < 4) return;
      didPan = true;
      isPanning = true;
      const viewport = event.currentTarget;
      if (viewport instanceof HTMLDivElement) {
        viewport.setPointerCapture(event.pointerId);
      }
    }

    const deltaX = event.clientX - lastPointerX;
    const deltaY = event.clientY - lastPointerY;
    panX += deltaX;
    panY += deltaY;
    lastPointerX = event.clientX;
    lastPointerY = event.clientY;
  }

  function handlePointerUp(event: PointerEvent): void {
    const viewport = event.currentTarget;
    if (activePointerId !== event.pointerId || !(viewport instanceof HTMLDivElement)) return;
    if (viewport.hasPointerCapture(event.pointerId)) {
      viewport.releasePointerCapture(event.pointerId);
    }
    activePointerId = null;
    isPanning = false;
  }

  function handlePointerCancel(event: PointerEvent): void {
    if (activePointerId !== event.pointerId) return;
    activePointerId = null;
    isPanning = false;
    didPan = false;
  }
</script>

<div
  class="graph-canvas"
  aria-busy={isRendering}
  aria-label="Interactive graph preview"
  role="region"
  data-panning={isPanning}
  use:stageClickAction
  onwheel={handleWheel}
  onpointerdown={handlePointerDown}
  onpointermove={handlePointerMove}
  onpointerup={handlePointerUp}
  onpointercancel={handlePointerCancel}
>
  {#if graph}
    <div class="graph-canvas__stage">
      <div
        class="graph-canvas__zoom"
        style:transform={`translate(${panX}px, ${panY}px) scale(${zoom})`}
      >
        {@html graph.svg}
      </div>
    </div>
    <button
      type="button"
      class="graph-canvas__reset"
      aria-label="Reset graph zoom and position"
      onpointerdown={(event) => event.stopPropagation()}
      onclick={resetView}
    >
      Reset
    </button>
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
    padding: 0;
    overflow: hidden;
    overscroll-behavior: none;
    background: var(--color-canvas, #edf1f5);
    cursor: grab;
    touch-action: none;
    user-select: none;
  }

  .graph-canvas[data-panning='true'] {
    cursor: grabbing;
  }

  .graph-canvas__stage {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
    overflow: hidden;
    transition: opacity 150ms ease;
  }

  .graph-canvas__zoom {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
    transform-origin: center;
    will-change: transform;
  }

  .graph-canvas__stage :global(svg) {
    display: block;
    flex: none;
    max-width: 100%;
    max-height: 100%;
    width: auto;
    height: auto;
    background: #ffffff;
    box-shadow: 0 0 0 1px var(--color-border, #d5dce4);
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

  .graph-canvas__reset {
    position: absolute;
    right: 0.75rem;
    bottom: 0.75rem;
    z-index: 3;
    min-height: 1.9rem;
    padding: 0.35rem 0.65rem;
    border: 1px solid var(--color-border, #d5dce4);
    border-radius: 0.5rem;
    background: rgb(255 255 255 / 94%);
    color: var(--color-text, #243447);
    box-shadow: 0 3px 12px rgb(15 23 42 / 16%);
    font-size: 0.75rem;
    font-weight: 650;
    cursor: pointer;
    backdrop-filter: blur(6px);
  }

  .graph-canvas__reset:hover {
    border-color: var(--color-primary, #16a34a);
    color: var(--color-primary, #15803d);
  }

  .graph-canvas__reset:focus-visible {
    outline: 2px solid var(--color-primary, #16a34a);
    outline-offset: 2px;
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

  .graph-canvas__stage ~ .graph-canvas__status {
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
      cursor: default;
    }

    .graph-canvas__reset {
      display: none;
    }
  }
</style>
