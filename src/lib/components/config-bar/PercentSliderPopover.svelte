<script lang="ts">
  let {
    label,
    value,
    onChange
  }: {
    label: string;
    value: number;
    onChange: (val: number) => void;
  } = $props();

  let popoverOpen = $state(false);
  let rootEl: HTMLDivElement | null = $state(null);

  function handleToggleClick(): void {
    popoverOpen = !popoverOpen;
  }

  function handleRangeInput(event: Event): void {
    const input = event.currentTarget as HTMLInputElement;
    const next = Number.parseFloat(input.value);
    onChange(Number.isFinite(next) ? Math.min(1, Math.max(0, next)) : 0);
  }

  function handlePopoverKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      popoverOpen = false;
    }
  }

  $effect(() => {
    if (!popoverOpen) return;
    const handleDocumentClick = (event: MouseEvent) => {
      const target = event.target as Node | null;
      if (rootEl && target && !rootEl.contains(target)) {
        popoverOpen = false;
      }
    };
    document.addEventListener('click', handleDocumentClick);
    return () => {
      document.removeEventListener('click', handleDocumentClick);
    };
  });
</script>

<div class="percent-control" bind:this={rootEl}>
  <button
    type="button"
    class="percent-control__trigger"
    aria-haspopup="dialog"
    aria-expanded={popoverOpen}
    onclick={handleToggleClick}
  >
    <span class="percent-control__label">{label}</span>
    <span class="percent-control__value">{Math.round(value * 100)}%</span>
  </button>
  {#if popoverOpen}
    <div
      class="percent-control__popover"
      role="dialog"
      tabindex="-1"
      aria-label={label}
      onkeydown={handlePopoverKeydown}
    >
      <label class="percent-control__field">
        <span class="percent-control__field-label">{label}</span>
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={value}
          style:--range-progress={`${value * 100}%`}
          aria-label={label}
          oninput={handleRangeInput}
        />
      </label>
      <span class="percent-control__readout">{Math.round(value * 100)}%</span>
    </div>
  {/if}
</div>

<style>
  .percent-control {
    position: relative;
    display: inline-flex;
    flex: 0 0 auto;
  }

  .percent-control__trigger {
    display: inline-flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.65rem;
    min-height: 2.35rem;
    padding: 0.35rem 0.45rem 0.35rem 0.7rem;
    border: 1px solid var(--color-border, #d5dce4);
    border-radius: 0.55rem;
    background: var(--color-surface, #ffffff);
    color: var(--color-text, #243447);
    cursor: pointer;
    transition:
      border-color 150ms ease,
      background-color 150ms ease,
      box-shadow 150ms ease;
  }

  .percent-control__trigger:hover,
  .percent-control__trigger[aria-expanded='true'] {
    border-color: var(--color-primary, #16a34a);
    background: var(--color-primary-soft, #eafbef);
  }

  .percent-control__trigger:focus-visible {
    outline: 2px solid var(--color-primary, #16a34a);
    outline-offset: 2px;
  }

  .percent-control__label {
    font-size: 0.75rem;
    font-weight: 600;
    white-space: nowrap;
  }

  .percent-control__value {
    min-width: 2.75rem;
    padding: 0.25rem 0.5rem;
    border-radius: 999px;
    background: var(--color-primary-soft, #eafbef);
    color: var(--color-primary, #15803d);
    font-size: 0.75rem;
    font-weight: 750;
    font-variant-numeric: tabular-nums;
    text-align: center;
  }

  .percent-control__popover {
    position: absolute;
    right: 0;
    bottom: calc(100% + 8px);
    z-index: 40;
    display: flex;
    align-items: flex-end;
    gap: 0.75rem;
    width: 15rem;
    padding: 0.85rem;
    border: 1px solid var(--color-border, #dfe4ea);
    border-radius: 0.65rem;
    background: var(--color-surface, #ffffff);
    box-shadow: 0 12px 30px rgb(15 23 42 / 18%);
  }

  .percent-control__field {
    display: flex;
    flex: 1;
    flex-direction: column;
    gap: 0.5rem;
    min-width: 0;
  }

  .percent-control__field-label {
    color: var(--color-text, #243447);
    font-size: 0.75rem;
    font-weight: 650;
  }

  .percent-control__field input {
    width: 100%;
    margin: 0;
    accent-color: var(--color-primary, #16a34a);
    cursor: pointer;
  }

  .percent-control__field input:focus-visible {
    outline: 2px solid var(--color-primary, #16a34a);
    outline-offset: 3px;
  }

  .percent-control__readout {
    min-width: 2.75rem;
    color: var(--color-primary, #15803d);
    font-size: 0.875rem;
    font-weight: 750;
    font-variant-numeric: tabular-nums;
    text-align: right;
  }
</style>
