import chalk from 'chalk';

export function logProgress(message: string): void {
  process.stdout.write(`\r\x1b[K  ${chalk.gray('⏳')} ${chalk.gray(message)}`);
}

export function clearProgress(): void {
  process.stdout.write('\r\x1b[K');
}

export function logHeader(): void {
  console.log(chalk.blue.bold('\n🔍 maybethisone - Name Availability Checker\n'));
}

export function logError(message: string): void {
  console.error(chalk.red(`Error: ${message}`));
}

export function logWarning(message: string): void {
  console.log(chalk.yellow(message));
}
