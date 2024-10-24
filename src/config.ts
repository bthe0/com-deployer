import Conf from 'conf';
import { DeploymentConfig, Store } from './types';

export class ConfigManager {
  private config: Conf<Store>;

  constructor() {
    this.config = new Conf<Store>({
      projectName: 'dpl',
      defaults: {} as Store
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
    // Cast the entire store to Store type
    const store = this.config.get('.');
    return Object.keys(store || {});
  }

  deleteConfig(alias: string): void {
    this.config.delete(alias);
  }
}