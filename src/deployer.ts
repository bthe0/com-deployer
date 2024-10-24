import { NodeSSH } from 'node-ssh';
import { DeploymentConfig, CommandResult, DeploymentResult } from './types';

export class Deployer {
  private ssh: NodeSSH;

  constructor() {
    this.ssh = new NodeSSH();
  }

  async deploy(config: DeploymentConfig): Promise<DeploymentResult> {
    const output: string[] = [];
    try {
      await this.ssh.connect({
        host: config.host,
        username: config.username,
        password: config.password
      });

      output.push('Connected to server');

      const commands = [
        {
          command: `cd ${config.projectPath}`,
          message: 'Navigating to project directory...'
        },
        {
          command: 'git pull origin master',
          message: 'Pulling latest changes...'
        },
        {
          command: 'docker compose down',
          message: 'Stopping containers...'
        },
        {
          command: 'docker system prune -f --volumes',
          message: 'Cleaning up Docker resources...'
        },
        {
          command: 'docker compose up -d',
          message: 'Starting containers...'
        },
        {
          command: 'docker ps',
          message: 'Checking running containers...'
        }
      ];

      for (const cmd of commands) {
        output.push(cmd.message);
        const result = await this.execCommand(cmd.command, config.projectPath);
        if (result.stdout) output.push(result.stdout);
        if (result.stderr) {
            throw new Error(`Command failed with code ${result.code}: ${result.stderr}`);
        }
      }

      return { success: true, output };
    } catch (error) {
      return {
        success: false,
        error: error as Error,
        output
      };
    } finally {
      this.ssh.dispose();
    }
  }

  private async execCommand(command: string, cwd: string): Promise<CommandResult> {
    const result = await this.ssh.execCommand(command, { cwd });
    return {
      stdout: result.stdout,
      stderr: result.stderr,
      code: result.code ?? 0  // Use 0 as default if code is null
    };
  }
}