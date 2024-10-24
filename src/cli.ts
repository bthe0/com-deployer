#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import { ConfigManager } from './config';
import { Deployer } from './deployer';

const program = new Command();
const configManager = new ConfigManager();
const deployer = new Deployer();

program.version('1.0.0').description('Simple deployment tool for Docker projects');

program
  .command('configure [alias]')
  .description('Configure a new deployment target')
  .action(async (alias) => {
    try {
      const config = await configManager.configure(alias);
      console.log(chalk.green('Configuration saved successfully!'));
      console.log(chalk.blue(`Alias: ${config.alias}`));
    } catch (error) {
      console.error(chalk.red('Configuration failed:', error));
    }
  });

program
  .command('deploy <alias>')
  .description('Deploy to a configured target')
  .action(async (alias) => {
    try {
      const config = configManager.getConfig(alias);
      if (!config) {
        console.error(chalk.red(`No configuration found for alias: ${alias}`));
        return;
      }

      console.log(chalk.blue(`Deploying to ${config.host}...`));
      const result = await deployer.deploy(config);

      if (result.success) {
        console.log(chalk.green('Deployment successful!'));
        result.output.forEach((line) => console.log(line));
      } else {
        console.error(chalk.red('Deployment failed:', result.error?.message));
        result.output.forEach((line) => console.log(line));
      }
    } catch (error) {
      console.error(chalk.red('Deployment failed:', error));
    }
  });

program
  .command('list')
  .description('List all configured deployment targets')
  .action(() => {
    const aliases = configManager.listConfigs();
    if (aliases.length === 0) {
      console.log(chalk.yellow('No configurations found'));
      return;
    }
    console.log(chalk.blue('Configured deployment targets:'));
    aliases.forEach((alias) => {
      const config = configManager.getConfig(alias);
      console.log(chalk.green(`- ${alias}: ${config?.username}@${config?.host}`));
    });
  });

program
  .command('remove <alias>')
  .description('Remove a configured deployment target')
  .action((alias) => {
    try {
      configManager.deleteConfig(alias);
      console.log(chalk.green(`Configuration '${alias}' removed successfully`));
    } catch (error) {
      console.error(chalk.red('Failed to remove configuration:', error));
    }
  });

program.parse(process.argv);
