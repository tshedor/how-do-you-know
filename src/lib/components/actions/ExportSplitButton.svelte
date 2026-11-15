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

<style>
  .split-cta {
    position: relative;
    display: inline-flex;
    flex: 0 0 auto;
  }

  .action-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-height: 2.35rem;
    border: 1px solid var(--color-primary, #2563eb);
    background: var(--color-primary, #2563eb);
    color: #ffffff;
    font-size: 0.8125rem;
    font-weight: 650;
    line-height: 1;
    white-space: nowrap;
    cursor: pointer;
    transition:
      background-color 150ms ease,
      border-color 150ms ease,
      box-shadow 150ms ease;
  }

  .split-cta__main {
    min-width: 6.25rem;
    gap: 0.4rem;
    padding: 0.5rem 0.9rem;
    border-radius: 0.5rem 0 0 0.5rem;
  }

  .split-cta__trigger {
    width: 2.25rem;
    padding: 0;
    border-left-color: rgb(255 255 255 / 35%);
    border-radius: 0 0.5rem 0.5rem 0;
  }

  .action-btn:hover:not(:disabled) {
    border-color: var(--color-primary-hover, #1d4ed8);
    background: var(--color-primary-hover, #1d4ed8);
  }

  .action-btn:focus-visible {
    position: relative;
    z-index: 1;
    outline: 2px solid var(--color-primary, #2563eb);
    outline-offset: 2px;
  }

  .action-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .split-cta__menu {
    position: absolute;
    top: calc(100% + 6px);
    right: 0;
    z-index: 40;
    display: grid;
    min-width: 8.5rem;
    padding: 0.3rem;
    overflow: hidden;
    border: 1px solid var(--color-border, #dfe4ea);
    border-radius: 0.55rem;
    background: var(--color-surface, #ffffff);
    box-shadow: 0 12px 30px rgb(15 23 42 / 16%);
  }

  .split-cta__option {
    display: flex;
    align-items: center;
    gap: 0.45rem;
    width: 100%;
    min-height: 2.25rem;
    padding: 0.5rem 0.65rem;
    border: 0;
    border-radius: 0.35rem;
    background: transparent;
    color: var(--color-text, #243447);
    font-size: 0.8125rem;
    font-weight: 550;
    text-align: left;
    cursor: pointer;
  }

  .split-cta__option:hover {
    background: var(--color-surface-muted, #f1f5f9);
  }

  .split-cta__option:focus-visible {
    outline: 2px solid var(--color-primary, #2563eb);
    outline-offset: -2px;
  }

  .split-cta__option.is-selected {
    background: var(--color-primary-soft, #eff6ff);
    color: var(--color-primary, #1d4ed8);
    font-weight: 700;
  }

  .split-cta__option svg {
    flex: 0 0 auto;
  }
</style>
