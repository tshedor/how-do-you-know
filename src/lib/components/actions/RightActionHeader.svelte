<script lang="ts">
  import type { ExportFormat } from '#lib/types';
  import ExportSplitButton from './ExportSplitButton.svelte';

  let {
    exportFormat = 'PNG',
    isExporting = false,
    showGeneratorActions = false,
    canExportStandalone = false,
    onReshuffle,
    onExportStandalone,
    onViewFormat = () => undefined,
    onSelectFormat = () => undefined
  }: {
    exportFormat?: ExportFormat;
    isExporting?: boolean;
    showGeneratorActions?: boolean;
    canExportStandalone?: boolean;
    onReshuffle?: () => void;
    onExportStandalone?: () => void;
    onViewFormat?: () => void;
    onSelectFormat?: (fmt: ExportFormat) => void;
  } = $props();
</script>

<header class="right-action-header" aria-label="Map actions">
  {#if showGeneratorActions}
    <button type="button" class="action-btn" onclick={() => onReshuffle?.()}>
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
        <path d="M2 4h9M8 1l3 3-3 3M14 12H5M8 15l-3-3 3-3" />
      </svg>
      Reshuffle
    </button>
    <button
      type="button"
      class="action-btn export-btn"
      disabled={!canExportStandalone}
      onclick={() => onExportStandalone?.()}
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
        <path d="M9 2h5v5M14 2L8 8M11 9v4H3V5h4" />
      </svg>
      Export
    </button>
  {/if}
  <ExportSplitButton
    format={exportFormat}
    isExporting={isExporting}
    onAction={onViewFormat}
    onSelectFormat={onSelectFormat}
  />
</header>
