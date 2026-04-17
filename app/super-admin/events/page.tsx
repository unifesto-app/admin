'use client';
import { useEffect, useState, useCallback } from 'react';
import BrandButton from '../components/BrandButton';
import { BrandInput, BrandSelect } from '../components/BrandInput';
import Modal from '../components/Modal';
import { useToast } from '../components/ToastProvider';
import { eventsApi, adminApi, ApiResponse } from '@/lib/api';

interface Event { id: string; title: string; status: string; category: string; start_date: string; created_by: string; }
interface Category { id: string; name: string; slug: string; }

const statusColors: Record<string, string> = {
  draft: 'bg-zinc-100 text-zinc-500',
  published: 'bg-blue-50 text-blue-600',
  ongoing: 'bg-green-50 text-green-600',
  completed: 'bg-zinc-100 text-zinc-400',
  cancelled: 'bg-red-50 text-red-500',
};

export default function EventsPage() {
  const { showToast } = useToast();
  const [events, setEvents] = useState<Event[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [category, setCategory] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDate, setNewDate] = useState(new Date().toISOString().slice(0, 10));
  const [saving, setSaving] = useState(false);
  const limit = 20;

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const params: Record<string, string> = { page: String(page), limit: String(limit) };
      if (search) params.search = search;
      if (status) params.status = status;
      if (category) params.category = category;
      const res = await eventsApi.list(params) as ApiResponse<Event[]>;
      setEvents(res.data ?? []);
      setTotal(res.meta?.total ?? 0);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load events');
    } finally { setLoading(false); }
  }, [page, search, status, category]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    adminApi
      .get('categories')
      .then((res) => {
        const payload = res as ApiResponse<Category[]>;
        setCategories(payload.data ?? []);
      })
      .catch(() => {
        setCategories([]);
      });
  }, []);

  const handleCreateEvent = async () => {
    if (!newTitle.trim()) {
      showToast('Event title is required', 'error');
      return;
    }

    setSaving(true);
    try {
      await eventsApi.create({ title: newTitle.trim(), start_date: newDate, status: 'draft', category: newCategory || null });
      setShowCreateModal(false);
      setNewTitle('');
      setNewDate(new Date().toISOString().slice(0, 10));
      setNewCategory('');
      await load();
      showToast('Event created', 'success');
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : 'Failed to create event', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      await eventsApi.update(id, { status: newStatus });
      await load();
      showToast('Event updated', 'success');
    } catch {
      showToast('Failed to update event', 'error');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-black">Events</h1>
          <p className="text-sm text-zinc-400 mt-0.5">Create and manage all events on the platform.</p>
        </div>
        <BrandButton onClick={() => setShowCreateModal(true)}>+ New Event</BrandButton>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <BrandInput type="text" placeholder="Search events..." className="w-64"
          value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
        <BrandSelect value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
          <option value="">All Status</option>
          <option value="draft">Draft</option>
          <option value="published">Published</option>
          <option value="ongoing">Ongoing</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </BrandSelect>
        <BrandSelect value={category} onChange={(e) => { setCategory(e.target.value); setPage(1); }}>
          <option value="">All Categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </BrandSelect>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-lg">{error}</div>}

      <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-100 bg-zinc-50">
              {['Event Name', 'Category', 'Status', 'Date', ''].map((h) => (
                <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="px-5 py-10 text-center text-sm text-zinc-400">Loading...</td></tr>
            ) : events.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-5 py-16 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-10 h-10 rounded-full bg-zinc-100 flex items-center justify-center text-lg" style={{ color: '#0062ff' }}>◷</div>
                    <p className="text-sm font-medium text-zinc-500">No events yet</p>
                    <p className="text-xs text-zinc-400">Create your first event or wait for organizers to submit one.</p>
                  </div>
                </td>
              </tr>
            ) : events.map((ev) => (
              <tr key={ev.id} className="border-b border-zinc-50 hover:bg-zinc-50 transition-colors">
                <td className="px-5 py-3 font-medium text-zinc-900">{ev.title}</td>
                <td className="px-5 py-3 text-zinc-500 text-xs">{ev.category || '—'}</td>
                <td className="px-5 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[ev.status] ?? 'bg-zinc-100 text-zinc-500'}`}>{ev.status}</span>
                </td>
                <td className="px-5 py-3 text-zinc-400 text-xs">{ev.start_date ? new Date(ev.start_date).toLocaleDateString() : '—'}</td>
                <td className="px-5 py-3 flex gap-2">
                  <button onClick={() => handleStatusChange(ev.id, ev.status === 'published' ? 'draft' : 'published')}
                    className="text-xs text-blue-500 hover:text-blue-700 transition-colors">
                    {ev.status === 'published' ? 'Unpublish' : 'Publish'}
                  </button>
                  <button onClick={() => handleStatusChange(ev.id, 'cancelled')}
                    className="text-xs text-red-400 hover:text-red-600 transition-colors">Cancel</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between text-sm text-zinc-400">
        <span>Showing {events.length} of {total} results</span>
        <div className="flex gap-2">
          <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
            className="px-3 py-1.5 border border-zinc-200 rounded-lg disabled:opacity-40">Previous</button>
          <button onClick={() => setPage((p) => p + 1)} disabled={page * limit >= total}
            className="px-3 py-1.5 border border-zinc-200 rounded-lg disabled:opacity-40">Next</button>
        </div>
      </div>

      <Modal
        open={showCreateModal}
        title="Create Event"
        confirmLabel="Create Event"
        busy={saving}
        onConfirm={handleCreateEvent}
        onCancel={() => {
          if (saving) return;
          setShowCreateModal(false);
        }}
      >
        <div className="space-y-3">
          <div>
            <label className="block text-xs text-zinc-500 mb-1">Event Title</label>
            <BrandInput type="text" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="Annual Summit 2026" />
          </div>
          <div>
            <label className="block text-xs text-zinc-500 mb-1">Start Date</label>
            <BrandInput type="date" value={newDate} onChange={(e) => setNewDate(e.target.value)} />
          </div>
          <div>
            <label className="block text-xs text-zinc-500 mb-1">Category</label>
            <BrandSelect value={newCategory} onChange={(e) => setNewCategory(e.target.value)}>
              <option value="">No category</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </BrandSelect>
          </div>
        </div>
      </Modal>
    </div>
  );
}
