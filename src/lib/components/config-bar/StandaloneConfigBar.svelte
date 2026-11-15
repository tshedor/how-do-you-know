<script lang="ts">
  import type { PageExportSettings } from '#lib/types';
  import { DEFAULT_PAGE_SETTINGS } from '#lib/constants/sampleData';
  import LayoutAndFontControls from './LayoutAndFontControls.svelte';

  let {
    settings = { ...DEFAULT_PAGE_SETTINGS },
    onUpdateSettings = () => {}
  }: {
    settings?: PageExportSettings;
    onUpdateSettings?: (patch: Partial<PageExportSettings>) => void;
  } = $props();
</script>

<footer class="config-bar config-bar--standalone">
  <LayoutAndFontControls {settings} onUpdate={onUpdateSettings} />
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

  @media (max-width: 48rem) {
    .config-bar {
      justify-content: flex-start;
      gap: 0.625rem 0.75rem;
      padding: 0.625rem 0.75rem;
    }
  }
</style>
