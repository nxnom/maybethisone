#!/usr/bin/env node

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import {
  checkGitHubOrg,
  checkNpmPackage,
  checkNpmOrg,
  checkTwitter,
  checkLinkedIn,
  checkDomain
} from './checkers';
import { closeBrowser } from './utils/browser';
import { DOMAIN_EXTENSIONS, type ResourceResult } from './types';

const server = new McpServer({
  name: 'maybethisone',
  version: '0.1.0'
});

function formatResult(result: ResourceResult): string {
  if (result.error) {
    return 'error';
  }
  if (result.available) {
    if (result.dnsOnly) {
      return 'no_dns';
    }
    if (result.maybeAvailable) {
      return 'maybe';
    }
    return 'available';
  }
  return 'taken';
}

async function checkAllForName(name: string): Promise<ResourceResult[]> {
  // Run all checks in parallel for speed
  const [
    githubResult,
    npmPkgResult,
    npmOrgResult,
    twitterResult,
    linkedinResult,
    ...domainResults
  ] = await Promise.all([
    checkGitHubOrg(name),
    checkNpmPackage(name),
    checkNpmOrg(name),
    checkTwitter(name),
    checkLinkedIn(name),
    ...DOMAIN_EXTENSIONS.map((ext) => checkDomain(name, ext))
  ]);

  return [
    { resource: `github.com/orgs/${name}`, ...githubResult },
    { resource: `npm package: ${name}`, ...npmPkgResult },
    { resource: `npm org: @${name}`, ...npmOrgResult },
    { resource: `x.com/${name}`, ...twitterResult },
    { resource: `linkedin.com/company/${name}`, ...linkedinResult },
    ...DOMAIN_EXTENSIONS.map((ext, i) => ({
      resource: `${name}${ext}`,
      ...domainResults[i]
    }))
  ];
}

server.tool(
  'check_name_availability',
  'Check if a name is available across GitHub orgs, npm packages/orgs, Twitter/X, LinkedIn, and domains (.com, .dev, .io, .org, .net, .co, .app)',
  {
    name: z.string().describe('The name to check availability for (e.g., "myproject")'),
  },
  async ({ name }) => {
    const validNamePattern = /^[a-zA-Z0-9][-a-zA-Z0-9]*[a-zA-Z0-9]$|^[a-zA-Z0-9]$/;

    if (!validNamePattern.test(name)) {
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            error: 'Invalid name format. Name must start and end with alphanumeric characters and can contain hyphens.',
            name
          }, null, 2)
        }]
      };
    }

    try {
      const results = await checkAllForName(name.toLowerCase());
      await closeBrowser();

      const formattedResults = results.map(r => ({
        resource: r.resource,
        status: formatResult(r),
        error: r.error || undefined
      }));

      const summary = {
        name,
        results: formattedResults,
        legend: {
          available: 'Confirmed available',
          taken: 'Confirmed taken',
          maybe: 'npm package - may conflict with normalized names or private packages',
          no_dns: 'No DNS record found (domain may still be registered)',
          error: 'Check failed'
        }
      };

      return {
        content: [{
          type: 'text',
          text: JSON.stringify(summary, null, 2)
        }]
      };
    } catch (error) {
      await closeBrowser();
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            error: `Failed to check availability: ${(error as Error).message}`,
            name
          }, null, 2)
        }],
        isError: true
      };
    }
  }
);

server.tool(
  'check_name_availability_quick',
  'Quick check for name availability - only checks GitHub org, npm package, and .com domain (faster, no browser needed)',
  {
    name: z.string().describe('The name to check availability for'),
  },
  async ({ name }) => {
    const validNamePattern = /^[a-zA-Z0-9][-a-zA-Z0-9]*[a-zA-Z0-9]$|^[a-zA-Z0-9]$/;

    if (!validNamePattern.test(name)) {
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            error: 'Invalid name format',
            name
          }, null, 2)
        }]
      };
    }

    try {
      const results: ResourceResult[] = [];
      const lowerName = name.toLowerCase();

      const githubResult = await checkGitHubOrg(lowerName);
      results.push({ resource: `github.com/orgs/${lowerName}`, ...githubResult });

      const npmPkgResult = await checkNpmPackage(lowerName);
      results.push({ resource: `npm package: ${lowerName}`, ...npmPkgResult });

      const domainResult = await checkDomain(lowerName, '.com');
      results.push({ resource: `${lowerName}.com`, ...domainResult });

      const formattedResults = results.map(r => ({
        resource: r.resource,
        status: formatResult(r),
        error: r.error || undefined
      }));

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            name,
            results: formattedResults
          }, null, 2)
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            error: `Failed to check: ${(error as Error).message}`,
            name
          }, null, 2)
        }],
        isError: true
      };
    }
  }
);

function logStartup() {
  const msg = (text: string) => console.error(text);
  const cwd = process.cwd();

  msg('');
  msg('✓ maybethisone MCP server running');
  msg('');
  msg('Available tools:');
  msg('  • check_name_availability       - Full check (all platforms, uses browser)');
  msg('  • check_name_availability_quick - Quick check (GitHub, npm, .com only)');
  msg('');
  msg('Claude Desktop config (~/.config/claude/claude_desktop_config.json):');
  msg('');
  msg('  // If installed via npm');
  msg('  {');
  msg('    "mcpServers": {');
  msg('      "maybethisone": {');
  msg('        "command": "npx",');
  msg('        "args": ["maybethisone-mcp"]');
  msg('      }');
  msg('    }');
  msg('  }');
  msg('');
  msg('  // For local development');
  msg('  {');
  msg('    "mcpServers": {');
  msg('      "maybethisone": {');
  msg('        "command": "bun",');
  msg('        "args": ["run", "src/mcp.ts"],');
  msg(`        "cwd": "${cwd}"`);
  msg('      }');
  msg('    }');
  msg('  }');
  msg('');
  msg('Note: You don\'t need to run this manually.');
  msg('Claude Desktop will start it automatically when configured.');
  msg('');
}

async function main() {
  logStartup();
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((error) => {
  console.error('MCP server error:', error);
  process.exit(1);
});
