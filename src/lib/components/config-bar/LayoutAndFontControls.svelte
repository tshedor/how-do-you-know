<script lang="ts">
  import type { PageExportSettings } from '#lib/types';

  let {
    settings,
    onUpdate
  }: {
    settings: PageExportSettings;
    onUpdate: (patch: Partial<PageExportSettings>) => void;
  } = $props();

  const PAGE_SIZES = ['8.5x11', '11x17', '8.3x11.7'] as const;

  function clampInt(raw: number, min: number, max: number, fallback: number): number {
    if (!Number.isFinite(raw)) return fallback;
    return Math.min(max, Math.max(min, Math.round(raw)));
  }

  function handleNodeFontSizeInput(event: Event): void {
    const input = event.currentTarget as HTMLInputElement;
    onUpdate({
      nodeFontSize: clampInt(Number.parseFloat(input.value), 12, 120, 42)
    });
  }

  function handleEdgeFontSizeInput(event: Event): void {
    const input = event.currentTarget as HTMLInputElement;
    onUpdate({
      edgeFontSize: clampInt(Number.parseFloat(input.value), 10, 120, 38)
    });
  }

  function handlePageSizeChange(event: Event): void {
    const select = event.currentTarget as HTMLSelectElement;
    const next = select.value as (typeof PAGE_SIZES)[number];
    if (PAGE_SIZES.includes(next)) {
      onUpdate({ pageSize: next });
    }
  }
</script>

<label class="config-field">
  <span class="config-field__label">Node Font Size</span>
  <input
    type="number"
    min="12"
    max="120"
    step="1"
    value={settings.nodeFontSize}
    aria-label="Node font size"
    oninput={handleNodeFontSizeInput}
  />
</label>

<label class="config-field">
  <span class="config-field__label">Edge Font Size</span>
  <input
    type="number"
    min="10"
    max="120"
    step="1"
    value={settings.edgeFontSize}
    aria-label="Edge font size"
    oninput={handleEdgeFontSizeInput}
  />
</label>

<label class="config-field">
  <span class="config-field__label">Page Size</span>
  <select
    value={settings.pageSize}
    aria-label="Page size"
    onchange={handlePageSizeChange}
  >
    {#each PAGE_SIZES as size (size)}
      <option value={size}>{size}</option>
    {/each}
  </select>
</label>

<div class="orientation-group" role="group" aria-label="Orientation">
  <button
    type="button"
    class="orientation-btn"
    class:is-active={settings.orientation === 'landscape'}
    aria-pressed={settings.orientation === 'landscape'}
    onclick={() => onUpdate({ orientation: 'landscape' })}
  >
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <rect x="1.5" y="4.5" width="15" height="9" rx="1.5" />
    </svg>
    <span>Landscape</span>
  </button>
  <button
    type="button"
    class="orientation-btn"
    class:is-active={settings.orientation === 'portrait'}
    aria-pressed={settings.orientation === 'portrait'}
    onclick={() => onUpdate({ orientation: 'portrait' })}
  >
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <rect x="4.5" y="1.5" width="9" height="15" rx="1.5" />
    </svg>
    <span>Portrait</span>
  </button>
</div>
