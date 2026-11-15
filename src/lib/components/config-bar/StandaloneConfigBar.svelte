<script lang="ts">
  import type { PageExportSettings } from '#lib/types';
  import { DEFAULT_PAGE_SETTINGS } from '#lib/constants/sampleData';
  import LayoutAndFontControls from './LayoutAndFontControls.svelte';

  let {
    settings = { ...DEFAULT_PAGE_SETTINGS },
    onUpdateSettings = () => {},
    onResetSettings = () => {}
  }: {
    settings?: PageExportSettings;
    onUpdateSettings?: (patch: Partial<PageExportSettings>) => void;
    onResetSettings?: () => void;
  } = $props();

  let isDrawerOpen = $state(false);

  function handleWindowKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      isDrawerOpen = false;
    }
  }
</script>

<svelte:window onkeydown={handleWindowKeydown} />

<footer class="config-bar config-bar--standalone" class:is-open={isDrawerOpen}>
  <button
    type="button"
    class="mobile-toolbar-toggle"
    aria-label="Open graph settings"
    aria-controls="standalone-settings-drawer"
    aria-expanded={isDrawerOpen}
    title="Graph settings"
    onclick={() => (isDrawerOpen = true)}
  >
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true">
      <path d="M6 3v14M14 3v14" />
      <rect x="3.5" y="6" width="5" height="4" rx="1" fill="currentColor" stroke="none" />
      <rect x="11.5" y="11" width="5" height="4" rx="1" fill="currentColor" stroke="none" />
    </svg>
  </button>
  {#if isDrawerOpen}
    <button
      type="button"
      class="mobile-drawer-backdrop"
      aria-label="Close graph settings"
      onclick={() => (isDrawerOpen = false)}
    ></button>
  {/if}
  <div
    id="standalone-settings-drawer"
    class="config-bar__content"
    class:is-open={isDrawerOpen}
    aria-label="Graph settings"
    role={isDrawerOpen ? 'dialog' : undefined}
    aria-modal={isDrawerOpen ? true : undefined}
  >
    <div class="mobile-drawer-heading">
      <span>Graph Settings</span>
      <button
        type="button"
        class="mobile-drawer-close"
        aria-label="Close graph settings"
        onclick={() => (isDrawerOpen = false)}
      >
        &times;
      </button>
    </div>
    <LayoutAndFontControls {settings} onUpdate={onUpdateSettings} onReset={onResetSettings} />
  </div>
</footer>

<style>
  .config-bar {
    position: relative;
    z-index: 20;
    display: flex;
    flex: 0 0 auto;
    align-items: flex-end;
    justify-content: flex-end;
    flex-wrap: wrap;
    gap: 0.75rem 1rem;
    padding: 0.75rem 1rem;
    border-top: 1px solid var(--color-border, #dfe4ea);
    background: var(--color-surface, #ffffff);
    box-shadow: 0 -4px 16px rgb(15 23 42 / 4%);
  }

  .config-bar__content {
    display: flex;
    align-items: flex-end;
    justify-content: flex-end;
    flex-wrap: wrap;
    gap: inherit;
    width: 100%;
  }

  @media (max-width: 48rem) {
    .config-bar {
      z-index: 70;
      min-height: 3.5rem;
      padding: 0.5rem 0.75rem;
    }

    .config-bar.is-open {
      z-index: 85;
    }

    .config-bar__content {
      position: fixed;
      top: 0;
      right: 0;
      bottom: 0;
      z-index: 90;
      display: flex;
      flex-direction: column;
      align-items: stretch;
      justify-content: flex-start;
      gap: 1rem;
      width: min(90vw, 24rem);
      padding: 4.75rem 1rem 1rem;
      overflow-y: auto;
      border-left: 1px solid var(--color-border);
      background: var(--color-surface);
      box-shadow: -12px 0 32px rgb(15 23 42 / 20%);
      visibility: hidden;
      transform: translateX(105%);
      transition:
        transform 180ms ease,
        visibility 180ms ease;
    }

    .config-bar__content.is-open {
      visibility: visible;
      transform: translateX(0);
    }
  }

  @media (max-width: 48rem) and (prefers-reduced-motion: reduce) {
    .config-bar__content {
      transition: none;
    }
  }
</style>
