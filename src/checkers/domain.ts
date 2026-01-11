import { resolve } from 'dns/promises';
import type { CheckResult, DomainExtension } from '../types';

export async function checkDomain(name: string, extension: DomainExtension): Promise<CheckResult> {
  try {
    await resolve(`${name}${extension}`);
    return { available: false };
  } catch (error: any) {
    if (error.code === 'ENOTFOUND' || error.code === 'ENODATA') {
      return { available: true, dnsOnly: true };
    }
    return { available: null, error: error.message };
  }
}
