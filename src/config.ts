import Conf from 'conf';
import { DeploymentConfig, Store } from './types';
import inquirer from 'inquirer';

export class ConfigManager {
  private config: Conf<Store>;

  constructor() {
    this.config = new Conf<Store>({
      projectName: 'dpl',
      defaults: {} as Store,
    });
  }

  saveConfig(config: DeploymentConfig): void {
    if (!config.alias) throw new Error('Alias is required');
    this.config.set(config.alias, config);
  }

  getConfig(alias: string): DeploymentConfig | undefined {
    return this.config.get(alias);
  }

  listConfigs(): string[] {
    return Object.keys(this.config.store || {});
  }

  deleteConfig(alias: string): void {
    this.config.delete(alias);
  }

  async configure(alias?: string): Promise<DeploymentConfig> {
    const answers = await inquirer.prompt([
      {
        type: 'input',
        name: 'alias',
        message: 'Enter an alias for this configuration:',
        default: alias,
        when: !alias,
      },
      {
        type: 'input',
        name: 'host',
        message: 'Enter the host:',
      },
      {
        type: 'input',
        name: 'username',
        message: 'Enter the username:',
      },
      {
        type: 'list',
        name: 'authType',
        message: 'Choose authentication method:',
        choices: ['Password', 'SSH Key'],
      },
      {
        type: 'password',
        name: 'password',
        message: 'Enter the password:',
        mask: '*',
        when: (answers) => answers.authType === 'Password',
      },
      {
        type: 'input',
        name: 'privateKeyPath',
        message: 'Enter the path to your SSH private key:',
        when: (answers) => answers.authType === 'SSH Key',
      },
      {
        type: 'input',
        name: 'projectPath',
        message: 'Enter the project path on the remote server:',
      },
    ]);

    const config: DeploymentConfig = {
      host: answers.host,
      username: answers.username,
      password: answers.authType === 'Password' ? answers.password : undefined,
      privateKeyPath: answers.authType === 'SSH Key' ? answers.privateKeyPath : undefined,
      projectPath: answers.projectPath,
      alias: answers.alias || alias,
    };

    this.saveConfig(config);
    return config;
  }
}
