import { test, expect } from '@playwright/test';

const FRONTEND = 'http://localhost:5173';
const BACKEND = 'http://localhost:5000';

test.describe('Contact Form — E2E', () => {
  test('loads enquiry form page without 404 API errors', async ({ page }) => {
    const apiErrors = [];
    page.on('response', (res) => {
      if (res.status() === 404 && res.url().includes('/api/')) {
        apiErrors.push(res.url());
      }
    });

    await page.goto(`${FRONTEND}/enquiryform`, { waitUntil: 'networkidle' });
    await expect(page.locator('#enquiry-form')).toBeVisible();
    expect(apiErrors).toEqual([]);
  });

  test('submits contact form and saves lead to MongoDB', async ({ page }) => {
    const apiErrors = [];
    page.on('response', (res) => {
      if (res.status() === 404 && res.url().includes('/api/')) {
        apiErrors.push(res.url());
      }
    });

    await page.goto(`${FRONTEND}/enquiryform`, { waitUntil: 'networkidle' });

    // Wait for services to load from DB (select must have >1 option)
    await page.waitForFunction(
      () => document.querySelector('#enquiry-purpose')?.options.length > 1,
      { timeout: 15000 }
    );

    // Fill the form
    await page.fill('#enquiry-name', 'Playwright Test User');
    await page.fill('#enquiry-email', 'playwright@example.com');
    await page.fill('#enquiry-phone', '9876543210');
    await page.fill('#enquiry-description', 'This is a test submission from Playwright to verify the full contact form pipeline works correctly.');

    // Select first available service
    await page.selectOption('#enquiry-purpose', { index: 1 });

// Submit
    await page.click('button[type="submit"]');

    // Wait for success popup — it portals to <body> and shows a green checkmark
    // plus "Thank you dear" text. Wait for the button to appear instead of
    // relying on a class name that may not exist on the portal div.
    await page.waitForFunction(
      () => document.body.textContent.includes('Thank you dear'),
      { timeout: 15000 }
    );
    const successText = await page.textContent('body');
    expect(successText).toContain('Playwright Test User');

    // No 404 API errors
    expect(apiErrors).toEqual([]);
  });

  test('shows validation errors for empty fields', async ({ page }) => {
    await page.goto(`${FRONTEND}/enquiryform`, { waitUntil: 'networkidle' });
    await page.click('button[type="submit"]');
    await page.waitForTimeout(300);
    const errorText = await page.textContent('body');
    expect(errorText).toContain('required');
  });

  test('backend lead endpoint returns 201 and stores in DB', async ({ page }) => {
    const res = await page.request.post(`${BACKEND}/api/leads`, {
      data: {
        name: 'Direct API Test',
        email: 'directapi@example.com',
        phone: '5551234567',
        purpose: 'Web Development',
        description: 'Direct API submission test for Playwright verification.',
        visitorId: 'playwright-direct-' + Date.now(),
        honeypot: ''
      }
    });
    expect(res.status()).toBe(201);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.leadId).toMatch(/^SUP-\d+$/);
  });
});