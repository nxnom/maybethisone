#!/usr/bin/env bun

import chalk from 'chalk';
import Table from 'cli-table3';
import {
  checkGitHubOrg,
  checkNpmPackage,
  checkNpmOrg,
  checkTwitter,
  checkLinkedIn,
  checkDomain
} from './checkers';
import { closeBrowser } from './utils/browser';
import { logProgress, clearProgress, logHeader, logWarning } from './utils/logger';
import { DOMAIN_EXTENSIONS, type ResourceResult } from './types';

function formatStatus(result: ResourceResult): string {
  if (result.error) {
    return chalk.yellow('? Error');
  }
  if (result.available) {
    if (result.dnsOnly) {
      return chalk.cyan('~ No DNS');
    }
    if (result.maybeAvailable) {
      return chalk.cyan('~ Maybe');
    }
    return chalk.green('✓ Available');
  }
  return chalk.red('✗ Taken');
}

async function checkAllForName(name: string): Promise<ResourceResult[]> {
  const results: ResourceResult[] = [];

  logProgress('Checking GitHub organization...');
  const githubResult = await checkGitHubOrg(name);
  results.push({ resource: `github.com/orgs/${name}`, ...githubResult });

  logProgress('Checking npm package...');
  const npmPkgResult = await checkNpmPackage(name);
  results.push({ resource: `npm package: ${name}`, ...npmPkgResult });

  logProgress('Checking npm org (loading browser)...');
  const npmOrgResult = await checkNpmOrg(name);
  results.push({ resource: `npm org: @${name}`, ...npmOrgResult });

  logProgress('Checking Twitter/X...');
  const twitterResult = await checkTwitter(name);
  results.push({ resource: `x.com/${name}`, ...twitterResult });

  logProgress('Checking LinkedIn...');
  const linkedinResult = await checkLinkedIn(name);
  results.push({ resource: `linkedin.com/company/${name}`, ...linkedinResult });

  // Check domains in parallel
  logProgress('Checking domains...');
  const domainResults = await Promise.all(
    DOMAIN_EXTENSIONS.map(async (ext) => {
      const result = await checkDomain(name, ext);
      return { resource: `${name}${ext}`, ...result };
    })
  );
  results.push(...domainResults);

  clearProgress();
  return results;
}

function displayResults(name: string, results: ResourceResult[]): void {
  console.log(chalk.bold(`\nResults for: ${chalk.cyan(name)}\n`));

  const table = new Table({
    head: [chalk.white('Resource'), chalk.white('Status')],
    colWidths: [40, 20],
    style: { head: [], border: [] }
  });

  for (const result of results) {
    table.push([result.resource, formatStatus(result)]);
  }

  console.log(table.toString());
  console.log(chalk.gray('\n  Notes:'));
  console.log(chalk.gray('  • "No DNS" = no DNS record found. Domain may still be registered.'));
  console.log(chalk.gray('  • "Maybe" = npm normalizes names and may conflict with private packages.\n'));
}

function showUsage(): void {
  console.log(chalk.bold('Usage:'));
  console.log('  maybethisone <name1> [name2] [name3] ...\n');
  console.log(chalk.bold('Example:'));
  console.log('  maybethisone myproject coolstartup\n');
  console.log(chalk.bold('Checks:'));
  console.log('  • GitHub organization');
  console.log('  • npm package & org');
  console.log('  • Twitter/X username');
  console.log('  • LinkedIn company page');
  console.log(`  • Domains (${DOMAIN_EXTENSIONS.join(', ')})\n`);
}

function isValidName(name: string): boolean {
  return /^[a-zA-Z0-9][-a-zA-Z0-9]*[a-zA-Z0-9]$|^[a-zA-Z0-9]$/.test(name);
}

async function main(): Promise<void> {
  logHeader();

  const args = process.argv.slice(2);

  if (args.length === 0) {
    showUsage();
    process.exit(1);
  }

  const names = args.filter(arg => !arg.startsWith('-'));

  if (names.length === 0) {
    showUsage();
    process.exit(1);
  }

  for (const name of names) {
    if (!isValidName(name)) {
      logWarning(`Skipping "${name}" - invalid name format`);
      continue;
    }

    const results = await checkAllForName(name.toLowerCase());
    displayResults(name, results);

    // Small delay between names
    if (names.indexOf(name) < names.length - 1) {
      await Bun.sleep(500);
    }
  }

  await closeBrowser();
}

main().catch(async (err) => {
  console.error(err);
  await closeBrowser();
  process.exit(1);
});
