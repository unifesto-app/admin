'use client';
import { useEffect, useState, useCallback } from 'react';
import BrandButton from '../components/BrandButton';
import { BrandInput } from '../components/BrandInput';
import Modal from '../components/Modal';
import { useToast } from '../components/ToastProvider';
import { adminApi, ApiResponse } from '@/lib/api';

interface Category { id: string; name: string; slug: string; description?: string; events?: { count: number }[]; }

export default function CategoriesPage() {
  const { showToast } = useToast();
  const [cats, setCats] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [desc, setDesc] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const res = await adminApi.get('categories') as ApiResponse<Category[]>;
      setCats(res.data ?? []);
    } catch (e: unknown) { setError(e instanceof Error ? e.message : 'Failed to load'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Auto-generate slug from name
  const handleNameChange = (val: string) => {
    setName(val);
    setSlug(val.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''));
  };

  const handleSave = async () => {
    if (!name || !slug) { showToast('Name and slug are required', 'error'); return; }
    setSaving(true);
    try {
      await adminApi.create('categories', { name, slug, description: desc });
      setName(''); setSlug(''); setDesc(''); load();
      showToast('Category created', 'success');
    } catch { showToast('Failed to create category', 'error'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    try {
      await adminApi.delete('categories', id);
      setDeleteId(null);
      load();
      showToast('Category deleted', 'success');
    }
    catch { showToast('Failed to delete category', 'error'); }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-black">Categories</h1>
        <p className="text-sm text-zinc-400 mt-0.5">Manage event categories used across the platform.</p>
      </div>

      <div className="bg-white border border-zinc-200 rounded-xl p-5">
        <h2 className="text-sm font-semibold text-black mb-4">New Category</h2>
        <div className="flex items-end gap-3 flex-wrap">
          <div>
            <label className="block text-xs text-zinc-500 mb-1">Category Name</label>
            <BrandInput type="text" placeholder="e.g. Conference" className="w-56" value={name} onChange={e => handleNameChange(e.target.value)} />
          </div>
          <div>
            <label className="block text-xs text-zinc-500 mb-1">Slug</label>
            <BrandInput type="text" placeholder="e.g. conference" className="w-40" value={slug} onChange={e => setSlug(e.target.value)} />
          </div>
          <div>
            <label className="block text-xs text-zinc-500 mb-1">Description (optional)</label>
            <BrandInput type="text" placeholder="Short description..." className="w-64" value={desc} onChange={e => setDesc(e.target.value)} />
          </div>
          <BrandButton onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save'}</BrandButton>
        </div>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-lg">{error}</div>}

      <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-100 bg-zinc-50">
              {['Name', 'Slug', 'Description', 'Events', ''].map(h => (
                <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="px-5 py-10 text-center text-sm text-zinc-400">Loading...</td></tr>
            ) : cats.length === 0 ? (
              <tr><td colSpan={5} className="px-5 py-16 text-center">
                <div className="flex flex-col items-center gap-2">
                  <div className="w-10 h-10 rounded-full bg-zinc-100 flex items-center justify-center text-lg" style={{ color: '#0062ff' }}>▦</div>
                  <p className="text-sm font-medium text-zinc-500">No categories yet</p>
                  <p className="text-xs text-zinc-400">Add your first category to start organizing events.</p>
                </div>
              </td></tr>
            ) : cats.map(c => (
              <tr key={c.id} className="border-b border-zinc-50 hover:bg-zinc-50 transition-colors">
                <td className="px-5 py-3 font-medium text-zinc-900">{c.name}</td>
                <td className="px-5 py-3 font-mono text-xs text-zinc-500">{c.slug}</td>
                <td className="px-5 py-3 text-zinc-500 text-xs">{c.description ?? '—'}</td>
                <td className="px-5 py-3 text-zinc-500 text-xs">{c.events?.[0]?.count ?? 0}</td>
                <td className="px-5 py-3">
                  <button onClick={() => setDeleteId(c.id)} className="text-xs text-red-400 hover:text-red-600 transition-colors">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal
        open={Boolean(deleteId)}
        title="Delete category?"
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
