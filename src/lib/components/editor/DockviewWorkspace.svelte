<script lang="ts">
  import { mount, unmount, onMount } from 'svelte';
  import { createDockview, themeAbyss } from 'dockview';
  import type { DockviewApi, IContentRenderer } from 'dockview';
  import 'dockview/dist/styles/dockview.css';
  import DockPlanCanvas from './DockPlanCanvas.svelte';
  import BuildPanel from '$lib/components/sidebar/BuildPanel.svelte';
  import PropertiesPanel from '$lib/components/sidebar/PropertiesPanel.svelte';
  import LayersPanel from '$lib/components/sidebar/LayersPanel.svelte';

  const STORAGE_KEY = 'openplan3d:dockview-layout:v1';
  const views = {
    canvas: DockPlanCanvas,
    tools: BuildPanel,
    properties: PropertiesPanel,
    layers: LayersPanel
  } as const;
  type ViewName = keyof typeof views;

  class SvelteContent implements IContentRenderer {
    readonly element = document.createElement('div');
    private instance: any = null;

    constructor(private readonly name: ViewName) {
      this.element.className = 'cad-dock-panel';
    }

    init(): void {
      this.instance = mount(views[this.name] as any, {
        target: this.element,
        props: this.name === 'properties' ? { is3D: false } : {}
      });
    }

    dispose(): void {
      if (this.instance) {
        void unmount(this.instance);
        this.instance = null;
      }
    }
  }

  let host: HTMLDivElement;
  let api: DockviewApi | undefined;
  let ready = $state(false);
  let error = $state('');

  function defaultPanels(instance: DockviewApi): void {
    instance.clear();
    instance.addPanel({ id: 'canvas', component: 'canvas', title: 'المسقط 2D / 3D' });
    instance.addPanel({
      id: 'tools', component: 'tools', title: 'أدوات الرسم',
      position: { referencePanel: 'canvas', direction: 'left' }, initialWidth: 270
    });
    instance.addPanel({
      id: 'properties', component: 'properties', title: 'الخصائص والأبعاد',
      position: { referencePanel: 'canvas', direction: 'right' }, initialWidth: 280
    });
    instance.addPanel({
      id: 'layers', component: 'layers', title: 'الطبقات',
      position: { referencePanel: 'properties', direction: 'within' }
    });
    instance.getPanel('canvas')?.api.setActive();
  }

  function saveLayout(): void {
    if (!api) return;
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(api.toJSON())); } catch { /* storage is optional */ }
  }

  function resetLayout(): void {
    if (!api) return;
    defaultPanels(api);
    saveLayout();
  }

  function openLayers(): void {
    if (!api) return;
    const existing = api.getPanel('layers');
    if (existing) { existing.api.setActive(); return; }
    api.addPanel({
      id: 'layers', component: 'layers', title: 'الطبقات',
      position: { referencePanel: 'properties', direction: 'within' }
    });
  }

  function floatProperties(): void {
    if (!api) return;
    const panel = api.getPanel('properties');
    if (panel) api.addFloatingGroup(panel);
  }

  onMount(() => {
    try {
      api = createDockview(host, {
        theme: themeAbyss,
        createComponent: ({ name }) => new SvelteContent(name as ViewName)
      });
      let restored = false;
      try {
        const json = localStorage.getItem(STORAGE_KEY);
        if (json) {
          api.fromJSON(JSON.parse(json));
          restored = Boolean(api.getPanel('canvas'));
        }
      } catch { restored = false; }
      if (!restored) defaultPanels(api);

      const resize = () => api?.layout(host.clientWidth, host.clientHeight);
      const observer = new ResizeObserver(resize);
      observer.observe(host);
      resize();
      const subscription = api.onDidLayoutChange(saveLayout);
      ready = true;
      return () => {
        subscription.dispose();
        observer.disconnect();
        api?.dispose();
        api = undefined;
      };
    } catch (cause) {
      error = cause instanceof Error ? cause.message : 'Dockview could not start';
    }
  });
</script>

<div class="flex h-full min-h-0 w-full flex-col bg-slate-950" data-dock-workspace>
  <div class="flex shrink-0 items-center gap-2 border-b border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white">
    <span class="font-semibold tracking-wide">Architect Studio · Dockview</span>
    <span class="hidden text-slate-400 xl:inline">اسحب التبويبات لتحريك النوافذ أو تغيير مكانها</span>
    <div class="flex-1"></div>
    <button type="button" class="rounded bg-slate-700 px-2 py-1 hover:bg-slate-600" onclick={openLayers}>الطبقات</button>
    <button type="button" class="rounded bg-slate-700 px-2 py-1 hover:bg-slate-600" onclick={floatProperties}>نافذة عائمة</button>
    <button type="button" class="rounded bg-slate-700 px-2 py-1 hover:bg-slate-600" onclick={resetLayout}>إعادة الترتيب</button>
  </div>
  {#if error}
    <div class="p-4 text-red-300" role="alert">تعذر فتح واجهة Dockview: {error}. يمكنك العودة للواجهة الأصلية.</div>
  {/if}
  <div bind:this={host} class="min-h-0 w-full flex-1" aria-label="مساحة عمل الكاد بنوافذ قابلة للسحب"></div>
</div>

<style>
  :global(.cad-dock-panel) {
    width: 100%;
    height: 100%;
    min-height: 0;
    overflow: hidden;
  }
  :global(.cad-dock-panel > .w-64),
  :global(.cad-dock-panel > .w-56),
  :global(.cad-dock-panel > .w-80) {
    width: 100% !important;
    max-width: 100% !important;
    min-width: 0 !important;
    height: 100%;
  }
  :global(.cad-dock-panel > [data-plan-properties]) {
    position: relative !important;
    inset: auto !important;
    max-height: 100% !important;
    box-shadow: none !important;
  }
</style>
