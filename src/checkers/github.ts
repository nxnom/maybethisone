import type { CheckResult } from '../types';

export async function checkGitHubOrg(name: string): Promise<CheckResult> {
  try {
    // GitHub usernames and org names share the same namespace
    // Check both /orgs/{name} and /{name} (user profile)
    const [orgResponse, userResponse] = await Promise.all([
      fetch(`https://github.com/orgs/${name}`, {
        method: 'HEAD',
        redirect: 'manual'
      }),
      fetch(`https://github.com/${name}`, {
        method: 'HEAD',
        redirect: 'manual'
      })
    ]);

    // If either org or user exists, name is taken
    const orgExists = orgResponse.status !== 404;
    const userExists = userResponse.status !== 404;

    return { available: !orgExists && !userExists };
  } catch (error) {
    return { available: null, error: (error as Error).message };
  }
}
