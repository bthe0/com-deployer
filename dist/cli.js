#!/usr/bin/env node
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const commander_1 = require("commander");
const chalk_1 = __importDefault(require("chalk"));
const config_1 = require("./config");
const deployer_1 = require("./deployer");
const inquirer_1 = __importDefault(require("inquirer"));
const os_1 = __importDefault(require("os"));
const path_1 = __importDefault(require("path"));
const program = new commander_1.Command();
const configManager = new config_1.ConfigManager();
const deployer = new deployer_1.Deployer();
// Default SSH key path for Mac/Linux environments
const defaultSshKeyPath = path_1.default.join(os_1.default.homedir(), '.ssh', 'id_rsa');
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
        questions.push({
            type: 'input',
            name: 'host',
            message: 'Enter the host:',
        }, {
            type: 'input',
            name: 'username',
            message: 'Enter the username:',
        });
        if (!authType) {
            questions.push({
                type: 'list',
                name: 'authType',
                message: 'Choose authentication method:',
                choices: ['Password', 'SSH Key'],
            });
        }
        questions.push({
            type: 'password',
            name: 'password',
            message: 'Enter the password:',
            mask: '*',
            when: (answers) => answers.authType === 'Password' || options.password,
        }, {
            type: 'input',
            name: 'privateKeyPath',
            message: 'Enter the path to your SSH private key:',
            default: defaultSshKeyPath,
            when: (answers) => answers.authType === 'SSH Key' || options.sshKey,
        }, {
            type: 'input',
            name: 'projectPath',
            message: 'Enter the project path on the remote server:',
        }, {
            type: 'confirm',
            name: 'configureGitAuth',
            message: 'Do you want to configure Git authentication?',
            default: false,
            when: !options.gitAuth,
        }, {
            type: 'list',
            name: 'gitAuthType',
            message: 'Choose Git authentication method:',
            choices: ['SSH Key Passphrase', 'Password', 'None'],
            when: (answers) => answers.configureGitAuth || options.gitAuth,
        }, {
            type: 'password',
            name: 'gitPassword',
            message: 'Enter Git password:',
            mask: '*',
            when: (answers) => answers.gitAuthType === 'Password',
        }, {
            type: 'password',
            name: 'gitKeyPassphrase',
            message: 'Enter Git SSH key passphrase:',
            mask: '*',
            when: (answers) => answers.gitAuthType === 'SSH Key Passphrase',
        });
        const answers = await inquirer_1.default.prompt(questions);
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
        console.log(chalk_1.default.green('Configuration saved successfully!'));
        console.log(chalk_1.default.blue(`Alias: ${config.alias}`));
    }
    catch (error) {
        console.error(chalk_1.default.red('Configuration failed:', error));
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
            console.error(chalk_1.default.red(`No configuration found for alias: ${alias}`));
            return;
        }
        if (options.skipGitAuth) {
            config.gitPassword = undefined;
            config.gitKeyPassphrase = undefined;
        }
        console.log(chalk_1.default.blue(`Deploying to ${config.host}...`));
        const result = await deployer.deploy(config);
        if (result.success) {
            console.log(chalk_1.default.green('Deployment successful!'));
            result.output.forEach((line) => console.log(line));
        }
        else {
            console.error(chalk_1.default.red('Deployment failed:', result.error?.message));
            result.output.forEach((line) => console.log(line));
        }
    }
    catch (error) {
        console.error(chalk_1.default.red('Deployment failed:', error));
    }
});
program
    .command('list')
    .description('List all configured deployment targets')
    .action(() => {
    const aliases = configManager.listConfigs();
    if (aliases.length === 0) {
        console.log(chalk_1.default.yellow('No configurations found'));
        return;
    }
    console.log(chalk_1.default.blue('Configured deployment targets:'));
    aliases.forEach((alias) => {
        const config = configManager.getConfig(alias);
        console.log(chalk_1.default.green(`- ${alias}: ${config?.username}@${config?.host}`));
    });
});
program
    .command('remove <alias>')
    .description('Remove a configured deployment target')
    .action((alias) => {
    try {
        configManager.deleteConfig(alias);
        console.log(chalk_1.default.green(`Configuration '${alias}' removed successfully`));
    }
    catch (error) {
        console.error(chalk_1.default.red('Failed to remove configuration:', error));
    }
});
program
    .command('duplicate <alias> <newAlias> <newFolderPath>')
    .description('Duplicate an existing configuration under a new alias with a new project path')
    .action((alias, newAlias, newFolderPath) => {
    try {
        const existingConfig = configManager.getConfig(alias);
        if (!existingConfig) {
            console.error(chalk_1.default.red(`No configuration found for alias: ${alias}`));
            return;
        }
        const newConfig = {
            ...existingConfig,
            alias: newAlias,
            projectPath: newFolderPath,
        };
        configManager.saveConfig(newConfig);
        console.log(chalk_1.default.green(`Configuration duplicated successfully!`));
        console.log(chalk_1.default.blue(`Old Alias: ${alias}`));
        console.log(chalk_1.default.blue(`New Alias: ${newAlias}`));
        console.log(chalk_1.default.blue(`New Project Path: ${newFolderPath}`));
    }
    catch (error) {
        console.error(chalk_1.default.red('Failed to duplicate configuration:', error));
    }
});
program.parse(process.argv);
