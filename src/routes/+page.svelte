<script lang="ts">
  import RightActionHeader from '#lib/components/actions/RightActionHeader.svelte';
  import GeneratorConfigBar from '#lib/components/config-bar/GeneratorConfigBar.svelte';
  import LeftPane from '#lib/components/left/LeftPane.svelte';
  import GraphCanvas from '#lib/components/viewer/GraphCanvas.svelte';
  import ThumbnailStrip from '#lib/components/viewer/ThumbnailStrip.svelte';
</script>

<svelte:head>
  <title>PartyMap</title>
</svelte:head>

<main>
  <RightActionHeader />
  <GeneratorConfigBar />
  <LeftPane />
  <GraphCanvas />
  <ThumbnailStrip />
</main>
