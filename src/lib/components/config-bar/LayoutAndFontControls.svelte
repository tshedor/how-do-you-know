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

<style>
  .config-field {
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
    gap: 0.3rem;
    min-width: 0;
  }

  .config-field__label {
    color: var(--color-text-muted, #64748b);
    font-size: 0.6875rem;
    font-weight: 650;
    line-height: 1.2;
    white-space: nowrap;
  }

  .config-field input,
  .config-field select {
    height: 2.35rem;
    padding: 0.4rem 0.5rem;
    border: 1px solid var(--color-border, #d5dce4);
    border-radius: 0.45rem;
    background: var(--color-surface, #ffffff);
    color: var(--color-text, #243447);
    font-size: 0.8125rem;
  }

  .config-field input {
    width: 4.75rem;
    font-variant-numeric: tabular-nums;
  }

  .config-field select {
    min-width: 6.75rem;
    padding-right: 1.75rem;
    cursor: pointer;
  }

  .config-field input:hover,
  .config-field select:hover {
    border-color: var(--color-text-muted, #94a3b8);
  }

  .config-field input:focus-visible,
  .config-field select:focus-visible {
    border-color: var(--color-primary, #2563eb);
    outline: 2px solid var(--color-primary-soft, #dbeafe);
    outline-offset: 0;
  }

  .orientation-group {
    display: flex;
    align-items: center;
    align-self: flex-end;
    gap: 0.2rem;
    min-height: 2.35rem;
    padding: 0.2rem;
    border: 1px solid var(--color-border, #d5dce4);
    border-radius: 0.55rem;
    background: var(--color-surface-muted, #f4f7fb);
  }

  .orientation-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.35rem;
    min-height: 1.85rem;
    padding: 0.35rem 0.55rem;
    border: 0;
    border-radius: 0.35rem;
    background: transparent;
    color: var(--color-text-muted, #64748b);
    font-size: 0.75rem;
    font-weight: 600;
    line-height: 1;
    white-space: nowrap;
    cursor: pointer;
    transition:
      background-color 150ms ease,
      color 150ms ease,
      box-shadow 150ms ease;
  }

  .orientation-btn:hover:not(.is-active) {
    background: var(--color-surface, #ffffff);
    color: var(--color-text, #243447);
  }

  .orientation-btn.is-active {
    background: var(--color-primary, #2563eb);
    color: #ffffff;
    box-shadow: 0 1px 3px rgb(15 23 42 / 18%);
  }

  .orientation-btn:focus-visible {
    outline: 2px solid var(--color-primary, #2563eb);
    outline-offset: 2px;
  }

  .orientation-btn svg {
    flex: 0 0 auto;
    fill: none;
    stroke: currentColor;
    stroke-width: 1.5;
  }

  @media (max-width: 64rem) {
    .orientation-btn span {
      position: absolute;
      width: 1px;
      height: 1px;
      padding: 0;
      overflow: hidden;
      clip: rect(0, 0, 0, 0);
      white-space: nowrap;
      border: 0;
    }

    .orientation-btn {
      width: 1.95rem;
      padding: 0.35rem;
    }
  }
</style>
