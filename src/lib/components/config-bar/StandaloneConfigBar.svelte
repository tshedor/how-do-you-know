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
