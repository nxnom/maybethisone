import type { CheckResult } from '../types';

export async function checkGitHubOrg(name: string): Promise<CheckResult> {
  try {
    const response = await fetch(`https://github.com/orgs/${name}`, {
      method: 'HEAD',
      redirect: 'manual'
    });
    return { available: response.status === 404 };
  } catch (error) {
    return { available: null, error: (error as Error).message };
  }
}
