'use client';

import { useState } from 'react';
import { RefreshCw } from 'lucide-react';
import backendClient from '@/lib/api/backend-client';

interface ManualSyncButtonProps {
  onSyncComplete?: () => void;
}

export function ManualSyncButton({ onSyncComplete }: ManualSyncButtonProps) {
  const [syncing, setSyncing] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleSync = async () => {
    try {
      setSyncing(true);
      setMessage(null);
      
      const response = await backendClient.post('/app-analytics/sync/trigger');
      
      setMessage('Sync started successfully! Data will be available in a few minutes.');
      
      // Call onSyncComplete callback
      if (onSyncComplete) {
        onSyncComplete();
      }
      
      // Clear message after 5 seconds
      setTimeout(() => setMessage(null), 5000);
    } catch (error: any) {
      console.error('Failed to trigger sync:', error);
      setMessage(error.message || 'Failed to trigger sync');
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={handleSync}
        disabled={syncing}
        className={`
          flex items-center gap-2 px-4 py-2 rounded-lg font-medium
          transition-all duration-200
          ${syncing 
            ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
            : 'bg-blue-600 text-white hover:bg-blue-700 active:scale-95'
          }
        `}
      >
        <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
        {syncing ? 'Syncing...' : 'Sync Now'}
      </button>
      
      {message && (
        <div className={`
          px-4 py-2 rounded-lg text-sm font-medium
          ${message.includes('success') 
            ? 'bg-green-100 text-green-800' 
            : 'bg-red-100 text-red-800'
          }
        `}>
          {message}
        </div>
      )}
    </div>
  );
}
