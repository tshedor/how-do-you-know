<script lang="ts">
  let {
    svg = '',
    isExporting = false
  }: {
    svg?: string;
    isExporting?: boolean;
  } = $props();
</script>

<div class="graph-canvas" aria-busy={isExporting}>
  {@html svg}
</div>
