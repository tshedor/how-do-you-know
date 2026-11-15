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
          aria-label={label}
          oninput={handleRangeInput}
        />
      </label>
      <span class="percent-control__readout">{Math.round(value * 100)}%</span>
    </div>
  {/if}
</div>
