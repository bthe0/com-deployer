"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Deployer = void 0;
const node_ssh_1 = require("node-ssh");
const fs = __importStar(require("fs"));
class Deployer {
    constructor() {
        this.ssh = new node_ssh_1.NodeSSH();
    }
    async setupSshAgent(passphrase, output) {
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

# Start the ssh-agent and store its environment variables
eval \`ssh-agent\`

if [ -f "${homeDir}/.ssh/id_ed25519" ]; then
    SSH_ASKPASS=${homeDir}/.ssh/askpass.sh SSH_ASKPASS_REQUIRE=force setsid -w ssh-add ${homeDir}/.ssh/id_ed25519
elif [ -f "${homeDir}/.ssh/id_rsa" ]; then
    SSH_ASKPASS=${homeDir}/.ssh/askpass.sh SSH_ASKPASS_REQUIRE=force setsid -w ssh-add ${homeDir}/.ssh/id_rsa
else
    echo "No SSH key found in ${homeDir}/.ssh/"
    exit 1
fi

# List keys and test connection
ssh-add -l
ssh -T git@github.com -o StrictHostKeyChecking=no || true

# Save environment for later use
echo "export SSH_AUTH_SOCK=$SSH_AUTH_SOCK" > ${homeDir}/.ssh-agent-env
echo "export SSH_AGENT_PID=$SSH_AGENT_PID" >> ${homeDir}/.ssh-agent-env
`;
        await this.execCommand(`bash -c "echo '${setupScript}' > ${homeDir}/setup-ssh-agent.sh"`, homeDir);
        await this.execCommand('chmod +x ~/setup-ssh-agent.sh', homeDir);
        const result = await this.execCommand(`source ${homeDir}/setup-ssh-agent.sh`, homeDir);
        if (result.code !== 0) {
            throw new Error(`Failed to setup SSH agent: ${result.stderr || result.stdout}`);
        }
        output.push('Set up SSH agent with key');
    }
    async cleanupGitAuth(output) {
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
    async setupGitCredentials(password, username, output) {
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
    async setupGitAuth(config, output) {
        if (config.gitKeyPassphrase) {
            await this.setupSshAgent(config.gitKeyPassphrase, output);
        }
        else if (config.gitPassword) {
            await this.setupGitCredentials(config.gitPassword, config.username, output);
        }
    }
    async deploy(config) {
        const output = [];
        try {
            if (config.privateKeyPath) {
                await this.ssh.connect({
                    host: config.host,
                    username: config.username,
                    privateKey: fs.readFileSync(config.privateKeyPath, 'utf8'),
                });
            }
            else {
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
                if (result.stdout)
                    output.push(result.stdout);
                if (result.stderr && result.code !== 0) {
                    throw new Error(`Command failed with code ${result.code}: ${result.stderr}`);
                }
            }
            if (config.gitKeyPassphrase || config.gitPassword) {
                await this.cleanupGitAuth(output);
            }
            return { success: true, output };
        }
        catch (error) {
            return {
                success: false,
                error: error,
                output
            };
        }
        finally {
            this.ssh.dispose();
        }
    }
    buildGitPullCommand(config, homeDir) {
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
        }
        else if (config.gitPassword) {
            return 'git pull origin master';
        }
        else {
            return 'git pull origin master';
        }
    }
    async execCommand(command, cwd) {
        const result = await this.ssh.execCommand(command, { cwd });
        return {
            stdout: result.stdout,
            stderr: result.stderr,
            code: result.code ?? 0
        };
    }
}
exports.Deployer = Deployer;
