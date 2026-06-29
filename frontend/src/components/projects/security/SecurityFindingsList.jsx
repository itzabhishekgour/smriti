import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Shield, ShieldAlert, Check, Loader2, RefreshCw } from 'lucide-react';
import { securityService } from '../../../services/securityService';
import toast from 'react-hot-toast';
import Button from '../../ui/Button';

const SecurityFindingsList = ({ projectId, isEditor }) => {
  const qc = useQueryClient();
  const [scanning, setScanning] = useState(false);

  const { data: findings, isLoading } = useQuery({
    queryKey: ['securityFindings', projectId],
    queryFn: () => securityService.getFindings(projectId),
  });

  const resolveMutation = useMutation({
    mutationFn: (findingId) => securityService.resolveFinding(projectId, findingId),
    onSuccess: () => {
      qc.invalidateQueries(['securityFindings', projectId]);
      toast.success('Finding marked as resolved');
    },
    onError: () => toast.error('Failed to resolve finding')
  });

  const handleScan = async () => {
    setScanning(true);
    try {
      await securityService.scanRepository(projectId);
      await qc.invalidateQueries(['securityFindings', projectId]);
      toast.success('Repository scan completed');
    } catch (error) {
      toast.error('Failed to run manual scan. Check GitHub integration.');
    } finally {
      setScanning(false);
    }
  };

  if (isLoading) {
    return <div className="card p-6 h-32 animate-pulse" />;
  }

  const hasFindings = findings && findings.length > 0;

  return (
    <div className="card overflow-hidden">
      <div className="p-6 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between bg-neutral-50 dark:bg-neutral-800/20">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${hasFindings ? 'bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400' : 'bg-green-100 dark:bg-green-500/20 text-green-600 dark:text-green-400'}`}>
            {hasFindings ? <ShieldAlert size={20} /> : <Shield size={20} />}
          </div>
          <div>
            <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">Security Findings</h3>
            <p className="text-sm text-neutral-500">Scan your connected GitHub repository for leaked secrets</p>
          </div>
        </div>
        
        {isEditor && (
          <Button onClick={handleScan} disabled={scanning} size="sm" variant="secondary">
            {scanning ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
            <span className="ml-2">{scanning ? 'Scanning...' : 'Scan Now'}</span>
          </Button>
        )}
      </div>

      <div className="p-6">
        {!hasFindings ? (
          <div className="text-center py-8">
            <Shield className="w-12 h-12 text-green-500 mx-auto mb-3 opacity-20" />
            <h4 className="text-neutral-900 dark:text-neutral-100 font-medium">No secrets leaked</h4>
            <p className="text-sm text-neutral-500 mt-1">We haven't detected any exposed secrets in your default branch.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {findings.map(finding => (
              <div key={finding.id} className={`p-4 rounded-lg border ${finding.confidenceLevel === 'HIGH' ? 'bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/20' : 'bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/20'}`}>
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${finding.confidenceLevel === 'HIGH' ? 'bg-red-100 text-red-800 dark:bg-red-500/30 dark:text-red-300' : 'bg-amber-100 text-amber-800 dark:bg-amber-500/30 dark:text-amber-300'}`}>
                      {finding.confidenceLevel} CONFIDENCE
                    </span>
                    <span className="text-xs text-neutral-500 font-mono">
                      {finding.matchType.replace('_', ' ')}
                    </span>
                  </div>
                  {isEditor && (
                    <button
                      onClick={() => resolveMutation.mutate(finding.id)}
                      disabled={resolveMutation.isPending}
                      className="text-xs flex items-center gap-1 text-neutral-500 hover:text-green-600 dark:hover:text-green-400 transition-colors"
                      title="Mark as resolved (false positive or already rotated)"
                    >
                      <Check size={14} /> Resolve
                    </button>
                  )}
                </div>
                <div className="font-mono text-sm text-neutral-900 dark:text-neutral-100 mb-1">
                  File: <span className="font-semibold">{finding.filePath}</span>
                </div>
                <div className="font-mono text-xs bg-white dark:bg-neutral-900 p-2 rounded border border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400">
                  Detected value: {finding.maskedValue}
                </div>
                <div className="text-xs text-neutral-500 mt-2">
                  Detected on: {new Date(finding.detectedAt).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SecurityFindingsList;
