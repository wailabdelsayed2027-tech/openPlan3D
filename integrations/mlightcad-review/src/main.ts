import {
  AcApDocManager,
  AcEdOpenMode,
  AcApSettingManager
} from '@mlightcad/cad-simple-viewer';

const fileInput = document.querySelector<HTMLInputElement>('#file');
const container = document.querySelector<HTMLDivElement>('#cad-container');
const status = document.querySelector<HTMLElement>('#status');
const fit = document.querySelector<HTMLButtonElement>('#fit');

if (!fileInput || !container || !status || !fit) {
  throw new Error('CAD review mount is missing required elements');
}

const file = fileInput;
const viewport = container;
const info = status;
const zoomFit = fit;
let manager: AcApDocManager | undefined;
let busy = false;

AcApSettingManager.configure({ storageKey: 'architect-studio:mlightcad-review' });

async function initialize(): Promise<AcApDocManager> {
  if (manager) return manager;
  manager = AcApDocManager.createInstance({
    container: viewport,
    autoResize: true,
    useMainThreadDraw: true
  });
  return manager;
}

async function openDxf(selected: File): Promise<void> {
  if (busy) return;
  if (!selected.name.toLowerCase().endsWith('.dxf')) {
    info.textContent = 'اختر ملف DXF. دعم DWG غير مفعّل لحماية التراخيص.';
    return;
  }
  if (selected.size > 40 * 1024 * 1024) {
    info.textContent = 'الملف أكبر من 40MB. استخدم DXF أخف للتجربة.';
    return;
  }
  busy = true;
  file.disabled = true;
  info.textContent = 'جاري فتح ' + selected.name + '…';
  try {
    const viewer = await initialize();
    const success = await viewer.openDocument(selected.name, await selected.arrayBuffer(), {
      mode: AcEdOpenMode.Read,
      progressiveRendering: false
    });
    info.textContent = success ? 'تم فتح: ' + selected.name : 'تعذر قراءة DXF. افحص الملف أو جرّب إصدار DXF مختلف.';
  } catch (error) {
    info.textContent = 'فشل فتح DXF: ' + (error instanceof Error ? error.message : 'خطأ غير معروف');
  } finally {
    busy = false;
    file.disabled = false;
    file.value = '';
  }
}

file.addEventListener('change', () => {
  const selected = file.files?.[0];
  if (selected) void openDxf(selected);
});

zoomFit.addEventListener('click', () => {
  try {
    if (manager?.curDocument) manager.sendStringToExecute('zoom\nall');
  } catch {
    info.textContent = 'يمكنك استخدام عجلة الماوس للتكبير أو السحب الأوسط للتحريك.';
  }
});

window.addEventListener('pagehide', () => {
  if (manager) {
    const active = manager;
    manager = undefined;
    void active.destroy();
  }
});
