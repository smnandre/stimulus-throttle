import { test, expect } from '@playwright/test';

test('throttles button clicks correctly', async ({ page }) => {
  // Navigate to the test file using file:// protocol
  await page.goto(`file://${process.cwd()}/tests/e2e/stimulus-throttle.html`);
  
  // Find the throttled button
  const throttledButton = page.locator('[data-testid="throttled-button"]');
  const counter = page.locator('[data-testid="click-counter"]');
  
  // Verify initial state
  await expect(counter).toHaveText('0');
  
  // Click the button multiple times rapidly
  await throttledButton.click();
  await throttledButton.click();
  await throttledButton.click();
  
  // Should only register one click immediately (leading edge)
  await expect(counter).toHaveText('1');
  
  // Wait for throttle period to pass
  await page.waitForTimeout(250);
  
  // Should now show trailing edge click
  await expect(counter).toHaveText('2');
});

test('application-level throttle modifier works', async ({ page }) => {
  await page.goto(`file://${process.cwd()}/tests/e2e/stimulus-throttle.html`);
  
  const scrollDiv = page.locator('[data-testid="scroll-div"]');
  const scrollCounter = page.locator('[data-testid="scroll-counter"]');
  
  // Verify initial state
  await expect(scrollCounter).toHaveText('0');
  
  // Trigger multiple scroll events rapidly
  await scrollDiv.dispatchEvent('scroll');
  await scrollDiv.dispatchEvent('scroll');
  await scrollDiv.dispatchEvent('scroll');
  
  // Should only register one scroll immediately
  await expect(scrollCounter).toHaveText('1');
  
  // Wait for throttle period
  await page.waitForTimeout(150);
  
  // Should show trailing edge
  await expect(scrollCounter).toHaveText('2');
});
