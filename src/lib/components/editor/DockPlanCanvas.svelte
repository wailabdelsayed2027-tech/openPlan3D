<script lang="ts">
  import { onDestroy } from 'svelte';
  import { viewMode, elevationWallId } from '$lib/stores/project';
  import { reportLoadingFailure } from '$lib/services/deployment';
  import FloorPlanCanvas from '$lib/components/editor/FloorPlanCanvas.svelte';
  import AlignmentToolbar from '$lib/components/editor/AlignmentToolbar.svelte';
  import ElevationView from '$lib/components/editor/ElevationView.svelte';

  let mode = $state<'2d' | '3d'>('2d');
  let ThreeViewer: any = $state(null);
  let loadingViewer = false;
  let disposed = false;
  onDestroy(viewMode.subscribe((value) => { mode = value; }));
  onDestroy(() => { disposed = true; });

  $effect(() => {
    if (mode === '3d' && !ThreeViewer && !loadingViewer) {
      loadingViewer = true;
      import('$lib/components/viewer3d/ThreeViewer.svelte')
        .then((module) => { if (!disposed) ThreeViewer = module.default; })
        .catch(() => { if (!disposed) { viewMode.set('2d'); reportLoadingFailure(); } })
        .finally(() => { loadingViewer = false; });
    }
  });
</script>

<div class="relative h-full w-full min-h-0 overflow-hidden bg-slate-950" data-dock-plan-canvas>
  {#if mode === '2d'}
    <FloorPlanCanvas />
    <AlignmentToolbar />
    {#if $elevationWallId}
      <ElevationView />
    {/if}
  {:else if ThreeViewer}
    <ThreeViewer />
  {:else}
    <div class="flex h-full items-center justify-center text-sm text-slate-300">Loading 3D viewer…</div>
  {/if}
</div>
