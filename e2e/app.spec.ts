import { test, expect } from '@playwright/test';

test.describe('Piano Chord Trainer', () => {
  test('loads and shows main UI', async ({ page }) => {
    await page.goto('/');

    await expect(
      page.getByRole('heading', { name: /Piano Chord Trainer/i })
    ).toBeVisible();
    await expect(page.getByTestId('recognition-panel')).toBeVisible();
    await expect(page.getByTestId('recognition-placeholder')).toContainText(
      'Play a chord to see recognition'
    );
    await expect(page.getByTestId('key-selector')).toBeVisible();
    await expect(page.getByTestId('held-notes-section')).toBeVisible();
    await expect(
      page.getByRole('heading', { name: /Held notes/i })
    ).toBeVisible();
  });

  test('key selector changes tonic and mode', async ({ page }) => {
    await page.goto('/');

    const tonicSelect = page.getByTestId('key-tonic-select');
    await expect(tonicSelect).toBeVisible();

    await tonicSelect.selectOption({ label: 'D' });
    await expect(tonicSelect).toHaveValue(/^\d+$/);

    const minorBtn = page.getByTestId('key-mode-minor');
    const majorBtn = page.getByTestId('key-mode-major');
    await minorBtn.click();
    await expect(minorBtn).toHaveAttribute('aria-pressed', 'true');
    await majorBtn.click();
    await expect(majorBtn).toHaveAttribute('aria-pressed', 'true');
  });

  test('main content is reachable and device/key section visible', async ({
    page,
  }) => {
    await page.goto('/');

    await expect(page.getByTestId('app-header')).toBeVisible();
    await expect(page.getByTestId('key-selector-area')).toBeVisible();
    await expect(page.getByTestId('device-selector-area')).toBeVisible();
    await expect(page.getByText(/Connect a MIDI keyboard/i)).toBeVisible();
  });
});
