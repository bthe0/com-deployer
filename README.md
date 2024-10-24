# dpl (Docker Project Deployer)

A simple, secure CLI tool for deploying Docker projects over SSH. Configure multiple deployment targets and deploy with a single command.

[![TypeScript](https://badges.frapsoft.com/typescript/code/typescript.svg?v=101)](https://github.com/ellerbrock/typescript-badges/)

## Features

- 🔐 Secure password storage with encryption
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
dpl configure myserver
```

2. Deploy to your configured target:

```bash
dpl deploy myserver
```

## Commands

### Configure a new target

```bash
dpl configure [alias]
```

This will prompt you for:

- Host address
- Username
- Password (stored securely)
- Project path on remote server

### Deploy to a target

```bash
dpl deploy <alias>
```

Performs the following steps:

1. Connects to your server via SSH
2. Pulls latest changes from git
3. Stops running containers
4. Cleans up Docker resources
5. Starts containers in detached mode
6. Shows running containers

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
```

## Configuration

Configurations are stored securely in:

- macOS: `~/Library/Preferences/dpl-nodejs`
- Linux: `~/.config/dpl-nodejs`
- Windows: `%APPDATA%\dpl-nodejs`

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.
