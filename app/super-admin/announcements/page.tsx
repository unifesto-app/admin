'use client';
import { useEffect, useState, useCallback } from 'react';
import BrandButton from '../components/BrandButton';
import { BrandInput, BrandSelect } from '../components/BrandInput';
import Modal from '../components/Modal';
import { useToast } from '../components/ToastProvider';
import { adminApi, ApiResponse } from '@/lib/api';

interface Announcement { id: string; title: string; message: string; audience: string; severity: string; created_at: string; }

const severityColors: Record<string, string> = {
  info: 'bg-blue-50 text-blue-600',
  warning: 'bg-yellow-50 text-yellow-600',
  critical: 'bg-red-50 text-red-500',
};

export default function AnnouncementsPage() {
  const { showToast } = useToast();
  const [list, setList] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [audience, setAudience] = useState('');
  const [severity, setSeverity] = useState('info');
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const res = await adminApi.get('announcements') as ApiResponse<Announcement[]>;
      setList(res.data ?? []);
    } catch (e: unknown) { setError(e instanceof Error ? e.message : 'Failed to load'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handlePublish = async () => {
    if (!title || !message || !audience) { showToast('Title, message and audience are required', 'error'); return; }
    setSaving(true);
    try {
      await adminApi.post('announcements', { title, message, audience, severity });
      setTitle(''); setMessage(''); setAudience(''); setSeverity('info');
      load();
      showToast('Announcement published', 'success');
    } catch { showToast('Failed to publish announcement', 'error'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    try {
      await adminApi.delete(`announcements/${id}`);
      setDeleteId(null);
      load();
      showToast('Announcement deleted', 'success');
    }
    catch { showToast('Failed to delete announcement', 'error'); }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-black">Announcements</h1>
        <p className="text-sm text-zinc-400 mt-0.5">Broadcast messages to users, organizers, or the entire platform.</p>
      </div>

      <div className="bg-white border border-zinc-200 rounded-xl p-5 space-y-4">
        <h2 className="text-sm font-semibold text-black">Compose Announcement</h2>
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-zinc-500 mb-1">Title</label>
            <BrandInput type="text" placeholder="Announcement title..." className="w-full" value={title} onChange={e => setTitle(e.target.value)} />
          </div>
          <div>
            <label className="block text-xs text-zinc-500 mb-1">Audience</label>
            <BrandSelect className="w-full" value={audience} onChange={e => setAudience(e.target.value)}>
              <option value="">Select audience...</option>
              <option value="all">All Users</option>
              <option value="organizers">Organizers Only</option>
              <option value="attendees">Attendees Only</option>
              <option value="admins">Admins Only</option>
            </BrandSelect>
          </div>
        </div>
        <div>
          <label className="block text-xs text-zinc-500 mb-1">Message</label>
          <textarea rows={4} placeholder="Write your announcement here..."
            className="brand-input w-full resize-none" value={message} onChange={e => setMessage(e.target.value)} />
        </div>
        <div className="flex items-center gap-3">
          <BrandSelect value={severity} onChange={e => setSeverity(e.target.value)}>
            <option value="info">Info</option>
            <option value="warning">Warning</option>
            <option value="critical">Critical</option>
          </BrandSelect>
          <BrandButton onClick={handlePublish} disabled={saving}>{saving ? 'Publishing...' : 'Publish Now'}</BrandButton>
        </div>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-lg">{error}</div>}

      <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-zinc-100">
          <h2 className="text-sm font-semibold text-black">Published Announcements</h2>
        </div>
        {loading ? (
          <div className="px-5 py-10 text-center text-sm text-zinc-400">Loading...</div>
        ) : list.length === 0 ? (
          <div className="px-5 py-16 text-center">
            <div className="flex flex-col items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-zinc-100 flex items-center justify-center text-lg" style={{ color: '#0062ff' }}>◬</div>
              <p className="text-sm font-medium text-zinc-500">No announcements yet</p>
              <p className="text-xs text-zinc-400">Published announcements will appear here.</p>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-zinc-100">
            {list.map(a => (
              <div key={a.id} className="px-5 py-4 flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${severityColors[a.severity] ?? 'bg-zinc-100 text-zinc-500'}`}>{a.severity}</span>
                    <span className="text-xs text-zinc-400 bg-zinc-50 px-2 py-0.5 rounded-full">{a.audience}</span>
                  </div>
                  <p className="text-sm font-medium text-black">{a.title}</p>
                  <p className="text-xs text-zinc-500 mt-0.5 line-clamp-2">{a.message}</p>
                  <p className="text-xs text-zinc-400 mt-1">{new Date(a.created_at).toLocaleString()}</p>
                </div>
                <button onClick={() => setDeleteId(a.id)} className="text-xs text-red-400 hover:text-red-600 transition-colors shrink-0">Delete</button>
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal
        open={Boolean(deleteId)}
        title="Delete announcement?"
        confirmLabel="Delete"
        danger
        onConfirm={() => {
          if (!deleteId) return;
          handleDelete(deleteId);
        }}
        onCancel={() => setDeleteId(null)}
      >
        <p className="text-sm text-zinc-500">This action cannot be undone.</p>
      </Modal>
    </div>
  );
}
