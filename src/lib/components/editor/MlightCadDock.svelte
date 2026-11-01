<script lang="ts">
  import { base } from '$app/paths';
</script>

<div class="flex h-full min-h-0 flex-col overflow-hidden bg-slate-950" data-mlightcad-review>
  <div class="shrink-0 border-b border-slate-700 bg-slate-900 px-3 py-2 text-xs leading-5 text-slate-300">
    راجع ملف DXF محليًا داخل MLightCAD. تأكد من بناء وحدة المراجعة قبل تشغيلها؛ دعم DWG غير مفعّل.
  </div>
  <iframe
    class="min-h-0 w-full flex-1 border-0 bg-slate-950"
    src={`${base}/cad-review/index.html`}
    title="MLightCAD DXF review"
    loading="lazy"
  ></iframe>
</div>
