'use client';

import { useState, useEffect } from 'react';
import { 
  Settings, 
  Save, 
  RefreshCw, 
  AlertTriangle, 
  CheckCircle,
  Database,
  Shield,
  Globe,
  Clock,
  DollarSign
} from 'lucide-react';
import { adminApiClient } from '@/lib/api/admin-client';

interface SystemConfig {
  id: string;
  category: string;
  key: string;
  value: string;
  description: string;
  type: 'string' | 'number' | 'boolean' | 'json';
  isEncrypted: boolean;
  updatedAt: string;
  updatedBy: string;
}

interface ConfigCategory {
  name: string;
  icon: any;
  configs: SystemConfig[];
}

export default function SystemConfigPage() {
  const [configCategories, setConfigCategories] = useState<ConfigCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingConfig, setEditingConfig] = useState<SystemConfig | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  useEffect(() => {
    fetchSystemConfig();
  }, []);

  const fetchSystemConfig = async () => {
    try {
      const response = await adminApiClient.get('/system/config');
      const configs = response.data;
      
      // Group configs by category
      const categories = groupConfigsByCategory(configs);
      setConfigCategories(categories);
    } catch (error) {
      console.error('Failed to fetch system configuration:', error);
    } finally {
      setLoading(false);
    }
  };

  const groupConfigsByCategory = (configs: SystemConfig[]): ConfigCategory[] => {
    const categoryMap = new Map<string, SystemConfig[]>();
    
    configs.forEach(config => {
      if (!categoryMap.has(config.category)) {
        categoryMap.set(config.category, []);
      }
      categoryMap.get(config.category)!.push(config);
    });

    const categoryIcons: Record<string, any> = {
      'database': Database,
      'security': Shield,
      'api': Globe,
      'performance': Clock,
      'payment': DollarSign,
      'general': Settings
    };

    return Array.from(categoryMap.entries()).map(([name, configs]) => ({
      name,
      icon: categoryIcons[name.toLowerCase()] || Settings,
      configs: configs.sort((a, b) => a.key.localeCompare(b.key))
    }));
  };

  const handleConfigUpdate = async (config: SystemConfig, newValue: string) => {
    setSaving(true);
    try {
      await adminApiClient.put(`/system/config/${config.id}`, {
        value: newValue
      });
      
      // Update local state
      setConfigCategories(prev => 
        prev.map(category => ({
          ...category,
          configs: category.configs.map(c => 
            c.id === config.id ? { ...c, value: newValue } : c
          )
        }))
      );
      
      setEditingConfig(null);
    } catch (error) {
      console.error('Failed to update configuration:', error);
      alert('Failed to update configuration');
    } finally {
      setSaving(false);
    }
  };

  const handleBackupConfig = async () => {
    try {
      const response = await adminApiClient.post('/system/config/backup', {}, {
        responseType: 'blob'
      });
      
      const blob = new Blob([response.data], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `system-config-backup-${new Date().toISOString().split('T')[0]}.json`;
      link.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to backup configuration:', error);
      alert('Failed to backup configuration');
    }
  };

  const handleRestoreConfig = async (file: File) => {
    try {
      const formData = new FormData();
      formData.append('backup', file);
      
      await adminApiClient.post('/system/config/restore', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      await fetchSystemConfig();
      alert('Configuration restored successfully');
    } catch (error) {
      console.error('Failed to restore configuration:', error);
      alert('Failed to restore configuration');
    }
  };

  const filteredCategories = configCategories.filter(category => {
    if (selectedCategory !== 'all' && category.name.toLowerCase() !== selectedCategory) {
      return false;
    }
    
    if (searchTerm) {
      return category.configs.some(config => 
        config.key.toLowerCase().includes(searchTerm.toLowerCase()) ||
        config.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    return true;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">System Configuration</h1>
          <p className="text-gray-600">Manage system settings and configuration parameters</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={handleBackupConfig}
            className="flex items-center px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
          >
            <Save className="h-4 w-4 mr-2" />
            Backup Config
          </button>
          <label className="flex items-center px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 cursor-pointer">
            <RefreshCw className="h-4 w-4 mr-2" />
            Restore Config
            <input
              type="file"
              accept=".json"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleRestoreConfig(file);
              }}
            />
          </label>
        </div>
      </div>

      {/* Filters */}
      <div className="flex space-x-4">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search configurations..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2"
          />
        </div>
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2"
        >
          <option value="all">All Categories</option>
          {configCategories.map(category => (
            <option key={category.name} value={category.name.toLowerCase()}>
              {category.name}
            </option>
          ))}
        </select>
      </div>

      {/* Configuration Categories */}
      <div className="space-y-6">
        {filteredCategories.map((category) => {
          const Icon = category.icon;
          return (
            <div key={category.name} className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-center">
                  <Icon className="h-5 w-5 text-gray-500 mr-2" />
                  <h2 className="text-lg font-semibold text-gray-900 capitalize">
                    {category.name}
                  </h2>
                  <span className="ml-2 text-sm text-gray-500">
                    ({category.configs.length} settings)
                  </span>
                </div>
              </div>
              
              <div className="divide-y divide-gray-200">
                {category.configs
                  .filter(config => 
                    !searchTerm || 
                    config.key.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    config.description.toLowerCase().includes(searchTerm.toLowerCase())
                  )
                  .map((config) => (
                    <ConfigItem
                      key={config.id}
                      config={config}
                      isEditing={editingConfig?.id === config.id}
                      onEdit={() => setEditingConfig(config)}
                      onSave={(newValue) => handleConfigUpdate(config, newValue)}
                      onCancel={() => setEditingConfig(null)}
                      saving={saving}
                    />
                  ))}
              </div>
            </div>
          );
        })}
      </div>

      {filteredCategories.length === 0 && (
        <div className="text-center py-12">
          <Settings className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No configurations found</h3>
          <p className="text-gray-600">Try adjusting your search or filter criteria.</p>
        </div>
      )}
    </div>
  );
}

interface ConfigItemProps {
  config: SystemConfig;
  isEditing: boolean;
  onEdit: () => void;
  onSave: (value: string) => void;
  onCancel: () => void;
  saving: boolean;
}

function ConfigItem({ config, isEditing, onEdit, onSave, onCancel, saving }: ConfigItemProps) {
  const [editValue, setEditValue] = useState(config.value);

  useEffect(() => {
    setEditValue(config.value);
  }, [config.value]);

  const handleSave = () => {
    onSave(editValue);
  };

  const renderValue = () => {
    if (config.isEncrypted) {
      return '••••••••';
    }

    switch (config.type) {
      case 'boolean':
        return config.value === 'true' ? 'Enabled' : 'Disabled';
      case 'json':
        try {
          return JSON.stringify(JSON.parse(config.value), null, 2);
        } catch {
          return config.value;
        }
      default:
        return config.value;
    }
  };

  const renderEditor = () => {
    switch (config.type) {
      case 'boolean':
        return (
          <select
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            className="w-full border border-gray-300 rounded px-3 py-2"
          >
            <option value="true">Enabled</option>
            <option value="false">Disabled</option>
          </select>
        );
      case 'number':
        return (
          <input
            type="number"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            className="w-full border border-gray-300 rounded px-3 py-2"
          />
        );
      case 'json':
        return (
          <textarea
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            rows={6}
            className="w-full border border-gray-300 rounded px-3 py-2 font-mono text-sm"
            placeholder="Enter valid JSON"
          />
        );
      default:
        return (
          <input
            type={config.isEncrypted ? 'password' : 'text'}
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            className="w-full border border-gray-300 rounded px-3 py-2"
          />
        );
    }
  };

  return (
    <div className="px-6 py-4">
      <div className="flex justify-between items-start">
        <div className="flex-1 mr-4">
          <div className="flex items-center mb-2">
            <h3 className="text-sm font-medium text-gray-900">{config.key}</h3>
            {config.isEncrypted && (
              <div title="Encrypted">
                <Shield className="h-4 w-4 text-yellow-500 ml-2" />
              </div>
            )}
          </div>
          <p className="text-sm text-gray-600 mb-3">{config.description}</p>
          
          {isEditing ? (
            <div className="space-y-3">
              {renderEditor()}
              <div className="flex space-x-2">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center px-3 py-1 bg-indigo-600 text-white rounded text-sm hover:bg-indigo-700 disabled:opacity-50"
                >
                  {saving ? (
                    <RefreshCw className="h-4 w-4 mr-1 animate-spin" />
                  ) : (
                    <CheckCircle className="h-4 w-4 mr-1" />
                  )}
                  Save
                </button>
                <button
                  onClick={onCancel}
                  disabled={saving}
                  className="px-3 py-1 border border-gray-300 text-gray-700 rounded text-sm hover:bg-gray-50 disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-gray-50 rounded p-3">
              <pre className="text-sm text-gray-900 whitespace-pre-wrap">
                {renderValue()}
              </pre>
            </div>
          )}
        </div>
        
        <div className="flex flex-col items-end space-y-2">
          <span className={`px-2 py-1 text-xs rounded-full ${
            config.type === 'boolean' ? 'bg-blue-100 text-blue-800' :
            config.type === 'number' ? 'bg-green-100 text-green-800' :
            config.type === 'json' ? 'bg-purple-100 text-purple-800' :
            'bg-gray-100 text-gray-800'
          }`}>
            {config.type}
          </span>
          
          {!isEditing && (
            <button
              onClick={onEdit}
              className="text-indigo-600 hover:text-indigo-800 text-sm"
            >
              Edit
            </button>
          )}
          
          <div className="text-xs text-gray-500 text-right">
            <div>Updated: {new Date(config.updatedAt).toLocaleDateString()}</div>
            <div>By: {config.updatedBy}</div>
          </div>
        </div>
      </div>
    </div>
  );
}