import { describe, expect, it } from 'vitest';
import { freecadImportMacro } from '../src/lib/utils/freecadBridge';

describe('FreeCAD DXF macro bridge', () => {
  it('imports user-selected DXF into FreeCAD and saves an FCStd document', () => {
    const macro = freecadImportMacro();
    expect(macro).toContain('ImportGui.insert(src, doc.Name)');
    expect(macro).toContain('doc.saveAs(target)');
    expect(macro).toContain('*.dxf');
    expect(macro).toContain('.FCStd');
  });
  it('does not falsely create structural analysis or BIM geometry', () => {
    const macro = freecadImportMacro();
    expect(macro).not.toContain('FemAnalysis');
    expect(macro).not.toContain('makeStructural');
  });
});
