import { NodeSSH } from 'node-ssh';
import { DeploymentConfig, CommandResult, DeploymentResult } from './types';
import * as fs from 'fs';

export class Deployer {
  private ssh: NodeSSH;

  constructor() {
    this.ssh = new NodeSSH();
  }

  private async setupSshAgent(passphrase: string, output: string[]): Promise<void> {
    const homeDir = await this.execCommand('echo $HOME', '/').then(result => result.stdout.trim());

    const setupScript = `
    #!/bin/bash
    mkdir -p ${homeDir}/.ssh
    cat > ${homeDir}/.ssh/askpass.sh << 'EOL'
    #!/bin/bash
    echo '${passphrase}'
    EOL

    chmod 700 ${homeDir}/.ssh/askpass.sh
    chmod 700 ${homeDir}/.ssh

    pkill ssh-agent || true

    export SSH_ASKPASS=${homeDir}/.ssh/askpass.sh
    export SSH_ASKPASS_REQUIRE=force
    export GIT_SSH_COMMAND="ssh -o IdentitiesOnly=yes"

    eval \`ssh-agent\`

    if [ -f "${homeDir}/.ssh/id_ed25519" ]; then
        SSH_ASKPASS=${homeDir}/.ssh/askpass.sh SSH_ASKPASS_REQUIRE=force setsid -w ssh-add ${homeDir}/.ssh/id_ed25519
    elif [ -f "${homeDir}/.ssh/id_rsa" ]; then
        SSH_ASKPASS=${homeDir}/.ssh/askpass.sh SSH_ASKPASS_REQUIRE=force setsid -w ssh-add ${homeDir}/.ssh/id_rsa
    else
        echo "No SSH key found in ${homeDir}/.ssh/"
        exit 1
    fi

    ssh-add -l
    ssh -T git@github.com -o StrictHostKeyChecking=no || true

    echo "export SSH_AUTH_SOCK=$SSH_AUTH_SOCK" > ${homeDir}/.ssh-agent-env
    echo "export SSH_AGENT_PID=$SSH_AGENT_PID" >> ${homeDir}/.ssh-agent-env
    `;

    await this.execCommand(`bash -c "echo '${setupScript}' > ${homeDir}/setup-ssh-agent.sh"`, homeDir);
    await this.execCommand('chmod +x ~/setup-ssh-agent.sh', homeDir);
    const result = await this.execCommand(`source ${homeDir}/setup-ssh-agent.sh`, homeDir);

    // Proper error throwing if the command fails
    if (result.code !== 0) {
        throw new Error(`Failed to setup SSH agent: ${result.stderr || result.stdout}`);
    }

    output.push('Set up SSH agent with key');
}

  private async cleanupGitAuth(output: string[]): Promise<void> {
    const homeDir = await this.execCommand('echo $HOME', '/').then(result => result.stdout.trim());
    
    const cleanupScript = `
#!/bin/bash
if [ -f "${homeDir}/.ssh-agent-env" ]; then
  source ${homeDir}/.ssh-agent-env
  ssh-add -D || true
  ssh-agent -k || true
fi

rm -f ${homeDir}/.ssh/askpass.sh
rm -f ${homeDir}/.ssh-agent-env
rm -f ${homeDir}/setup-ssh-agent.sh
rm -f ${homeDir}/cleanup-ssh-agent.sh
rm -f ${homeDir}/.git-credentials-temp
git config --global --unset credential.helper || true
`;

    await this.execCommand(`bash -c "echo '${cleanupScript}' > ${homeDir}/cleanup-ssh-agent.sh"`, homeDir);
    await this.execCommand('chmod +x ~/cleanup-ssh-agent.sh', homeDir);
    await this.execCommand(`source ${homeDir}/cleanup-ssh-agent.sh`, homeDir);

    output.push('Cleaned up authentication and temporary files');
  }

  private async setupGitCredentials(password: string, username: string, output: string[]): Promise<void> {
    const homeDir = await this.execCommand('echo $HOME', '/').then(result => result.stdout.trim());
    
    const commands = [
      `git config --global credential.helper 'store --file ${homeDir}/.git-credentials-temp'`,
      `echo "https://${username}:${password}@github.com" > ${homeDir}/.git-credentials-temp`,
    ];

    for (const command of commands) {
      const result = await this.execCommand(command, homeDir);
      if (result.code !== 0) {
        throw new Error(`Failed to setup Git credentials: ${result.stderr}`);
      }
    }

    output.push('Set up Git credentials');
  }

  private async setupGitAuth(config: DeploymentConfig, output: string[]): Promise<void> {
    if (config.gitKeyPassphrase) {
      await this.setupSshAgent(config.gitKeyPassphrase, output);
    } else if (config.gitPassword) {
      await this.setupGitCredentials(config.gitPassword, config.username, output);
    }
  }

  async deploy(config: DeploymentConfig): Promise<DeploymentResult> {
    const output: string[] = [];
    try {
      if (config.privateKeyPath) {
        await this.ssh.connect({
          host: config.host,
          username: config.username,
          privateKey: fs.readFileSync(config.privateKeyPath, 'utf8'),
        });
      } else {
        await this.ssh.connect({
          host: config.host,
          username: config.username,
          password: config.password,
        });
      }
  
      output.push('Connected to server');
  
      const homeDir = await this.execCommand('echo $HOME', '/').then(result => result.stdout.trim());
  
      if (config.gitKeyPassphrase || config.gitPassword) {
        await this.setupGitAuth(config, output);
      }
  
      const commands = [
        {
          command: `cd ${config.projectPath}`,
          message: 'Navigating to project directory...'
        },
        {
          command: this.buildGitPullCommand(config, homeDir),
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
        if (result.stderr && result.code !== 0) {
          throw new Error(`Command failed with code ${result.code}: ${result.stderr}`);
        }
      }
  
      if (config.gitKeyPassphrase || config.gitPassword) {
        await this.cleanupGitAuth(output);
      }
  
      // Return success only when everything is done without throwing errors.
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

  private buildGitPullCommand(config: DeploymentConfig, homeDir: string): string {
    if (config.gitKeyPassphrase) {
      return `
#!/bin/bash
if [ -f "${homeDir}/.ssh-agent-env" ]; then
  source ${homeDir}/.ssh-agent-env
fi

eval \`ssh-agent\`
SSH_ASKPASS=${homeDir}/.ssh/askpass.sh SSH_ASKPASS_REQUIRE=force setsid -w ssh-add ${homeDir}/.ssh/id_ed25519 < /dev/null
git pull origin master
`;
    } else if (config.gitPassword) {
      return 'git pull origin master';
    } else {
      return 'git pull origin master';
    }
  }

  private async execCommand(command: string, cwd: string): Promise<CommandResult> {
    const result = await this.ssh.execCommand(command, { cwd });
    return {
      stdout: result.stdout,
      stderr: result.stderr,
      code: result.code ?? 0
    };
  }
}