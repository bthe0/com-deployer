import { DeploymentConfig } from './types';
export declare class ConfigManager {
    private config;
    constructor();
    saveConfig(config: DeploymentConfig): void;
    getConfig(alias: string): DeploymentConfig | undefined;
    listConfigs(): string[];
    deleteConfig(alias: string): void;
    configure(alias?: string): Promise<DeploymentConfig>;
}
