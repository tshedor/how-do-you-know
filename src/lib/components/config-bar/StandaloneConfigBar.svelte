<script lang="ts">
  import type { PageExportSettings } from '#lib/types';
  import LayoutAndFontControls from './LayoutAndFontControls.svelte';

  let {
    settings,
    onUpdateSettings
  }: {
    settings: PageExportSettings;
    onUpdateSettings: (patch: Partial<PageExportSettings>) => void;
  } = $props();
</script>

<footer class="config-bar config-bar--standalone">
  <LayoutAndFontControls {settings} onUpdate={onUpdateSettings} />
</footer>
