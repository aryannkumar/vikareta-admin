'use client';

import { useState, useEffect } from 'react';
import { adminApiClient } from '@/lib/api/admin-client';

interface FeatureFlag {
  id: string;
  name: string;
  key: string;
  description: string;
  isEnabled: boolean;
  environment: 'development' | 'staging' | 'production' | 'all';
  rolloutPercentage: number;
  targetUsers?: string[];
  conditions?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

interface ABTest {
  id: string;
  name: string;
  description: string;
  status: 'draft' | 'running' | 'paused' | 'completed';
  variants: {
    name: string;
    key: string;
    percentage: number;
    config: Record<string, any>;
  }[];
  targetAudience: {
    userTypes?: string[];
    locations?: string[];
    devices?: string[];
  };
  metrics: {
    conversionRate: number;
    participants: number;
    conversions: number;
  };
  startDate?: string;
  endDate?: string;
  createdAt: string;
}

export default function FeatureFlagsPage() {
  const [activeTab, setActiveTab] = useState<'flags' | 'tests'>('flags');
  const [featureFlags, setFeatureFlags] = useState<FeatureFlag[]>([]);
  const [abTests, setABTests] = useState<ABTest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFlag, setSelectedFlag] = useState<FeatureFlag | null>(null);
  const [selectedTest, setSelectedTest] = useState<ABTest | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [flagsResponse, testsResponse] = await Promise.all([
        adminApiClient.get('/system/feature-flags'),
        adminApiClient.get('/system/ab-tests')
      ]);
      setFeatureFlags(flagsResponse.data);
      setABTests(testsResponse.data);
    } catch (error) {
      console.error('Failed to fetch feature flags and A/B tests:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleFeatureFlag = async (flagId: string, isEnabled: boolean) => {
    try {
      await adminApiClient.patch(`/system/feature-flags/${flagId}`, { isEnabled });
      await fetchData();
    } catch (error) {
      console.error('Failed to toggle feature flag:', error);
    }
  };

  const updateRolloutPercentage = async (flagId: string, percentage: number) => {
    try {
      await adminApiClient.patch(`/system/feature-flags/${flagId}`, { rolloutPercentage: percentage });
      await fetchData();
    } catch (error) {
      console.error('Failed to update rollout percentage:', error);
    }
  };

  const saveFeatureFlag = async (flag: Partial<FeatureFlag>) => {
    try {
      if (selectedFlag?.id) {
        await adminApiClient.put(`/system/feature-flags/${selectedFlag.id}`, flag);
      } else {
        await adminApiClient.post('/system/feature-flags', flag);
      }
      await fetchData();
      setSelectedFlag(null);
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to save feature flag:', error);
    }
  };

  const saveABTest = async (test: Partial<ABTest>) => {
    try {
      if (selectedTest?.id) {
        await adminApiClient.put(`/system/ab-tests/${selectedTest.id}`, test);
      } else {
        await adminApiClient.post('/system/ab-tests', test);
      }
      await fetchData();
      setSelectedTest(null);
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to save A/B test:', error);
    }
  };

  const updateTestStatus = async (testId: string, status: ABTest['status']) => {
    try {
      await adminApiClient.patch(`/system/ab-tests/${testId}`, { status });
      await fetchData();
    } catch (error) {
      console.error('Failed to update test status:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Feature Management</h1>
        <p className="text-gray-600">Manage feature flags and A/B testing experiments</p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('flags')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'flags'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Feature Flags ({featureFlags.length})
          </button>
          <button
            onClick={() => setActiveTab('tests')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'tests'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            A/B Tests ({abTests.length})
          </button>
        </nav>
      </div>

      {activeTab === 'flags' ? (
        <FeatureFlagsTab
          flags={featureFlags}
          onToggle={toggleFeatureFlag}
          onUpdateRollout={updateRolloutPercentage}
          onEdit={(flag) => {
            setSelectedFlag(flag);
            setIsEditing(true);
          }}
          onCreate={() => {
            setSelectedFlag(null);
            setIsEditing(true);
          }}
        />
      ) : (
        <ABTestsTab
          tests={abTests}
          onUpdateStatus={updateTestStatus}
          onEdit={(test) => {
            setSelectedTest(test);
            setIsEditing(true);
          }}
          onCreate={() => {
            setSelectedTest(null);
            setIsEditing(true);
          }}
        />
      )}

      {/* Modals */}
      {isEditing && activeTab === 'flags' && (
        <FeatureFlagModal
          flag={selectedFlag}
          onSave={saveFeatureFlag}
          onCancel={() => {
            setSelectedFlag(null);
            setIsEditing(false);
          }}
        />
      )}

      {isEditing && activeTab === 'tests' && (
        <ABTestModal
          test={selectedTest}
          onSave={saveABTest}
          onCancel={() => {
            setSelectedTest(null);
            setIsEditing(false);
          }}
        />
      )}
    </div>
  );
}

interface FeatureFlagsTabProps {
  flags: FeatureFlag[];
  onToggle: (id: string, enabled: boolean) => void;
  onUpdateRollout: (id: string, percentage: number) => void;
  onEdit: (flag: FeatureFlag) => void;
  onCreate: () => void;
}

function FeatureFlagsTab({ flags, onToggle, onUpdateRollout, onEdit, onCreate }: FeatureFlagsTabProps) {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="flex space-x-4">
          <select className="border border-gray-300 rounded-lg px-3 py-2">
            <option value="">All Environments</option>
            <option value="development">Development</option>
            <option value="staging">Staging</option>
            <option value="production">Production</option>
          </select>
          <select className="border border-gray-300 rounded-lg px-3 py-2">
            <option value="">All Status</option>
            <option value="enabled">Enabled</option>
            <option value="disabled">Disabled</option>
          </select>
        </div>
        <button
          onClick={onCreate}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700"
        >
          Create Feature Flag
        </button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Feature
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Environment
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Rollout
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {flags.map((flag) => (
              <tr key={flag.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div>
                    <div className="text-sm font-medium text-gray-900">{flag.name}</div>
                    <div className="text-sm text-gray-500">{flag.key}</div>
                    <div className="text-xs text-gray-400">{flag.description}</div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800">
                    {flag.environment}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={flag.isEnabled}
                      onChange={(e) => onToggle(flag.id, e.target.checked)}
                      className="mr-2"
                    />
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      flag.isEnabled ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {flag.isEnabled ? 'Enabled' : 'Disabled'}
                    </span>
                  </label>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center space-x-2">
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={flag.rolloutPercentage}
                      onChange={(e) => onUpdateRollout(flag.id, parseInt(e.target.value))}
                      className="w-20"
                      disabled={!flag.isEnabled}
                    />
                    <span className="text-sm text-gray-600 w-12">
                      {flag.rolloutPercentage}%
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button
                    onClick={() => onEdit(flag)}
                    className="text-indigo-600 hover:text-indigo-900 mr-4"
                  >
                    Edit
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

interface ABTestsTabProps {
  tests: ABTest[];
  onUpdateStatus: (id: string, status: ABTest['status']) => void;
  onEdit: (test: ABTest) => void;
  onCreate: () => void;
}

function ABTestsTab({ tests, onUpdateStatus, onEdit, onCreate }: ABTestsTabProps) {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="flex space-x-4">
          <select className="border border-gray-300 rounded-lg px-3 py-2">
            <option value="">All Status</option>
            <option value="draft">Draft</option>
            <option value="running">Running</option>
            <option value="paused">Paused</option>
            <option value="completed">Completed</option>
          </select>
        </div>
        <button
          onClick={onCreate}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700"
        >
          Create A/B Test
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tests.map((test) => (
          <div key={test.id} className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-medium text-gray-900">{test.name}</h3>
                <p className="text-sm text-gray-600">{test.description}</p>
              </div>
              <span className={`px-2 py-1 text-xs rounded-full ${
                test.status === 'running' ? 'bg-green-100 text-green-800' :
                test.status === 'paused' ? 'bg-yellow-100 text-yellow-800' :
                test.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {test.status}
              </span>
            </div>

            <div className="space-y-3">
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Variants</h4>
                {test.variants.map((variant, index) => (
                  <div key={index} className="flex justify-between text-sm">
                    <span>{variant.name}</span>
                    <span>{variant.percentage}%</span>
                  </div>
                ))}
              </div>

              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Metrics</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-gray-600">Participants:</span>
                    <span className="ml-1 font-medium">{test.metrics.participants}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Conversions:</span>
                    <span className="ml-1 font-medium">{test.metrics.conversions}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-gray-600">Conversion Rate:</span>
                    <span className="ml-1 font-medium">{test.metrics.conversionRate}%</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4 flex space-x-2">
              <button
                onClick={() => onEdit(test)}
                className="flex-1 text-indigo-600 border border-indigo-600 px-3 py-1 rounded text-sm hover:bg-indigo-50"
              >
                Edit
              </button>
              {test.status === 'draft' && (
                <button
                  onClick={() => onUpdateStatus(test.id, 'running')}
                  className="flex-1 bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700"
                >
                  Start
                </button>
              )}
              {test.status === 'running' && (
                <button
                  onClick={() => onUpdateStatus(test.id, 'paused')}
                  className="flex-1 bg-yellow-600 text-white px-3 py-1 rounded text-sm hover:bg-yellow-700"
                >
                  Pause
                </button>
              )}
              {test.status === 'paused' && (
                <button
                  onClick={() => onUpdateStatus(test.id, 'running')}
                  className="flex-1 bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700"
                >
                  Resume
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Modal components would be implemented here
function FeatureFlagModal({ flag, onSave, onCancel }: any) {
  return <div>Feature Flag Modal - Implementation needed</div>;
}

function ABTestModal({ test, onSave, onCancel }: any) {
  return <div>A/B Test Modal - Implementation needed</div>;
}