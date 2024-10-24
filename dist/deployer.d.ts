import { DeploymentConfig, DeploymentResult } from './types';
export declare class Deployer {
    private ssh;
    constructor();
    private setupSshAgent;
    private cleanupGitAuth;
    private setupGitCredentials;
    private setupGitAuth;
    deploy(config: DeploymentConfig): Promise<DeploymentResult>;
    private buildGitPullCommand;
    private execCommand;
}
