'use client';
import { useEffect, useState, useCallback } from 'react';
import BrandButton from '../components/BrandButton';
import { BrandInput, BrandSelect } from '../components/BrandInput';
import { adminApi, ApiResponse } from '../lib/api';

interface ApiKey { id: string; name: string; permissions: string; expires_at?: string; last_used_at?: string; created_at: string; }

export default function ApiKeysPage() {
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [newKey, setNewKey] = useState('');
  const [name, setName] = useState('');
  const [permissions, setPermissions] = useState('read');
  const [expiry, setExpiry] = useState('never');
  const [generating, setGenerating] = useState(false);

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const res = await adminApi.get('api-keys') as ApiResponse<ApiKey[]>;
      setKeys(res.data ?? []);
    } catch (e: unknown) { setError(e instanceof Error ? e.message : 'Failed to load'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleGenerate = async () => {
    if (!name) { alert('Key name is required'); return; }
    setGenerating(true);
    try {
      const expiresAt = expiry === 'never' ? undefined
        : expiry === '30d' ? new Date(Date.now() + 30 * 86400000).toISOString()
        : expiry === '90d' ? new Date(Date.now() + 90 * 86400000).toISOString()
        : new Date(Date.now() + 365 * 86400000).toISOString();

      const res = await adminApi.create('api-keys', { name, permissions, expires_at: expiresAt }) as ApiResponse<ApiKey & { key: string }>;
      if (res.data?.key) setNewKey(res.data.key);
      setName(''); setPermissions('read'); setExpiry('never');
      load();
    } catch { alert('Failed to generate key'); }
    finally { setGenerating(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Revoke this API key? This cannot be undone.')) return;
    try { await adminApi.delete('api-keys', id); load(); }
    catch { alert('Failed to revoke key'); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-black">API Keys</h1>
          <p className="text-sm text-zinc-400 mt-0.5">Manage API keys for external integrations and services.</p>
        </div>
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-xl px-5 py-4 flex items-start gap-3">
        <span className="text-yellow-500 text-base mt-0.5">⚠</span>
        <div>
          <p className="text-sm font-medium text-yellow-800">Keep your API keys secure</p>
          <p className="text-xs text-yellow-700 mt-0.5">Never share API keys publicly or commit them to version control. Rotate keys immediately if compromised.</p>
        </div>
      </div>

      {newKey && (
        <div className="bg-green-50 border border-green-200 rounded-xl px-5 py-4">
          <p className="text-sm font-semibold text-green-800 mb-2">Key generated — copy it now, it won't be shown again</p>
          <div className="flex items-center gap-3">
            <code className="flex-1 text-xs bg-white border border-green-200 rounded-lg px-3 py-2 font-mono break-all">{newKey}</code>
            <button onClick={() => { navigator.clipboard.writeText(newKey); }}
              className="text-xs px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors shrink-0">Copy</button>
            <button onClick={() => setNewKey('')} className="text-xs text-green-600 hover:text-green-800 transition-colors shrink-0">Dismiss</button>
          </div>
        </div>
      )}

      <div className="bg-white border border-zinc-200 rounded-xl p-5 space-y-4">
        <h2 className="text-sm font-semibold text-black">Generate New Key</h2>
        <div className="flex items-end gap-3 flex-wrap">
          <div>
            <label className="block text-xs text-zinc-500 mb-1">Key Name / Label</label>
            <BrandInput type="text" placeholder="e.g. Stripe Webhook, Mobile App" className="w-64" value={name} onChange={e => setName(e.target.value)} />
          </div>
          <div>
            <label className="block text-xs text-zinc-500 mb-1">Permissions</label>
            <BrandSelect value={permissions} onChange={e => setPermissions(e.target.value)}>
              <option value="read">Read Only</option>
              <option value="write">Read & Write</option>
              <option value="admin">Full Access</option>
            </BrandSelect>
          </div>
          <div>
            <label className="block text-xs text-zinc-500 mb-1">Expiry</label>
            <BrandSelect value={expiry} onChange={e => setExpiry(e.target.value)}>
              <option value="never">Never</option>
              <option value="30d">30 Days</option>
              <option value="90d">90 Days</option>
              <option value="1y">1 Year</option>
            </BrandSelect>
          </div>
          <BrandButton onClick={handleGenerate} disabled={generating}>{generating ? 'Generating...' : 'Generate'}</BrandButton>
        </div>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-lg">{error}</div>}

      <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-100 bg-zinc-50">
              {['Name', 'Permissions', 'Created', 'Expires', 'Last Used', ''].map(h => (
                <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="px-5 py-10 text-center text-sm text-zinc-400">Loading...</td></tr>
            ) : keys.length === 0 ? (
              <tr><td colSpan={6} className="px-5 py-16 text-center">
                <div className="flex flex-col items-center gap-2">
                  <div className="w-10 h-10 rounded-full bg-zinc-100 flex items-center justify-center text-lg" style={{ color: '#0062ff' }}>◇</div>
                  <p className="text-sm font-medium text-zinc-500">No API keys yet</p>
                  <p className="text-xs text-zinc-400">Generate your first key to enable external integrations.</p>
                </div>
              </td></tr>
            ) : keys.map(k => (
              <tr key={k.id} className="border-b border-zinc-50 hover:bg-zinc-50 transition-colors">
                <td className="px-5 py-3 font-medium text-zinc-900">{k.name}</td>
                <td className="px-5 py-3"><span className="text-xs px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-600 font-medium">{k.permissions}</span></td>
                <td className="px-5 py-3 text-zinc-400 text-xs">{new Date(k.created_at).toLocaleDateString()}</td>
                <td className="px-5 py-3 text-zinc-400 text-xs">{k.expires_at ? new Date(k.expires_at).toLocaleDateString() : 'Never'}</td>
                <td className="px-5 py-3 text-zinc-400 text-xs">{k.last_used_at ? new Date(k.last_used_at).toLocaleDateString() : 'Never'}</td>
                <td className="px-5 py-3">
                  <button onClick={() => handleDelete(k.id)} className="text-xs text-red-400 hover:text-red-600 transition-colors">Revoke</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
