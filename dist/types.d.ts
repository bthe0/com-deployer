export interface DeploymentConfig {
    host: string;
    username: string;
    password?: string;
    privateKeyPath?: string;
    projectPath: string;
    alias: string;
    gitPassword?: string;
    gitKeyPassphrase?: string;
}
export interface CommandResult {
    stdout: string;
    stderr: string;
    code: number;
}
export interface DeploymentResult {
    success: boolean;
    error?: Error;
    output: string[];
}
export interface Store {
    [key: string]: DeploymentConfig;
}
