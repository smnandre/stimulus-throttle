import { test, expect } from '@playwright/test';

test.describe('Throttle E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/tests/e2e/stimulus-throttle.html');
    await page.waitForLoadState('domcontentloaded');
  });

  test('throttles button clicks correctly', async ({ page }) => {
    const log = page.locator('#main-log');
    
    await expect(log).toContainText('Controller connected');
    
    await page.click('#save-btn');
    await expect(log).toContainText('Button clicked: save (Save)');
    await expect(log).toContainText('→ Saving data...');
  });
});
