import { Deployer } from '../deployer';

// Mock NodeSSH module
const mockExecCommand = jest.fn();
const mockConnect = jest.fn();
const mockDispose = jest.fn();

jest.mock('node-ssh', () => ({
  NodeSSH: jest.fn().mockImplementation(() => ({
    connect: mockConnect,
    execCommand: mockExecCommand,
    dispose: mockDispose
  }))
}));

describe('Deployer', () => {
  let deployer: Deployer;

  const mockConfig: any = {
    host: 'test.com',
    username: 'testuser',
    password: 'testpass',
    projectPath: '/test/path',
    alias: 'test'
  };

  beforeEach(() => {
    jest.clearAllMocks();
    deployer = new Deployer();
  });

  it('should connect to SSH successfully', async () => {
    mockConnect.mockResolvedValueOnce(undefined);
    mockExecCommand.mockResolvedValue({ stdout: '', stderr: '', code: 0 });

    const result = await deployer.deploy(mockConfig);

    expect(result.success).toBe(true);
    expect(mockConnect).toHaveBeenCalledWith({
      host: mockConfig.host,
      username: mockConfig.username,
      password: mockConfig.password
    });
  });

  it('should handle SSH connection failure', async () => {
    mockConnect.mockRejectedValueOnce(new Error('Connection failed'));

    const result = await deployer.deploy(mockConfig);
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });

  it('should handle command execution failure', async () => {
    mockConnect.mockResolvedValueOnce(undefined);
    mockExecCommand.mockResolvedValueOnce({ stdout: '', stderr: 'Command failed', code: 1 });

    const result = await deployer.deploy(mockConfig);

    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });
});