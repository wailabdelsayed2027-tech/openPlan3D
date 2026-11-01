<script lang="ts">
  import { get } from 'svelte/store';
  import { currentProject } from '$lib/stores/project';
  import { exportDXFWithFeedback } from '$lib/stores/exportNotice';
  import { downloadFreecadMacro } from '$lib/utils/freecadBridge';

  function downloadDxf(): void {
    const project = get(currentProject);
    if (project) exportDXFWithFeedback(project);
  }
</script>

<div class="h-full w-full overflow-y-auto bg-slate-950 p-4 text-slate-100" data-freecad-bridge>
  <h2 class="mb-2 text-base font-semibold">FreeCAD · تبادل الملفات</h2>
  <p class="mb-4 text-xs leading-6 text-slate-300">
    FreeCAD برنامج مكتبي. من هنا صدّر المسقط DXF، ثم افتحه بداخل FreeCAD بواسطة ماكرو
    للاستيراد وحفظه كمستند FCStd. لا يتم توليد حسابات أو قطاعات إنشائية تلقائيًا.
  </p>
  <div class="flex flex-col gap-2">
    <button type="button" onclick={downloadDxf}
      class="rounded-lg bg-sky-700 px-3 py-2 text-sm font-medium hover:bg-sky-600">
      1 — تصدير المسقط DXF
    </button>
    <button type="button" onclick={downloadFreecadMacro}
      class="rounded-lg bg-slate-700 px-3 py-2 text-sm font-medium hover:bg-slate-600">
      2 — تحميل ماكرو FreeCAD
    </button>
    <div class="rounded-lg border border-slate-700 p-3 text-xs leading-6 text-slate-300">
      3 — افتح FreeCAD على الكمبيوتر، ثم شغّل ملف .FCMacro من قائمة Macro.
      اختر DXF الذي صدّرته، ثم احفظ الناتج FCStd.
    </div>
  </div>
  <p class="mt-4 text-xs text-amber-300">
    راجع وحدات القياس والمقاسات والأوجه والأعمدة قبل أي استخدام هندسي.
    DXF ثنائي الأبعاد لا يتحول تلقائيًا إلى نموذج BIM إنشائي معتمد.
  </p>
  <a href="https://www.freecad.org/" target="_blank" rel="noopener noreferrer"
     class="mt-4 inline-block text-xs text-sky-300 underline">موقع FreeCAD الرسمي</a>
</div>
