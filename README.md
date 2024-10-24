# dpl (Docker Project Deployer)

A simple, secure CLI tool for deploying Docker projects over SSH. Configure multiple deployment targets and deploy with a single command.

[![TypeScript](https://badges.frapsoft.com/typescript/code/typescript.svg?v=101)](https://github.com/ellerbrock/typescript-badges/)

## Features

- 🔐 Multiple authentication methods (Password or SSH Key)
- 🔑 Git authentication support (SSH key passphrase or password)
- 📦 Multiple deployment targets support
- 🐳 Docker-compose workflow integration
- 💻 Interactive configuration
- 🚀 Simple one-command deployment
- 📝 TypeScript support

## Installation

```bash
npm install -g @btheo/dpl
```

## Quick Start

1. Configure a new deployment target:

```bash
# With password authentication
dpl configure myserver --password

# With SSH key authentication (defaults to ~/.ssh/id_rsa)
dpl configure myserver --ssh-key
```

2. Deploy to your configured target:

```bash
# Standard deployment
dpl deploy myserver

# Deploy without Git authentication
dpl deploy myserver --skip-git-auth
```

## Commands

### Configure a new target

```bash
dpl configure [alias] [options]
```

Options:
- `--password`: Use password authentication
- `--ssh-key`: Use SSH key authentication (defaults to ~/.ssh/id_rsa)
- `--git-auth`: Configure Git authentication

This will prompt you for:
- Host address
- Username
- Authentication method (password or SSH key)
- Project path on remote server
- Git authentication (optional)
  - SSH key passphrase
  - or Git password

### Deploy to a target

```bash
dpl deploy <alias> [options]
```

Options:
- `--skip-git-auth`: Skip Git authentication during deployment

Performs the following steps:
1. Connects to your server via SSH
2. Sets up Git authentication if configured
3. Pulls latest changes from git
4. Stops running containers
5. Cleans up Docker resources
6. Starts containers in detached mode
7. Shows running containers
8. Cleans up any temporary authentication files

### List configurations

```bash
dpl list
```

Shows all configured deployment targets.

### Remove a configuration

```bash
dpl remove <alias>
```

Removes a configured deployment target.

## Authentication

### SSH Authentication
You can choose between:
1. Password authentication
2. SSH key authentication (defaults to ~/.ssh/id_rsa)

### Git Authentication
You can configure:
1. SSH key passphrase for existing keys on the server
2. Git password for HTTPS authentication
3. No authentication (for public repositories)

## Development

### Prerequisites

- Node.js >= 14
- npm >= 6

### Setup

```bash
# Clone the repository
git clone https://github.com/yourusername/dpl.git
cd dpl

# Install dependencies
npm install

# Build the project
npm run build

# Run tests
npm test

# Link for local development
npm link
```

### Running Tests

```bash
# Run tests once
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

## Configuration

Configurations are stored securely in:
- macOS: `~/Library/Preferences/dpl-nodejs`
- Linux: `~/.config/dpl-nodejs`
- Windows: `%APPDATA%\dpl-nodejs`

## Security

- Passwords and passphrases are stored securely using encryption
- SSH keys are never stored, only their paths
- Temporary authentication files are cleaned up after deployment
- Git credentials are handled securely and cleaned up after use

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.