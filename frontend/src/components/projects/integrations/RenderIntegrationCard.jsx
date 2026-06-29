import React, { useState, useEffect } from 'react';
import { Cloud, Check, Loader2, AlertTriangle, Key, Hash } from 'lucide-react';
import { renderIntegrationService } from '../../../services/renderIntegrationService';
import toast from 'react-hot-toast';

const RenderIntegrationCard = ({ projectId, role }) => {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  
  // Connect Form State
  const [serviceId, setServiceId] = useState('');
  const [apiKey, setApiKey] = useState('');
  
  // Preview Modal State
  const [showPreview, setShowPreview] = useState(false);
  const [previewData, setPreviewData] = useState(null);

  const isEditor = role === 'OWNER' || role === 'EDITOR';

  const fetchStatus = async () => {
    try {
      const data = await renderIntegrationService.getStatus(projectId);
      setStatus(data);
    } catch (error) {
      toast.error('Failed to fetch Render integration status');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, [projectId]);

  const handleConnect = async (e) => {
    e.preventDefault();
    if (!serviceId.trim() || !apiKey.trim()) {
      toast.error('Please provide both Service ID and API Key');
      return;
    }
    
    setActionLoading(true);
    try {
      await renderIntegrationService.connect(projectId, serviceId.trim(), apiKey.trim());
      toast.success('Successfully connected to Render service!');
      fetchStatus();
      setServiceId('');
      setApiKey('');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to connect to Render');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDisconnect = async () => {
    if (!confirm('Are you sure you want to disconnect? Existing environment variables on Render will not be deleted.')) return;
    
    setActionLoading(true);
    try {
      await renderIntegrationService.disconnect(projectId);
      toast.success('Disconnected from Render');
      fetchStatus();
    } catch (error) {
      toast.error('Failed to disconnect');
    } finally {
      setActionLoading(false);
    }
  };

  const handlePreviewSync = async () => {
    setPreviewLoading(true);
    try {
      const data = await renderIntegrationService.previewSync(projectId);
      setPreviewData(data);
      setShowPreview(true);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to generate sync preview');
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleConfirmSync = async () => {
    setActionLoading(true);
    try {
      const result = await renderIntegrationService.sync(projectId);
      toast.success(`Synced successfully! Added ${result.added}, Updated ${result.updated}, Preserved ${result.preserved}`);
      setShowPreview(false);
      fetchStatus();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to sync secrets to Render');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-100 p-6 flex justify-center items-center h-48">
        <Loader2 className="w-6 h-6 text-indigo-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-100 overflow-hidden relative">
      <div className="p-6 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gray-50 flex items-center justify-center border border-gray-100">
            <Cloud className="w-5 h-5 text-gray-700" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Render</h3>
            <p className="text-sm text-gray-500">Sync secrets to Render service environment variables</p>
          </div>
        </div>
        {status?.connected && (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-200">
            <Check className="w-3.5 h-3.5" />
            Connected
          </span>
        )}
      </div>

      <div className="p-6">
        {!isEditor && (
          <div className="mb-6 p-4 bg-amber-50 rounded-lg border border-amber-200 flex gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />
            <p className="text-sm text-amber-800">
              Only project Owners and Editors can manage integrations.
            </p>
          </div>
        )}

        {status?.connected ? (
          <div className="space-y-6">
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">Connected Service</p>
                  <p className="text-sm text-gray-500 mt-1">{status.serviceName} ({status.serviceId})</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">Last Synced</p>
                  <p className="text-sm text-gray-500 mt-1">
                    {status.lastSyncedAt ? new Date(status.lastSyncedAt).toLocaleString() : 'Never'}
                  </p>
                </div>
              </div>
            </div>

            {isEditor && (
              <div className="flex gap-3">
                <button
                  onClick={handlePreviewSync}
                  disabled={previewLoading || actionLoading}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {previewLoading ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Preparing Sync...</>
                  ) : (
                    <><Cloud className="w-4 h-4" /> Sync Secrets</>
                  )}
                </button>
                <button
                  onClick={handleDisconnect}
                  disabled={actionLoading}
                  className="px-4 py-2 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
                >
                  Disconnect
                </button>
              </div>
            )}
          </div>
        ) : (
          <form onSubmit={handleConnect} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Render Service ID
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Hash className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  value={serviceId}
                  onChange={(e) => setServiceId(e.target.value)}
                  disabled={!isEditor || actionLoading}
                  className="pl-10 block w-full border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm py-2"
                  placeholder="srv-cxxxxxxxxxxxxxxxxxx"
                  required
                />
              </div>
              <p className="mt-1 text-xs text-gray-500">Find this in your Render dashboard URL: render.com/web/srv-...</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Render API Key
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Key className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  disabled={!isEditor || actionLoading}
                  className="pl-10 block w-full border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm py-2"
                  placeholder="rnd_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                  required
                />
              </div>
              <p className="mt-1 text-xs text-gray-500">Generate an API key in your Render Account Settings</p>
            </div>

            {isEditor && (
              <button
                type="submit"
                disabled={actionLoading || !serviceId || !apiKey}
                className="w-full flex justify-center py-2.5 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                {actionLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Connect Render'}
              </button>
            )}
          </form>
        )}
      </div>

      {/* Preview Modal */}
      {showPreview && previewData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden">
            <div className="p-6 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900">Sync Preview</h3>
              <p className="text-sm text-gray-500 mt-1">Review the changes before applying them to Render</p>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800 flex items-start gap-2">
                <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                <p>Render replaces all environment variables on sync. Smriti will safely merge your secrets with the existing variables on Render.</p>
              </div>

              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                  <span className="block text-2xl font-bold text-green-600">{previewData.newCount}</span>
                  <span className="text-xs font-medium text-gray-500 uppercase">New</span>
                </div>
                <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                  <span className="block text-2xl font-bold text-blue-600">{previewData.updatedCount}</span>
                  <span className="text-xs font-medium text-gray-500 uppercase">Updated</span>
                </div>
                <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                  <span className="block text-2xl font-bold text-gray-600">{previewData.preservedCount}</span>
                  <span className="text-xs font-medium text-gray-500 uppercase">Preserved</span>
                </div>
              </div>
              
              <div className="max-h-40 overflow-y-auto border border-gray-100 rounded-lg text-sm bg-gray-50 p-2">
                {previewData.newKeys.length > 0 && (
                  <div className="mb-2">
                    <span className="text-xs font-semibold text-green-600 uppercase px-1">Will be added:</span>
                    <div className="flex flex-wrap gap-1 mt-1 px-1">
                      {previewData.newKeys.map(k => <span key={k} className="bg-green-100 text-green-800 text-xs px-2 py-0.5 rounded">{k}</span>)}
                    </div>
                  </div>
                )}
                {previewData.updatedKeys.length > 0 && (
                  <div className="mb-2">
                    <span className="text-xs font-semibold text-blue-600 uppercase px-1">Will be updated:</span>
                    <div className="flex flex-wrap gap-1 mt-1 px-1">
                      {previewData.updatedKeys.map(k => <span key={k} className="bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded">{k}</span>)}
                    </div>
                  </div>
                )}
                {previewData.preservedKeys.length > 0 && (
                  <div>
                    <span className="text-xs font-semibold text-gray-600 uppercase px-1">Render-only (Unchanged):</span>
                    <div className="flex flex-wrap gap-1 mt-1 px-1">
                      {previewData.preservedKeys.map(k => <span key={k} className="bg-gray-200 text-gray-700 text-xs px-2 py-0.5 rounded">{k}</span>)}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
              <button
                onClick={() => setShowPreview(false)}
                disabled={actionLoading}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmSync}
                disabled={actionLoading}
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors flex items-center gap-2"
              >
                {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirm & Push'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RenderIntegrationCard;
