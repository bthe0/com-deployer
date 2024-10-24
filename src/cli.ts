#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import { ConfigManager } from './config';
import { Deployer } from './deployer';
import inquirer from 'inquirer';
import os from 'os';
import path from 'path';

const program = new Command();
const configManager = new ConfigManager();
const deployer = new Deployer();

// Default SSH key path for Mac/Linux environments
const defaultSshKeyPath = path.join(os.homedir(), '.ssh', 'id_rsa');

program.version('1.0.0').description('Simple deployment tool for Docker projects');

program
  .command('configure [alias]')
  .description('Configure a new deployment target')
  .option('-k, --ssh-key', 'Use SSH key authentication')
  .option('-p, --password', 'Use password authentication')
  .option('--git-auth', 'Configure Git authentication')
  .action(async (alias, options) => {
    try {
      let authType = options.sshKey ? 'SSH Key' : options.password ? 'Password' : null;
      
      const questions = [];
      
      if (!alias) {
        questions.push({
          type: 'input',
          name: 'alias',
          message: 'Enter an alias for this configuration:',
        });
      }

      questions.push(
        {
          type: 'input',
          name: 'host',
          message: 'Enter the host:',
        },
        {
          type: 'input',
          name: 'username',
          message: 'Enter the username:',
        }
      );

      if (!authType) {
        questions.push({
          type: 'list',
          name: 'authType',
          message: 'Choose authentication method:',
          choices: ['Password', 'SSH Key'],
        });
      }

      questions.push(
        {
          type: 'password',
          name: 'password',
          message: 'Enter the password:',
          mask: '*',
          when: (answers: any) => answers.authType === 'Password' || options.password,
        },
        {
          type: 'input',
          name: 'privateKeyPath',
          message: 'Enter the path to your SSH private key:',
          default: defaultSshKeyPath,
          when: (answers: any) => answers.authType === 'SSH Key' || options.sshKey,
        },
        {
          type: 'input',
          name: 'projectPath',
          message: 'Enter the project path on the remote server:',
        },
        {
          type: 'confirm',
          name: 'configureGitAuth',
          message: 'Do you want to configure Git authentication?',
          default: false,
          when: !options.gitAuth,
        },
        {
          type: 'list',
          name: 'gitAuthType',
          message: 'Choose Git authentication method:',
          choices: ['SSH Key Passphrase', 'Password', 'None'],
          when: (answers: any) => answers.configureGitAuth || options.gitAuth,
        },
        {
          type: 'password',
          name: 'gitPassword',
          message: 'Enter Git password:',
          mask: '*',
          when: (answers: any) => answers.gitAuthType === 'Password',
        },
        {
          type: 'password',
          name: 'gitKeyPassphrase',
          message: 'Enter Git SSH key passphrase:',
          mask: '*',
          when: (answers: any) => answers.gitAuthType === 'SSH Key Passphrase',
        }
      );

      const answers = await inquirer.prompt(questions);

      const config = {
        host: answers.host,
        username: answers.username,
        password: answers.password,
        privateKeyPath: answers.privateKeyPath,
        projectPath: answers.projectPath,
        alias: answers.alias || alias,
        gitPassword: answers.gitPassword,
        gitKeyPassphrase: answers.gitKeyPassphrase,
      };

      configManager.saveConfig(config);
      console.log(chalk.green('Configuration saved successfully!'));
      console.log(chalk.blue(`Alias: ${config.alias}`));
    } catch (error) {
      console.error(chalk.red('Configuration failed:', error));
    }
  });

program
  .command('deploy <alias>')
  .description('Deploy to a configured target')
  .option('--skip-git-auth', 'Skip Git authentication')
  .action(async (alias, options) => {
    try {
      const config = configManager.getConfig(alias);
      if (!config) {
        console.error(chalk.red(`No configuration found for alias: ${alias}`));
        return;
      }

      if (options.skipGitAuth) {
        config.gitPassword = undefined;
        config.gitKeyPassphrase = undefined;
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
