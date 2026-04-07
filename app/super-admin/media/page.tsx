'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import BrandButton from '../components/BrandButton';
import { BrandInput, BrandSelect } from '../components/BrandInput';
import Modal from '../components/Modal';
import { useToast } from '../components/ToastProvider';
import { apiRequest } from '@/lib/api';

interface MediaRow {
  id: string;
  name: string;
  file_url?: string;
  mime_type?: string;
  size_bytes?: number;
  created_at: string;
}

interface MediaResponse {
  success: boolean;
  data?: MediaRow[];
  error?: string;
  meta?: { page: number; limit: number; total: number };
}

export default function MediaLibraryPage() {
  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [rows, setRows] = useState<MediaRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [type, setType] = useState('');
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const limit = 20;

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(limit) });
      if (search) params.set('search', search);
      if (type) params.set('type', type);
      const res = await apiRequest(`/api/media?${params.toString()}`);
      const data = await res.json() as MediaResponse;
      if (!res.ok || !data.success) throw new Error(data.error ?? 'Failed to load media');
      setRows(data.data ?? []);
      setTotal(data.meta?.total ?? 0);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load media');
    } finally {
      setLoading(false);
    }
  }, [page, search, type]);

  useEffect(() => {
    load();
  }, [load]);

  const onPickFile = async (file: File | null) => {
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await apiRequest('/api/media', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json() as { success: boolean; error?: string };
      if (!res.ok || !data.success) throw new Error(data.error ?? 'Failed to upload file');
      await load();
      showToast('File uploaded', 'success');
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : 'Failed to upload file', 'error');
    } finally {
      setUploading(false);
    }
  };

  const deleteFile = async (id: string) => {
    try {
      const res = await apiRequest(`/api/media?id=${id}`, {
        method: 'DELETE',
      });
      if (!res.ok && res.status !== 204) {
        const data = await res.json().catch(() => ({ error: 'Failed to delete file' }));
        throw new Error(data.error ?? 'Failed to delete file');
      }
      setDeleteId(null);
      await load();
      showToast('File deleted', 'success');
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : 'Failed to delete file', 'error');
    }
  };

  const visibleRows = useMemo(() => rows, [rows]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-black">Media Library</h1>
          <p className="text-sm text-zinc-400 mt-0.5">All uploaded images, documents, and assets across the platform.</p>
        </div>
        <BrandButton onClick={() => fileInputRef.current?.click()} disabled={uploading}>
          {uploading ? 'Uploading...' : 'Upload File'}
        </BrandButton>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0] ?? null;
          onPickFile(file);
          e.currentTarget.value = '';
        }}
      />

      <div className="flex items-center gap-3 flex-wrap">
        <BrandInput
          type="text"
          placeholder="Search files..."
          className="w-64"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
        />
        <BrandSelect value={type} onChange={(e) => { setType(e.target.value); setPage(1); }}>
          <option value="">All Types</option>
          <option value="image">Images</option>
          <option value="document">Documents</option>
          <option value="video">Videos</option>
        </BrandSelect>
        <BrandSelect value={view} onChange={(e) => setView(e.target.value as 'grid' | 'list')}>
          <option value="grid">Grid View</option>
          <option value="list">List View</option>
        </BrandSelect>
      </div>

      <div
        className="border-2 border-dashed border-zinc-200 rounded-xl p-10 text-center hover:border-zinc-400 transition-colors cursor-pointer bg-white"
        onClick={() => fileInputRef.current?.click()}
      >
        <div className="w-10 h-10 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-400 text-lg mx-auto mb-3">▣</div>
        <p className="text-sm font-medium text-zinc-600">Drag and drop files here</p>
        <p className="text-xs text-zinc-400 mt-1">Click to browse — PNG, JPG, PDF, MP4 up to your Supabase bucket limits</p>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-lg">{error}</div>}

      <div className="bg-white border border-zinc-200 rounded-xl p-5">
        {loading ? (
          <div className="py-12 text-center text-sm text-zinc-400">Loading media...</div>
        ) : visibleRows.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 gap-2">
            <p className="text-sm font-medium text-zinc-500">No files uploaded yet</p>
            <p className="text-xs text-zinc-400">Uploaded media will appear here in a grid or list view.</p>
          </div>
        ) : view === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
            {visibleRows.map((row) => (
              <div key={row.id} className="border border-zinc-200 rounded-lg p-3">
                <p className="text-xs font-medium text-zinc-700 truncate" title={row.name}>{row.name}</p>
                <p className="text-[11px] text-zinc-400 mt-1">{row.mime_type ?? 'unknown'}</p>
                <p className="text-[11px] text-zinc-400">{row.size_bytes ? `${Math.ceil(row.size_bytes / 1024)} KB` : '—'}</p>
                <div className="mt-3 flex items-center justify-between">
                  <a href={row.file_url} target="_blank" rel="noreferrer" className="text-xs text-blue-600 hover:text-blue-700">Open</a>
                  <button onClick={() => setDeleteId(row.id)} className="text-xs text-red-500 hover:text-red-700">Delete</button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="divide-y divide-zinc-100">
            {visibleRows.map((row) => (
              <div key={row.id} className="py-3 flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm text-zinc-700">{row.name}</p>
                  <p className="text-xs text-zinc-400">{row.mime_type ?? 'unknown'} • {new Date(row.created_at).toLocaleDateString()}</p>
                </div>
                <div className="flex items-center gap-3">
                  <a href={row.file_url} target="_blank" rel="noreferrer" className="text-xs text-blue-600 hover:text-blue-700">Open</a>
                  <button onClick={() => setDeleteId(row.id)} className="text-xs text-red-500 hover:text-red-700">Delete</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between text-sm text-zinc-400">
        <span>Showing {visibleRows.length} of {total} results</span>
        <div className="flex gap-2">
          <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1.5 border border-zinc-200 rounded-lg disabled:opacity-40">Previous</button>
          <button onClick={() => setPage((p) => p + 1)} disabled={page * limit >= total} className="px-3 py-1.5 border border-zinc-200 rounded-lg disabled:opacity-40">Next</button>
        </div>
      </div>

      <Modal
        open={Boolean(deleteId)}
        title="Delete file?"
        confirmLabel="Delete"
        danger
        onConfirm={() => {
          if (!deleteId) return;
          deleteFile(deleteId);
        }}
        onCancel={() => setDeleteId(null)}
      >
        <p className="text-sm text-zinc-500">This action cannot be undone.</p>
      </Modal>
    </div>
  );
}
