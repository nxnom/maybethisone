export interface CheckResult {
  available: boolean | null;
  error?: string;
  dnsOnly?: boolean;
  maybeAvailable?: boolean; // For npm packages - name normalization may still cause conflicts
}

export interface ResourceResult extends CheckResult {
  resource: string;
}

export type CheckerFunction = (name: string) => Promise<CheckResult>;

export interface CheckerConfig {
  name: string;
  resourceTemplate: string;
  checker: CheckerFunction;
}

export const DOMAIN_EXTENSIONS = ['.com', '.dev', '.io', '.org', '.net', '.co', '.app'] as const;

export type DomainExtension = typeof DOMAIN_EXTENSIONS[number];
