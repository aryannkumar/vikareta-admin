'use client';

import { useState } from 'react';
import { Download, FileText, FileSpreadsheet, File } from 'lucide-react';
import { AnalyticsData } from '@/types';
import { adminApiClient } from '@/lib/api/admin-client';

interface ReportGeneratorProps {
  data: AnalyticsData;
  dateRange: {
    from: Date;
    to: Date;
  };
  selectedMetrics: string[];
}

type ReportFormat = 'pdf' | 'excel' | 'csv';

interface ReportConfig {
  format: ReportFormat;
  includeCharts: boolean;
  includeRawData: boolean;
  sections: string[];
}

export function ReportGenerator({ data, dateRange, selectedMetrics }: ReportGeneratorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [config, setConfig] = useState<ReportConfig>({
    format: 'pdf',
    includeCharts: true,
    includeRawData: false,
    sections: ['overview', 'metrics', 'trends']
  });

  const handleGenerateReport = async () => {
    setIsGenerating(true);
    
    try {
      const response = await adminApiClient.post('/reports/generate', {
        ...config,
        dateRange,
        selectedMetrics,
        data
      }, {
        responseType: 'blob'
      });

      // Create download link
      const blob = new Blob([response.data]);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      const fileName = `analytics-report-${dateRange.from.toISOString().split('T')[0]}-to-${dateRange.to.toISOString().split('T')[0]}.${config.format}`;
      link.download = fileName;
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      setIsOpen(false);
    } catch (error) {
      console.error('Failed to generate report:', error);
      alert('Failed to generate report. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const formatIcons = {
    pdf: FileText,
    excel: FileSpreadsheet,
    csv: File
  };

  const availableSections = [
    { id: 'overview', label: 'Executive Summary', description: 'High-level overview and key insights' },
    { id: 'metrics', label: 'Key Metrics', description: 'Detailed metrics and KPIs' },
    { id: 'trends', label: 'Trend Analysis', description: 'Growth trends and patterns' },
    { id: 'users', label: 'User Analytics', description: 'User acquisition and engagement' },
    { id: 'orders', label: 'Order Analytics', description: 'Order volume and patterns' },
    { id: 'revenue', label: 'Revenue Analysis', description: 'Revenue trends and breakdown' },
    { id: 'geographic', label: 'Geographic Distribution', description: 'Regional performance data' },
    { id: 'categories', label: 'Category Performance', description: 'Top performing categories' }
  ];

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
      >
        <Download className="h-4 w-4 mr-2" />
        Generate Report
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
          <div className="p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Generate Analytics Report</h3>
            
            {/* Format Selection */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Report Format
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['pdf', 'excel', 'csv'] as ReportFormat[]).map((format) => {
                  const Icon = formatIcons[format];
                  return (
                    <button
                      key={format}
                      onClick={() => setConfig(prev => ({ ...prev, format }))}
                      className={`flex items-center justify-center p-3 border rounded-md text-sm font-medium ${
                        config.format === format
                          ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                          : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <Icon className="h-4 w-4 mr-1" />
                      {format.toUpperCase()}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Options */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Report Options
              </label>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={config.includeCharts}
                    onChange={(e) => setConfig(prev => ({ 
                      ...prev, 
                      includeCharts: e.target.checked 
                    }))}
                    className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Include Charts</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={config.includeRawData}
                    onChange={(e) => setConfig(prev => ({ 
                      ...prev, 
                      includeRawData: e.target.checked 
                    }))}
                    className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Include Raw Data</span>
                </label>
              </div>
            </div>

            {/* Sections */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Report Sections
              </label>
              <div className="max-h-48 overflow-y-auto space-y-2">
                {availableSections.map((section) => (
                  <label key={section.id} className="flex items-start">
                    <input
                      type="checkbox"
                      checked={config.sections.includes(section.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setConfig(prev => ({ 
                            ...prev, 
                            sections: [...prev.sections, section.id] 
                          }));
                        } else {
                          setConfig(prev => ({ 
                            ...prev, 
                            sections: prev.sections.filter(s => s !== section.id) 
                          }));
                        }
                      }}
                      className="mt-1 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <div className="ml-2">
                      <span className="text-sm font-medium text-gray-700">{section.label}</span>
                      <p className="text-xs text-gray-500">{section.description}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setIsOpen(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleGenerateReport}
                disabled={isGenerating || config.sections.length === 0}
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isGenerating ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2 inline-block"></div>
                    Generating...
                  </>
                ) : (
                  'Generate Report'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}