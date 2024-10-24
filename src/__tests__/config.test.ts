// Mock implementation of Conf
jest.mock('conf', () => {
    return jest.fn().mockImplementation(() => {
      let store: Record<string, any> = {};
      return {
        get: jest.fn((key: string) => {
          if (key === '.') return store;
          return store[key];
        }),
        set: jest.fn((key: string, value: any) => {
          store[key] = value;
        }),
        delete: jest.fn((key: string) => {
          delete store[key];
        })
      };
    });
  });
  
  import Conf from 'conf';
  import { ConfigManager } from '../config';
  import { DeploymentConfig } from '../types';
  
  describe('ConfigManager', () => {
    let configManager: ConfigManager;
    
    const mockConfig: DeploymentConfig = {
      host: 'test.com',
      username: 'testuser',
      password: 'testpass',
      projectPath: '/test/path',
      alias: 'test'
    };
  
    beforeEach(() => {
      jest.clearAllMocks();
      configManager = new ConfigManager();
    });
  
    describe('saveConfig', () => {
      it('should save configuration successfully', () => {
        configManager.saveConfig(mockConfig);
        expect(configManager['config'].set).toHaveBeenCalledWith('test', mockConfig);
      });
  
      it('should throw error when saving config without alias', () => {
        const configWithoutAlias = { ...mockConfig } as Partial<DeploymentConfig>;
        delete configWithoutAlias.alias;
        
        expect(() => {
          configManager.saveConfig(configWithoutAlias as DeploymentConfig);
        }).toThrow('Alias is required');
      });
    });
  
    describe('getConfig', () => {
      it('should retrieve saved configuration', () => {
        configManager.saveConfig(mockConfig);
        const retrieved = configManager.getConfig('test');
        
        expect(configManager['config'].get).toHaveBeenCalledWith('test');
        expect(retrieved).toEqual(mockConfig);
      });
  
      it('should return undefined for non-existent alias', () => {
        const retrieved = configManager.getConfig('nonexistent');
        
        expect(configManager['config'].get).toHaveBeenCalledWith('nonexistent');
        expect(retrieved).toBeUndefined();
      });
    });
  
    describe('listConfigs', () => {
      it('should list all configuration aliases', () => {
        configManager.saveConfig(mockConfig);
        const configs = configManager.listConfigs();
        
        expect(configManager['config'].get).toHaveBeenCalledWith('.');
        expect(configs).toContain('test');
      });
  
      it('should return empty array when no configs exist', () => {
        const configs = configManager.listConfigs();
        
        expect(configManager['config'].get).toHaveBeenCalledWith('.');
        expect(configs).toEqual([]);
      });
    });
  
    describe('deleteConfig', () => {
      it('should delete existing configuration', () => {
        configManager.saveConfig(mockConfig);
        configManager.deleteConfig('test');
        
        expect(configManager['config'].delete).toHaveBeenCalledWith('test');
        
        const retrieved = configManager.getConfig('test');
        expect(retrieved).toBeUndefined();
      });
    });
  });