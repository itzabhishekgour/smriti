import React, { useState, useEffect } from 'react';
import { Cloud, Check, Loader2, AlertTriangle, Key, Hash } from 'lucide-react';
import { renderIntegrationService } from '../../../services/renderIntegrationService';
import toast from 'react-hot-toast';
import Button from '../../ui/Button';
import Modal from '../../ui/Modal';
import Card, { CardHeader, CardBody } from '../../ui/Card';
import { Skeleton } from '../../ui/Skeleton';

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
  
  // Disconnect Confirm State
  const [showDisconnectConfirm, setShowDisconnectConfirm] = useState(false);

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
    setActionLoading(true);
    try {
      await renderIntegrationService.disconnect(projectId);
      toast.success('Disconnected from Render');
      setShowDisconnectConfirm(false);
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
      <Card className="mt-8">
        <CardBody className="flex justify-center items-center h-48">
          <Loader2 className="w-6 h-6 text-indigo-600 animate-spin" />
        </CardBody>
      </Card>
    );
  }

  return (
    <Card className="mt-8">
      <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between !py-4 gap-4">
        <div className="flex items-start sm:items-center gap-3">
          <div className="w-10 h-10 shrink-0 rounded-xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-800 dark:text-neutral-200 mt-0.5 sm:mt-0">
            <Cloud className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">Render</h3>
            <p className="text-sm text-neutral-500">Sync secrets to Render service environment variables</p>
          </div>
        </div>
        {status?.connected && (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-success-50 dark:bg-success-900/10 text-success-700 dark:text-success-400 border border-success-200 dark:border-success-900/20 shrink-0">
            <Check className="w-3.5 h-3.5" />
            Connected
          </span>
        )}
      </CardHeader>

      <CardBody className="!p-5">
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
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-neutral-50 dark:bg-neutral-800/50 rounded-lg border border-neutral-100 dark:border-neutral-800 gap-4">
              <div className="break-all">
                <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                  Connected to {status.serviceName} ({status.serviceId})
                </p>
                <p className="text-xs text-neutral-500 mt-0.5">
                  Last synced: {status.lastSyncedAt ? new Date(status.lastSyncedAt).toLocaleString() : 'Never'}
                </p>
              </div>
              
              {isEditor && (
                <div className="flex items-center gap-2">
                  <Button 
                    size="sm" 
                    variant="secondary" 
                    onClick={handlePreviewSync}
                    loading={previewLoading}
                    disabled={actionLoading}
                  >
                    <Cloud size={14} /> Sync Secrets
                  </Button>
                  <Button 
                    size="sm" 
                    variant="danger" 
                    onClick={() => setShowDisconnectConfirm(true)}
                    disabled={actionLoading}
                  >
                    Disconnect
                  </Button>
                </div>
              )}
            </div>
          </div>
        ) : (
          <form onSubmit={handleConnect} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Render Service ID
                </label>
                <input
                  type="text"
                  value={serviceId}
                  onChange={(e) => setServiceId(e.target.value)}
                  disabled={!isEditor || actionLoading}
                  className="input-base block w-full"
                  placeholder="srv-cxxxxxxxxxxxxxxxxxx"
                  required
                />
                <p className="mt-1.5 text-xs text-neutral-500">Find this in your Render dashboard URL: render.com/web/srv-...</p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Render API Key
                </label>
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  disabled={!isEditor || actionLoading}
                  className="input-base block w-full"
                  placeholder="rnd_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                  required
                />
                <p className="mt-1.5 text-xs text-neutral-500">Generate an API key in your Render Account Settings</p>
              </div>
            </div>

            {isEditor && (
              <div className="pt-2">
                <Button type="submit" loading={actionLoading} disabled={!serviceId || !apiKey}>
                  Connect Render
                </Button>
              </div>
            )}
          </form>
        )}
      </CardBody>

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

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
                <div className="bg-neutral-50 dark:bg-neutral-800/50 rounded-lg p-3 border border-neutral-100 dark:border-neutral-800">
                  <span className="block text-2xl font-bold text-success-600 dark:text-success-500">{previewData.newCount}</span>
                  <span className="text-xs font-medium text-neutral-500 uppercase">New</span>
                </div>
                <div className="bg-neutral-50 dark:bg-neutral-800/50 rounded-lg p-3 border border-neutral-100 dark:border-neutral-800">
                  <span className="block text-2xl font-bold text-primary-600 dark:text-primary-500">{previewData.updatedCount}</span>
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
                    <span className="text-xs font-semibold text-success-600 dark:text-success-500 uppercase px-1">Will be added:</span>
                    <div className="flex flex-wrap gap-1 mt-1 px-1">
                      {previewData.newKeys.map(k => <span key={k} className="bg-success-100 dark:bg-success-900/20 text-success-800 dark:text-success-300 text-xs px-2 py-0.5 rounded">{k}</span>)}
                    </div>
                  </div>
                )}
                {previewData.updatedKeys.length > 0 && (
                  <div className="mb-2">
                    <span className="text-xs font-semibold text-primary-600 dark:text-primary-500 uppercase px-1">Will be updated:</span>
                    <div className="flex flex-wrap gap-1 mt-1 px-1">
                      {previewData.updatedKeys.map(k => <span key={k} className="bg-primary-100 dark:bg-primary-900/20 text-primary-800 dark:text-primary-300 text-xs px-2 py-0.5 rounded">{k}</span>)}
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
              <Button
                variant="secondary"
                onClick={() => setShowPreview(false)}
                disabled={actionLoading}
              >
                Cancel
              </Button>
              <Button
                onClick={handleConfirmSync}
                loading={actionLoading}
              >
                Confirm & Push
              </Button>
            </div>
          </div>
        </div>
      )}
      {/* Disconnect Modal */}
      <Modal
        open={showDisconnectConfirm}
        onClose={() => setShowDisconnectConfirm(false)}
        title="Disconnect Render"
        size="sm"
      >
        <div className="p-6 space-y-6">
          <p className="text-sm text-neutral-600 dark:text-neutral-300">
            Are you sure you want to disconnect <strong>{status?.serviceName}</strong>?
            <br /><br />
            Secrets will no longer be synced to this service, but existing environment variables on Render will not be deleted.
          </p>
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setShowDisconnectConfirm(false)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              loading={actionLoading}
              onClick={handleDisconnect}
            >
              Disconnect
            </Button>
          </div>
        </div>
      </Modal>
    </Card>
  );
};

export default RenderIntegrationCard;
