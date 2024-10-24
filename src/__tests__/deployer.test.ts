import { Deployer } from '../deployer';
import * as fs from 'fs';

// Mock fs module
jest.mock('fs', () => ({
  readFileSync: jest.fn(),
}));

// Mock NodeSSH module methods
const mockExecCommand = jest.fn();
const mockConnect = jest.fn();
const mockDispose = jest.fn();

jest.mock('node-ssh', () => ({
  NodeSSH: jest.fn().mockImplementation(() => ({
    connect: mockConnect,
    execCommand: mockExecCommand,
    dispose: mockDispose,
  })),
}));

describe('Deployer', () => {
  let deployer: Deployer;

  const mockPasswordConfig = {
    host: 'test.com',
    username: 'testuser',
    password: 'testpass',
    projectPath: '/test/path',
    alias: 'test',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    deployer = new Deployer();

    // Mock execCommand on the ssh instance (mocked NodeSSH)
    mockExecCommand.mockResolvedValue({ stdout: '/home/testuser', stderr: '', code: 0 });
  });

  it('should connect with password authentication', async () => {
    mockConnect.mockResolvedValueOnce(undefined);

    // Mock execCommand to return expected responses for successful deployment
    mockExecCommand
      .mockResolvedValueOnce({ stdout: '/home/testuser', stderr: '', code: 0 }) // Mock home dir command
      .mockResolvedValueOnce({ stdout: '', stderr: '', code: 0 }) // Mock navigating to project directory
      .mockResolvedValueOnce({ stdout: '', stderr: '', code: 0 }) // Mock git pull command
      .mockResolvedValueOnce({ stdout: '', stderr: '', code: 0 }) // Mock docker compose down
      .mockResolvedValueOnce({ stdout: '', stderr: '', code: 0 }) // Mock docker system prune
      .mockResolvedValueOnce({ stdout: '', stderr: '', code: 0 }) // Mock docker compose up
      .mockResolvedValueOnce({ stdout: '', stderr: '', code: 0 }); // Mock docker ps

    const result = await deployer.deploy(mockPasswordConfig);

    expect(result.success).toBe(true);
    expect(mockConnect).toHaveBeenCalledWith({
      host: mockPasswordConfig.host,
      username: mockPasswordConfig.username,
      password: mockPasswordConfig.password,
    });
  });

  it('should connect with SSH key authentication', async () => {
    const mockPrivateKey =
      '-----BEGIN RSA PRIVATE KEY-----\nkey-content\n-----END RSA PRIVATE KEY-----';
    (fs.readFileSync as jest.Mock).mockReturnValue(mockPrivateKey);
    mockConnect.mockResolvedValueOnce(undefined);

    // Mock execCommand to return expected responses for successful deployment
    mockExecCommand
      .mockResolvedValueOnce({ stdout: '/home/testuser', stderr: '', code: 0 }) // Mock home dir command
      .mockResolvedValueOnce({ stdout: '', stderr: '', code: 0 }) // Mock navigating to project directory
      .mockResolvedValueOnce({ stdout: '', stderr: '', code: 0 }) // Mock git pull command
      .mockResolvedValueOnce({ stdout: '', stderr: '', code: 0 }) // Mock docker compose down
      .mockResolvedValueOnce({ stdout: '', stderr: '', code: 0 }) // Mock docker system prune
      .mockResolvedValueOnce({ stdout: '', stderr: '', code: 0 }) // Mock docker compose up
      .mockResolvedValueOnce({ stdout: '', stderr: '', code: 0 }); // Mock docker ps

    const result = await deployer.deploy({
      ...mockPasswordConfig,
      privateKeyPath: '/home/user/.ssh/id_rsa',
    });

    expect(result.success).toBe(true);
    expect(mockConnect).toHaveBeenCalledWith({
      host: mockPasswordConfig.host,
      username: mockPasswordConfig.username,
      privateKey: mockPrivateKey,
    });
  });

  it('should handle SSH connection failure', async () => {
    mockConnect.mockRejectedValueOnce(new Error('Connection failed'));

    const result = await deployer.deploy(mockPasswordConfig);

    expect(result.success).toBe(false);
    expect(result.error?.message).toBe('Connection failed');
  });

  it('should handle command execution failure', async () => {
    mockConnect.mockResolvedValueOnce(undefined);

    // Simulate failure on the git pull command
    mockExecCommand
      .mockResolvedValueOnce({ stdout: '/home/testuser', stderr: '', code: 0 }) // Home dir command
      .mockResolvedValueOnce({ stdout: '', stderr: '', code: 0 }) // cd command
      .mockResolvedValueOnce({ stdout: '', stderr: 'Command failed', code: 1 }); // Simulate git pull failure

    const result = await deployer.deploy(mockPasswordConfig);

    expect(result.success).toBe(false);
    expect(result.error?.message).toContain('Command failed');
  });

  it('should dispose SSH connection after deployment', async () => {
    mockConnect.mockResolvedValueOnce(undefined);

    // Mock execCommand to return expected responses for successful deployment
    mockExecCommand
      .mockResolvedValueOnce({ stdout: '/home/testuser', stderr: '', code: 0 }) // Home dir command
      .mockResolvedValueOnce({ stdout: '', stderr: '', code: 0 }) // Mock navigating to project directory
      .mockResolvedValueOnce({ stdout: '', stderr: '', code: 0 }) // Mock git pull command
      .mockResolvedValueOnce({ stdout: '', stderr: '', code: 0 }) // Mock docker compose down
      .mockResolvedValueOnce({ stdout: '', stderr: '', code: 0 }) // Mock docker system prune
      .mockResolvedValueOnce({ stdout: '', stderr: '', code: 0 }) // Mock docker compose up
      .mockResolvedValueOnce({ stdout: '', stderr: '', code: 0 }); // Mock docker ps

    await deployer.deploy(mockPasswordConfig);

    expect(mockDispose).toHaveBeenCalled();
  });
});
