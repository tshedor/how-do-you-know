<script lang="ts">
  import RightActionHeader from '#lib/components/actions/RightActionHeader.svelte';
  import StandaloneConfigBar from '#lib/components/config-bar/StandaloneConfigBar.svelte';
  import LeftPane from '#lib/components/left/LeftPane.svelte';
  import GraphCanvas from '#lib/components/viewer/GraphCanvas.svelte';
</script>

<svelte:head>
  <title>Edit PartyMap</title>
</svelte:head>

<main>
  <RightActionHeader />
  <StandaloneConfigBar />
  <LeftPane />
  <GraphCanvas />
</main>
