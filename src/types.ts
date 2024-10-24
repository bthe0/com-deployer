export interface DeploymentConfig {
    host: string;
    username: string;
    password: string;
    projectPath: string;
    alias?: string;
  }
  
  export interface CommandResult {
    stdout: string;
    stderr: string;
    code: number | null;  // Updated to handle null case from node-ssh
  }
  
  export interface DeploymentResult {
    success: boolean;
    error?: Error;
    output: string[];
  }
  
  export interface Store {
    [key: string]: DeploymentConfig;
  }