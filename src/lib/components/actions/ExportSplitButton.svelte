<script lang="ts">
  import type { ExportFormat } from '#lib/types';

  let {
    format,
    isExporting = false,
    disabled = false,
    onAction,
    onSelectFormat
  }: {
    format: ExportFormat;
    isExporting?: boolean;
    disabled?: boolean;
    onAction: () => void;
    onSelectFormat: (fmt: ExportFormat) => void;
  } = $props();

  const formatOptions: ExportFormat[] = ['PNG', 'SVG'];

  let menuOpen = $state(false);
  let rootEl = $state<HTMLDivElement>();

  function handleWindowPointerDown(event: PointerEvent) {
    if (!menuOpen) return;
    if (event.target instanceof Node && rootEl && !rootEl.contains(event.target)) {
      menuOpen = false;
    }
  }

  function handleWindowKeydown(event: KeyboardEvent) {
    if (menuOpen && event.key === 'Escape') {
      menuOpen = false;
    }
  }

  function selectFormat(fmt: ExportFormat) {
    onSelectFormat(fmt);
    menuOpen = false;
  }
</script>

<svelte:window onpointerdown={handleWindowPointerDown} onkeydown={handleWindowKeydown} />

<div class="split-cta" bind:this={rootEl}>
  <button
    type="button"
    class="action-btn split-cta__main"
    disabled={disabled}
    onclick={() => onAction()}
  >
    {isExporting ? 'Generating...' : `View ${format}`}
  </button>
  <button
    type="button"
    class="action-btn split-cta__trigger"
    aria-haspopup="menu"
    aria-expanded={menuOpen}
    aria-label="Choose export format"
    disabled={disabled}
    onclick={() => (menuOpen = !menuOpen)}
  >
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M3 6l5 5 5-5" />
    </svg>
  </button>
  {#if menuOpen}
    <div class="split-cta__menu" role="menu">
      {#each formatOptions as option (option)}
        <button
          type="button"
          role="menuitemradio"
          class="split-cta__option"
          class:is-selected={option === format}
          aria-checked={option === format}
          onclick={() => selectFormat(option)}
        >
          {#if option === format}
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              aria-hidden="true"
              focusable="false"
            >
              <path d="M3 8.5l3.5 3.5L13 5" />
            </svg>
          {/if}
          {option}
        </button>
      {/each}
    </div>
  {/if}
</div>
