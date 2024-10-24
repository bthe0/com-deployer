"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConfigManager = void 0;
const conf_1 = __importDefault(require("conf"));
const inquirer_1 = __importDefault(require("inquirer"));
class ConfigManager {
    constructor() {
        this.config = new conf_1.default({
            projectName: 'dpl',
            defaults: {},
        });
    }
    saveConfig(config) {
        if (!config.alias)
            throw new Error('Alias is required');
        this.config.set(config.alias, config);
    }
    getConfig(alias) {
        return this.config.get(alias);
    }
    listConfigs() {
        return Object.keys(this.config.store || {});
    }
    deleteConfig(alias) {
        this.config.delete(alias);
    }
    async configure(alias) {
        const answers = await inquirer_1.default.prompt([
            {
                type: 'input',
                name: 'alias',
                message: 'Enter an alias for this configuration:',
                default: alias,
                when: !alias,
            },
            {
                type: 'input',
                name: 'host',
                message: 'Enter the host:',
            },
            {
                type: 'input',
                name: 'username',
                message: 'Enter the username:',
            },
            {
                type: 'list',
                name: 'authType',
                message: 'Choose authentication method:',
                choices: ['Password', 'SSH Key'],
            },
            {
                type: 'password',
                name: 'password',
                message: 'Enter the password:',
                mask: '*',
                when: (answers) => answers.authType === 'Password',
            },
            {
                type: 'input',
                name: 'privateKeyPath',
                message: 'Enter the path to your SSH private key:',
                when: (answers) => answers.authType === 'SSH Key',
            },
            {
                type: 'input',
                name: 'projectPath',
                message: 'Enter the project path on the remote server:',
            },
        ]);
        const config = {
            host: answers.host,
            username: answers.username,
            password: answers.authType === 'Password' ? answers.password : undefined,
            privateKeyPath: answers.authType === 'SSH Key' ? answers.privateKeyPath : undefined,
            projectPath: answers.projectPath,
            alias: answers.alias || alias,
        };
        this.saveConfig(config);
        return config;
    }
}
exports.ConfigManager = ConfigManager;
