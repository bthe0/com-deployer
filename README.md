# DPL (Docker Project Deployer)

A streamlined CLI tool for deploying Docker projects over SSH with multi-target support and secure authentication handling.

[![TypeScript](https://badges.frapsoft.com/typescript/code/typescript.svg?v=101)](https://github.com/ellerbrock/typescript-badges/)

## ✨ Key Features

- 🔐 Flexible authentication (Password/SSH Key)
- 🔑 Secure Git credential management
- 📦 Multiple deployment target support
- 🐳 Seamless Docker Compose integration
- 💻 Interactive configuration wizard
- 🚀 One-command deployment
- 🛡️ Secure credential handling

## 📦 Installation

```bash
npm install -g @btheo/dpl
```

## 🚀 Quick Start

1. Configure a deployment target:

```bash
# Password authentication
dpl configure myserver --password

# SSH key authentication (defaults to ~/.ssh/id_rsa)
dpl configure myserver --ssh-key
```

2. Deploy your project:

```bash
# Standard deployment
dpl deploy myserver

# Deploy without Git authentication
dpl deploy myserver --skip-git-auth
```

## 📖 Command Reference

### Configure New Target

```bash
dpl configure [alias] [options]
```

**Options:**

- `--password` - Use password authentication
- `--ssh-key` - Use SSH key authentication
- `--git-auth` - Include Git authentication setup

The wizard will guide you through configuring:

- Remote host details
- Authentication method
- Project location
- Git credentials (optional)

### Deploy Project

```bash
dpl deploy <alias> [options]
```

**Options:**

- `--skip-git-auth` - Bypass Git authentication

**Deployment Process:**

1. SSH connection establishment
2. Git authentication setup (if configured)
3. Code pull from repository
4. Container management:
   - Stop running containers
   - Clean Docker resources
   - Start new containers
5. Status verification
6. Cleanup of temporary files

### Manage Configurations

```bash
# List all targets
dpl list

# Remove a target
dpl remove <alias>

# Duplicate a configuration
dpl duplicate <alias> <newAlias> <newFolderPath>
```

## 🔒 Security Features

- Encrypted storage of sensitive data
- SSH key path references only (no key storage)
- Automatic cleanup of authentication artifacts
- Secure Git credential handling
- Isolated configuration per user

## 💾 Configuration Storage

Configurations are securely stored in:

- macOS: `~/Library/Preferences/dpl-nodejs`
- Linux: `~/.config/dpl-nodejs`
- Windows: `%APPDATA%\dpl-nodejs`

## 🛠️ Development Setup

### Prerequisites

- Node.js ≥ 14
- npm ≥ 6

### Local Development

```bash
# Clone repository
git clone https://github.com/yourusername/dpl.git
cd dpl

# Setup project
npm install
npm run build

# Link for local testing
npm link

# Run tests
npm test
npm run test:watch
npm run test:coverage
```

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch
   ```bash
   git checkout -b feature/amazing-feature
   ```
3. Commit your changes
   ```bash
   git commit -m 'Add amazing feature'
   ```
4. Push to the branch
   ```bash
   git push origin feature/amazing-feature
   ```
5. Open a Pull Request

## 📄 License

Licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
