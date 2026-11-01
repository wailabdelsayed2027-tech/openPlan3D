import { expect, test } from '@playwright/test';

test('Dockview workspace is opt-in, rearrangeable, persistent and reversible', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));

  await page.goto('/editor?dock=1');
  const workspace = page.locator('[data-dock-workspace]');
  await expect(workspace).toBeVisible();
  await expect(page.locator('[data-dock-plan-canvas]')).toBeVisible();

  // The native canvas still exists; panels can be moved without changing plan data.
  await page.getByRole('button', { name: 'نافذة عائمة' }).click();
  await expect(page.locator('[data-dock-plan-canvas]')).toBeVisible();
  await page.getByRole('button', { name: 'إعادة الترتيب' }).click();
  await expect(page.locator('[data-dock-plan-canvas]')).toBeVisible();

  await expect.poll(async () => page.evaluate(
    () => Boolean(localStorage.getItem('openplan3d:dockview-layout:v1'))
  )).toBe(true);

  await page.reload();
  await expect(workspace).toBeVisible();
  await expect(page.locator('[data-dock-plan-canvas]')).toBeVisible();

  await page.getByRole('button', { name: 'الواجهة الأصلية' }).click();
  await expect(workspace).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'واجهة النوافذ العائمة' })).toBeVisible();

  await page.reload();
  await expect(workspace).toHaveCount(0);
  expect(errors).toEqual([]);
});
