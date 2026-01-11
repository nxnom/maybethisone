import type { CheckResult } from '../types';
import { getBrowserContext } from '../utils/browser';

export async function checkTwitter(name: string): Promise<CheckResult> {
  try {
    const context = await getBrowserContext();
    const page = await context.newPage();

    await page.addInitScript(() => {
      Object.defineProperty(navigator, 'webdriver', { get: () => false });
    });

    await page.goto(`https://x.com/${name}`, {
      waitUntil: 'domcontentloaded',
      timeout: 45000
    });

    await page.waitForTimeout(3000);

    const bodyText = await page.evaluate(() => document.body.innerText);
    await page.close();

    // Use flexible pattern that matches any apostrophe-like character
    const notFoundPatterns = [
      /this account doesn.t exist/i,
      /account suspended/i,
      /doesn.t exist/i,
      /hmm.*this page doesn.t exist/i
    ];

    const isNotFound = notFoundPatterns.some(pattern => pattern.test(bodyText));
    return { available: isNotFound };
  } catch (error) {
    return { available: null, error: (error as Error).message };
  }
}
