/**
 * FreeCAD is a native application, not a browser module.
 * This macro lets an operator choose a DXF exported by OpenPlan3D, import it
 * into FreeCAD, and save the result as an editable .FCStd document.
 * It does not automate column/beam sizing or certify geometry.
 */
export function freecadImportMacro(): string {
  return String.raw\`# Architect Studio -> FreeCAD DXF exchange
# Open FreeCAD on your computer, then Macro > Macros > Create/Run this macro.
# Select a DXF exported from Architect Studio. Save as a native .FCStd document.
import FreeCAD as App
import FreeCADGui as Gui
import ImportGui
from PySide import QtGui

def _choose_file():
    chosen = QtGui.QFileDialog.getOpenFileName(None, "Select Architect Studio DXF", "", "AutoCAD DXF (*.dxf)")
    return chosen[0] if isinstance(chosen, tuple) else chosen

src = _choose_file()
if src:
    doc = App.newDocument("ArchitectStudio")
    try:
        ImportGui.insert(src, doc.Name)
        doc.recompute()
        Gui.activeDocument().activeView().viewAxonometric()
        Gui.activeDocument().activeView().fitAll()
        suggested = src[:-4] + ".FCStd" if src.lower().endswith(".dxf") else src + ".FCStd"
        target = QtGui.QFileDialog.getSaveFileName(None, "Save FreeCAD model", suggested, "FreeCAD Document (*.FCStd)")
        target = target[0] if isinstance(target, tuple) else target
        if target:
            if not target.lower().endswith(".fcstd"):
                target += ".FCStd"
            doc.saveAs(target)
            App.Console.PrintMessage("Architect Studio DXF imported and saved: " + target + "\\n")
        else:
            App.Console.PrintMessage("DXF imported. You can save the document manually.\\n")
    except Exception as exc:
        App.Console.PrintError("DXF import error: " + str(exc) + "\\n")
        raise
\`;
}

export function downloadFreecadMacro(): void {
  const content = freecadImportMacro();
  const url = URL.createObjectURL(new Blob([content], { type: 'text/plain;charset=utf-8' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = 'ArchitectStudio_DXF_to_FreeCAD.FCMacro';
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
