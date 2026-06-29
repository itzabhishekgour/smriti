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
      <div className="card p-6 flex justify-center items-center h-48">
        <Loader2 className="w-6 h-6 text-indigo-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="card overflow-hidden relative">
      <div className="p-6 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-800 dark:text-neutral-200">
            <Cloud className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">Render</h3>
            <p className="text-sm text-neutral-500">Sync secrets to Render service environment variables</p>
          </div>
        </div>
        {status?.connected && (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-50 dark:bg-green-500/10 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-500/20">
            <Check className="w-3.5 h-3.5" />
            Connected
          </span>
        )}
      </div>

      <div className="p-6">
        {!isEditor && (
          <div className="mb-6 p-4 bg-amber-50 dark:bg-amber-500/10 rounded-lg border border-amber-200 dark:border-amber-500/20 flex gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0" />
            <p className="text-sm text-amber-800 dark:text-amber-200">
              Only project Owners and Editors can manage integrations.
            </p>
          </div>
        )}

        {status?.connected ? (
          <div className="space-y-6">
            <div className="bg-neutral-50 dark:bg-neutral-800/50 rounded-lg p-4 border border-neutral-100 dark:border-neutral-800">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">Connected Service</p>
                  <p className="text-sm text-neutral-500 mt-1">{status.serviceName} ({status.serviceId})</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">Last Synced</p>
                  <p className="text-sm text-neutral-500 mt-1">
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
              <label className="block text-sm font-medium mb-1">
                Render Service ID
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Hash className="h-5 w-5 text-neutral-400" />
                </div>
                <input
                  type="text"
                  value={serviceId}
                  onChange={(e) => setServiceId(e.target.value)}
                  disabled={!isEditor || actionLoading}
                  className="input-base pl-10 block w-full py-2"
                  placeholder="srv-cxxxxxxxxxxxxxxxxxx"
                  required
                />
              </div>
              <p className="mt-1 text-xs text-neutral-500">Find this in your Render dashboard URL: render.com/web/srv-...</p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Render API Key
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Key className="h-5 w-5 text-neutral-400" />
                </div>
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  disabled={!isEditor || actionLoading}
                  className="input-base pl-10 block w-full py-2"
                  placeholder="rnd_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                  required
                />
              </div>
              <p className="mt-1 text-xs text-neutral-500">Generate an API key in your Render Account Settings</p>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-neutral-900 rounded-xl shadow-xl w-full max-w-lg overflow-hidden border border-neutral-200 dark:border-neutral-800">
            <div className="p-6 border-b border-neutral-100 dark:border-neutral-800">
              <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">Sync Preview</h3>
              <p className="text-sm text-neutral-500 mt-1">Review the changes before applying them to Render</p>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-lg p-3 text-sm text-amber-800 dark:text-amber-200 flex items-start gap-2">
                <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                <p>Render replaces all environment variables on sync. Smriti will safely merge your secrets with the existing variables on Render.</p>
              </div>

              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="bg-neutral-50 dark:bg-neutral-800/50 rounded-lg p-3 border border-neutral-100 dark:border-neutral-800">
                  <span className="block text-2xl font-bold text-green-600 dark:text-green-500">{previewData.newCount}</span>
                  <span className="text-xs font-medium text-neutral-500 uppercase">New</span>
                </div>
                <div className="bg-neutral-50 dark:bg-neutral-800/50 rounded-lg p-3 border border-neutral-100 dark:border-neutral-800">
                  <span className="block text-2xl font-bold text-blue-600 dark:text-blue-500">{previewData.updatedCount}</span>
                  <span className="text-xs font-medium text-neutral-500 uppercase">Updated</span>
                </div>
                <div className="bg-neutral-50 dark:bg-neutral-800/50 rounded-lg p-3 border border-neutral-100 dark:border-neutral-800">
                  <span className="block text-2xl font-bold text-neutral-600 dark:text-neutral-400">{previewData.preservedCount}</span>
                  <span className="text-xs font-medium text-neutral-500 uppercase">Preserved</span>
                </div>
              </div>
              
              <div className="max-h-40 overflow-y-auto border border-neutral-100 dark:border-neutral-800 rounded-lg text-sm bg-neutral-50 dark:bg-neutral-800/50 p-2">
                {previewData.newKeys.length > 0 && (
                  <div className="mb-2">
                    <span className="text-xs font-semibold text-green-600 dark:text-green-500 uppercase px-1">Will be added:</span>
                    <div className="flex flex-wrap gap-1 mt-1 px-1">
                      {previewData.newKeys.map(k => <span key={k} className="bg-green-100 dark:bg-green-500/20 text-green-800 dark:text-green-300 text-xs px-2 py-0.5 rounded">{k}</span>)}
                    </div>
                  </div>
                )}
                {previewData.updatedKeys.length > 0 && (
                  <div className="mb-2">
                    <span className="text-xs font-semibold text-blue-600 dark:text-blue-500 uppercase px-1">Will be updated:</span>
                    <div className="flex flex-wrap gap-1 mt-1 px-1">
                      {previewData.updatedKeys.map(k => <span key={k} className="bg-blue-100 dark:bg-blue-500/20 text-blue-800 dark:text-blue-300 text-xs px-2 py-0.5 rounded">{k}</span>)}
                    </div>
                  </div>
                )}
                {previewData.preservedKeys.length > 0 && (
                  <div>
                    <span className="text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase px-1">Render-only (Unchanged):</span>
                    <div className="flex flex-wrap gap-1 mt-1 px-1">
                      {previewData.preservedKeys.map(k => <span key={k} className="bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 text-xs px-2 py-0.5 rounded">{k}</span>)}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="p-4 border-t border-neutral-100 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800/50 flex justify-end gap-3">
              <button
                onClick={() => setShowPreview(false)}
                disabled={actionLoading}
                className="px-4 py-2 text-sm font-medium text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded-lg transition-colors"
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
