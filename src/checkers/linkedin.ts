import type { CheckResult } from '../types';
import { getBrowserContext } from '../utils/browser';

export async function checkLinkedIn(name: string): Promise<CheckResult> {
  try {
    const context = await getBrowserContext();
    const page = await context.newPage();

    await page.addInitScript(() => {
      Object.defineProperty(navigator, 'webdriver', { get: () => false });
    });

    await page.goto(`https://www.linkedin.com/company/${name}`, {
      waitUntil: 'load',
      timeout: 30000
    });

    await page.waitForTimeout(2000);

    const bodyText = await page.evaluate(() => document.body.innerText);
    const url = page.url();
    await page.close();

    const notFoundPatterns = [
      /page not found/i,
      /this page doesn.t exist/i,
      /couldn.t find/i
    ];

    const isNotFound = notFoundPatterns.some(pattern => pattern.test(bodyText)) ||
                       url.includes('/404') ||
                       url.includes('pagenotfound');
    return { available: isNotFound };
  } catch (error) {
    return { available: null, error: (error as Error).message };
  }
}
