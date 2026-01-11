import type { CheckResult } from '../types';
import { getBrowserContext } from '../utils/browser';

export async function checkNpmPackage(name: string): Promise<CheckResult> {
  try {
    const response = await fetch(`https://registry.npmjs.org/${name}`, {
      method: 'HEAD'
    });
    const isAvailable = response.status === 404;
    // npm normalizes names (e.g., "my-pkg" and "my_pkg" are same)
    // so even if exact name is free, publish may still fail
    return { available: isAvailable, maybeAvailable: isAvailable };
  } catch (error) {
    return { available: null, error: (error as Error).message };
  }
}

export async function checkNpmOrg(name: string): Promise<CheckResult> {
  try {
    const context = await getBrowserContext();
    const page = await context.newPage();

    await page.addInitScript(() => {
      Object.defineProperty(navigator, 'webdriver', { get: () => false });
    });

    await page.goto(`https://www.npmjs.com/org/${name}`, {
      waitUntil: 'load',
      timeout: 30000
    });

    // Wait for Cloudflare challenge to pass
    try {
      await page.waitForFunction(() => !document.title.includes('moment'), { timeout: 15000 });
    } catch {
      // Cloudflare might have already passed
    }

    await page.waitForTimeout(1000);

    const bodyText = await page.evaluate(() => document.body.innerText);
    await page.close();

    const notFoundPatterns = [
      /scope not found/i,
      /NotFoundError/i,
      /couldn't find.*org/i
    ];

    const isNotFound = notFoundPatterns.some(pattern => pattern.test(bodyText));
    return { available: isNotFound };
  } catch (error) {
    return { available: null, error: (error as Error).message };
  }
}
