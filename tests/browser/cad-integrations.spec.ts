import { expect, test } from '@playwright/test';

test('Dockview exposes MLightCAD and FreeCAD integration tabs without modifying the classic editor', async ({ page }) => {
  await page.goto('/editor?dock=1');
  await expect(page.locator('[data-dock-workspace]')).toBeVisible();
  await page.locator('[data-open-mlightcad]').click();
  await expect(page.locator('[data-mlightcad-review]')).toBeVisible();
  await page.locator('[data-open-freecad]').click();
  await expect(page.locator('[data-freecad-bridge]')).toBeVisible();
  await expect(page.getByRole('button', { name: /تصدير المسقط DXF/ })).toBeVisible();
  await expect(page.getByRole('button', { name: /تحميل ماكرو FreeCAD/ })).toBeVisible();
  await page.getByRole('button', { name: 'الواجهة الأصلية' }).click();
  await expect(page.locator('[data-dock-workspace]')).toHaveCount(0);
});
