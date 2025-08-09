'use client';

import { useState, useEffect } from 'react';
import { adminApiClient } from '@/lib/api/admin-client';

interface NotificationTemplate {
  id: string;
  name: string;
  type: 'email' | 'sms' | 'push' | 'whatsapp';
  subject?: string;
  content: string;
  variables: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function NotificationTemplatesPage() {
  const [templates, setTemplates] = useState<NotificationTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState<NotificationTemplate | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [testData, setTestData] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const response = await adminApiClient.get('/system/notification-templates');
      setTemplates(response.data);
    } catch (error) {
      console.error('Failed to fetch notification templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveTemplate = async (template: Partial<NotificationTemplate>) => {
    try {
      if (selectedTemplate?.id) {
        await adminApiClient.put(`/system/notification-templates/${selectedTemplate.id}`, template);
      } else {
        await adminApiClient.post('/system/notification-templates', template);
      }
      await fetchTemplates();
      setSelectedTemplate(null);
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to save template:', error);
    }
  };

  const handleTestTemplate = async (templateId: string) => {
    try {
      await adminApiClient.post(`/system/notification-templates/${templateId}/test`, {
        testData,
        recipient: 'admin@vikareta.com'
      });
      alert('Test notification sent successfully!');
    } catch (error) {
      console.error('Failed to send test notification:', error);
      alert('Failed to send test notification');
    }
  };

  const toggleTemplateStatus = async (templateId: string, isActive: boolean) => {
    try {
      await adminApiClient.patch(`/system/notification-templates/${templateId}`, { isActive });
      await fetchTemplates();
    } catch (error) {
      console.error('Failed to update template status:', error);
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
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notification Templates</h1>
          <p className="text-gray-600">Manage email, SMS, push, and WhatsApp notification templates</p>
        </div>
        <button
          onClick={() => {
            setSelectedTemplate(null);
            setIsEditing(true);
          }}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700"
        >
          Create Template
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Templates List */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b">
            <h2 className="text-lg font-semibold">Templates</h2>
          </div>
          <div className="divide-y">
            {templates.map((template) => (
              <div key={template.id} className="p-4 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">{template.name}</h3>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        template.type === 'email' ? 'bg-blue-100 text-blue-800' :
                        template.type === 'sms' ? 'bg-green-100 text-green-800' :
                        template.type === 'push' ? 'bg-purple-100 text-purple-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {template.type.toUpperCase()}
                      </span>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        template.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {template.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => {
                        setSelectedTemplate(template);
                        setIsEditing(false);
                      }}
                      className="text-indigo-600 hover:text-indigo-800"
                    >
                      View
                    </button>
                    <button
                      onClick={() => {
                        setSelectedTemplate(template);
                        setIsEditing(true);
                      }}
                      className="text-gray-600 hover:text-gray-800"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => toggleTemplateStatus(template.id, !template.isActive)}
                      className={template.isActive ? 'text-red-600 hover:text-red-800' : 'text-green-600 hover:text-green-800'}
                    >
                      {template.isActive ? 'Disable' : 'Enable'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Template Editor/Viewer */}
        <div className="bg-white rounded-lg shadow">
          {selectedTemplate || isEditing ? (
            <TemplateEditor
              template={selectedTemplate}
              isEditing={isEditing}
              onSave={handleSaveTemplate}
              onCancel={() => {
                setSelectedTemplate(null);
                setIsEditing(false);
              }}
              onTest={handleTestTemplate}
              testData={testData}
              setTestData={setTestData}
            />
          ) : (
            <div className="p-6 text-center text-gray-500">
              Select a template to view or edit
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

interface TemplateEditorProps {
  template: NotificationTemplate | null;
  isEditing: boolean;
  onSave: (template: Partial<NotificationTemplate>) => void;
  onCancel: () => void;
  onTest: (templateId: string) => void;
  testData: Record<string, string>;
  setTestData: (data: Record<string, string>) => void;
}

function TemplateEditor({ 
  template, 
  isEditing, 
  onSave, 
  onCancel, 
  onTest, 
  testData, 
  setTestData 
}: TemplateEditorProps) {
  const [formData, setFormData] = useState({
    name: template?.name || '',
    type: template?.type || 'email' as const,
    subject: template?.subject || '',
    content: template?.content || '',
    variables: template?.variables || [],
    isActive: template?.isActive ?? true
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-semibold">
          {isEditing ? (template ? 'Edit Template' : 'Create Template') : 'Template Details'}
        </h2>
        <div className="flex space-x-2">
          {template && !isEditing && (
            <button
              onClick={() => onTest(template.id)}
              className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700"
            >
              Test
            </button>
          )}
          <button
            onClick={onCancel}
            className="text-gray-600 hover:text-gray-800"
          >
            Close
          </button>
        </div>
      </div>

      {isEditing ? (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Template Name
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Type
            </label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
            >
              <option value="email">Email</option>
              <option value="sms">SMS</option>
              <option value="push">Push Notification</option>
              <option value="whatsapp">WhatsApp</option>
            </select>
          </div>

          {(formData.type === 'email' || formData.type === 'push') && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Subject
              </label>
              <input
                type="text"
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Content
            </label>
            <textarea
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              rows={8}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
              placeholder="Use {{variable}} for dynamic content"
              required
            />
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="isActive"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              className="mr-2"
            />
            <label htmlFor="isActive" className="text-sm text-gray-700">
              Active
            </label>
          </div>

          <div className="flex space-x-3">
            <button
              type="submit"
              className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700"
            >
              Save Template
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </form>
      ) : template ? (
        <div className="space-y-4">
          <div>
            <h3 className="font-medium text-gray-900">{template.name}</h3>
            <p className="text-sm text-gray-600">Type: {template.type.toUpperCase()}</p>
          </div>

          {template.subject && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Subject
              </label>
              <p className="text-gray-900">{template.subject}</p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Content
            </label>
            <div className="bg-gray-50 p-3 rounded-lg">
              <pre className="whitespace-pre-wrap text-sm">{template.content}</pre>
            </div>
          </div>

          {template.variables.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Test Variables
              </label>
              <div className="space-y-2">
                {template.variables.map((variable) => (
                  <div key={variable}>
                    <label className="block text-xs text-gray-600">{variable}</label>
                    <input
                      type="text"
                      value={testData[variable] || ''}
                      onChange={(e) => setTestData({ ...testData, [variable]: e.target.value })}
                      className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                      placeholder={`Enter value for ${variable}`}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}