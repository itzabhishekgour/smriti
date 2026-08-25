import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Shield, ShieldAlert, Check, Loader2, RefreshCw } from 'lucide-react';
import { securityService } from '../../../services/securityService';
import toast from 'react-hot-toast';
import Button from '../../ui/Button';
import Card, { CardHeader, CardBody } from '../../ui/Card';
import EmptyState from '../../ui/EmptyState';
import { Skeleton } from '../../ui/Skeleton';
import Badge from '../../ui/Badge';

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
    return (
      <Card className="mt-8">
        <CardBody className="space-y-4">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </CardBody>
      </Card>
    );
  }

  const hasFindings = findings && findings.length > 0;

  return (
    <Card className="mt-8">
      <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between bg-neutral-50 dark:bg-neutral-800/20 !py-4 gap-4">
        <div className="flex items-start sm:items-center gap-3">
          <div className={`w-10 h-10 shrink-0 rounded-xl flex items-center justify-center mt-0.5 sm:mt-0 ${hasFindings ? 'bg-danger-100 dark:bg-danger-900/30 text-danger-600 dark:text-danger-400' : 'bg-success-100 dark:bg-success-900/30 text-success-600 dark:text-success-400'}`}>
            {hasFindings ? <ShieldAlert size={20} /> : <Shield size={20} />}
          </div>
          <div>
            <h3 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">Security Findings</h3>
            <p className="text-sm text-neutral-500">Scan your connected GitHub repository for leaked secrets</p>
          </div>
        </div>
        
        {isEditor && (
          <Button onClick={handleScan} disabled={scanning} size="sm" variant="secondary" className="w-full sm:w-auto justify-center">
            {scanning ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
            <span className="ml-2">{scanning ? 'Scanning...' : 'Scan Now'}</span>
          </Button>
        )}
      </CardHeader>

      <CardBody className="!p-5">
        {!hasFindings ? (
          <EmptyState
            icon={<Shield size={24} className="text-success-500" />}
            title="No secrets leaked"
            description="We haven't detected any exposed secrets in your default branch."
          />
        ) : (
          <div className="space-y-4">
            {findings.map(finding => (
              <div key={finding.id} className={`p-4 rounded-lg border ${finding.confidenceLevel === 'HIGH' ? 'bg-danger-50 dark:bg-danger-950/30 border-danger-200 dark:border-danger-900' : 'bg-warning-50 dark:bg-warning-950/30 border-warning-200 dark:border-warning-900'}`}>
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2">
                    <Badge variant={finding.confidenceLevel === 'HIGH' ? 'danger' : 'warning'}>
                      {finding.confidenceLevel} CONFIDENCE
                    </Badge>
                    <span className="text-xs text-neutral-500 font-mono">
                      {finding.matchType.replace('_', ' ')}
                    </span>
                  </div>
                  {isEditor && (
                    <button
                      onClick={() => resolveMutation.mutate(finding.id)}
                      disabled={resolveMutation.isPending}
                      className="text-xs flex items-center gap-1 text-neutral-500 hover:text-success-600 dark:hover:text-success-400 transition-colors"
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
      </CardBody>
    </Card>
  );
};

export default SecurityFindingsList;
