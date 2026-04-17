'use client';
import { useEffect, useState, useCallback } from 'react';
import BrandButton from '../components/BrandButton';
import { BrandInput, BrandSelect } from '../components/BrandInput';
import Modal from '../components/Modal';
import { useToast } from '../components/ToastProvider';
import { adminApi, ApiResponse } from '@/lib/api';

interface Career {
  id: string;
  title: string;
  department: string;
  location: string;
  type: string;
  experience_level: string;
  description: string;
  requirements: string[];
  responsibilities: string[];
  benefits: string[];
  salary_range?: string;
  status: string;
  created_at: string;
}

const statusColors: Record<string, string> = {
  active: 'bg-green-50 text-green-600',
  closed: 'bg-zinc-100 text-zinc-500',
  draft: 'bg-yellow-50 text-yellow-600',
};

export default function CareersPage() {
  const { showToast } = useToast();
  const [careers, setCareers] = useState<Career[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editCareer, setEditCareer] = useState<Career | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const limit = 20;

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    department: '',
    location: '',
    type: 'full-time',
    experience_level: 'mid',
    description: '',
    requirements: '',
    responsibilities: '',
    benefits: '',
    salary_range: '',
    status: 'draft',
  });

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params: Record<string, string> = { page: String(page), limit: String(limit) };
      if (search) params.search = search;
      if (status) params.status = status;
      const res = await adminApi.get('careers', params) as ApiResponse<Career[]>;
      setCareers(res.data ?? []);
      setTotal(res.meta?.total ?? 0);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load careers');
    } finally {
      setLoading(false);
    }
  }, [page, search, status]);

  useEffect(() => {
    load();
  }, [load]);

  const resetForm = () => {
    setFormData({
      title: '',
      department: '',
      location: '',
      type: 'full-time',
      experience_level: 'mid',
      description: '',
      requirements: '',
      responsibilities: '',
      benefits: '',
      salary_range: '',
      status: 'draft',
    });
  };

  const handleCreate = async () => {
    if (!formData.title || !formData.department || !formData.location || !formData.description) {
      showToast('Please fill in all required fields', 'error');
      return;
    }

    setSaving(true);
    try {
      await adminApi.post('careers', {
        ...formData,
        requirements: formData.requirements ? formData.requirements.split('\n').filter(Boolean) : [],
        responsibilities: formData.responsibilities ? formData.responsibilities.split('\n').filter(Boolean) : [],
        benefits: formData.benefits ? formData.benefits.split('\n').filter(Boolean) : [],
      });
      setShowCreateModal(false);
      resetForm();
      await load();
      showToast('Career created successfully', 'success');
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : 'Failed to create career', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async () => {
    if (!editCareer) return;

    setSaving(true);
    try {
      await adminApi.patch(`careers/${editCareer.id}`, {
        ...formData,
        requirements: formData.requirements ? formData.requirements.split('\n').filter(Boolean) : [],
        responsibilities: formData.responsibilities ? formData.responsibilities.split('\n').filter(Boolean) : [],
        benefits: formData.benefits ? formData.benefits.split('\n').filter(Boolean) : [],
      });
      setEditCareer(null);
      resetForm();
      await load();
      showToast('Career updated successfully', 'success');
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : 'Failed to update career', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    setSaving(true);
    try {
      await adminApi.delete(`careers/${id}`);
      setDeleteId(null);
      await load();
      showToast('Career deleted', 'success');
    } catch {
      showToast('Failed to delete career', 'error');
    } finally {
      setSaving(false);
    }
  };

  const openEditModal = (career: Career) => {
    setEditCareer(career);
    setFormData({
      title: career.title,
      department: career.department,
      location: career.location,
      type: career.type,
      experience_level: career.experience_level,
      description: career.description,
      requirements: career.requirements.join('\n'),
      responsibilities: career.responsibilities.join('\n'),
      benefits: career.benefits.join('\n'),
      salary_range: career.salary_range || '',
      status: career.status,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-black">Careers</h1>
          <p className="text-sm text-zinc-400 mt-0.5">Manage job postings and career opportunities.</p>
        </div>
        <BrandButton onClick={() => { resetForm(); setShowCreateModal(true); }}>+ New Career</BrandButton>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <BrandInput
          type="text"
          placeholder="Search careers..."
          className="w-64"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
        />
        <BrandSelect value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="draft">Draft</option>
          <option value="closed">Closed</option>
        </BrandSelect>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-lg">{error}</div>}

      <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden">
        <table className="brand-table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Department</th>
              <th>Location</th>
              <th>Type</th>
              <th>Status</th>
              <th>Posted</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="text-center py-10 text-sm text-zinc-400">Loading...</td></tr>
            ) : careers.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-16">
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-10 h-10 rounded-full bg-zinc-100 flex items-center justify-center text-lg gradient-text">💼</div>
                    <p className="text-sm font-medium text-zinc-500">No careers yet</p>
                    <p className="text-xs text-zinc-400">Create your first job posting to get started.</p>
                  </div>
                </td>
              </tr>
            ) : careers.map((career) => (
              <tr key={career.id}>
                <td className="font-medium text-zinc-900">{career.title}</td>
                <td className="text-zinc-600">{career.department}</td>
                <td className="text-zinc-600">{career.location}</td>
                <td><span className="badge badge-neutral">{career.type}</span></td>
                <td><span className={`badge ${statusColors[career.status] || 'badge-neutral'}`}>{career.status}</span></td>
                <td className="text-zinc-400 text-xs">{new Date(career.created_at).toLocaleDateString()}</td>
                <td>
                  <div className="flex items-center gap-3">
                    <button onClick={() => openEditModal(career)} className="text-xs text-zinc-500 hover:text-zinc-700 transition-colors">Edit</button>
                    <button onClick={() => setDeleteId(career.id)} className="text-xs text-red-400 hover:text-red-600 transition-colors">Delete</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between text-sm text-zinc-400">
        <span>Showing {careers.length} of {total} results</span>
        <div className="flex gap-2">
          <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="brand-btn brand-btn-ghost px-3 py-1.5">Previous</button>
          <button onClick={() => setPage((p) => p + 1)} disabled={page * limit >= total} className="brand-btn brand-btn-ghost px-3 py-1.5">Next</button>
        </div>
      </div>

      {/* Create/Edit Modal */}
      <Modal
        open={showCreateModal || Boolean(editCareer)}
        title={editCareer ? 'Edit Career' : 'Create Career'}
        confirmLabel={editCareer ? 'Update' : 'Create'}
        busy={saving}
        onConfirm={editCareer ? handleUpdate : handleCreate}
        onCancel={() => {
          if (saving) return;
          setShowCreateModal(false);
          setEditCareer(null);
          resetForm();
        }}
      >
        <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2">
          <div>
            <label className="block text-xs text-zinc-500 mb-1">Title *</label>
            <BrandInput type="text" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} placeholder="Senior Software Engineer" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-zinc-500 mb-1">Department *</label>
              <BrandInput type="text" value={formData.department} onChange={(e) => setFormData({ ...formData, department: e.target.value })} placeholder="Engineering" />
            </div>
            <div>
              <label className="block text-xs text-zinc-500 mb-1">Location *</label>
              <BrandInput type="text" value={formData.location} onChange={(e) => setFormData({ ...formData, location: e.target.value })} placeholder="Remote / Hyderabad" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-zinc-500 mb-1">Type</label>
              <BrandSelect value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value })}>
                <option value="full-time">Full-time</option>
                <option value="part-time">Part-time</option>
                <option value="contract">Contract</option>
                <option value="internship">Internship</option>
              </BrandSelect>
            </div>
            <div>
              <label className="block text-xs text-zinc-500 mb-1">Experience Level</label>
              <BrandSelect value={formData.experience_level} onChange={(e) => setFormData({ ...formData, experience_level: e.target.value })}>
                <option value="entry">Entry</option>
                <option value="mid">Mid</option>
                <option value="senior">Senior</option>
                <option value="lead">Lead</option>
              </BrandSelect>
            </div>
          </div>
          <div>
            <label className="block text-xs text-zinc-500 mb-1">Salary Range</label>
            <BrandInput type="text" value={formData.salary_range} onChange={(e) => setFormData({ ...formData, salary_range: e.target.value })} placeholder="$80k - $120k" />
          </div>
          <div>
            <label className="block text-xs text-zinc-500 mb-1">Description *</label>
            <textarea
              className="brand-input min-h-[80px]"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Brief description of the role..."
            />
          </div>
          <div>
            <label className="block text-xs text-zinc-500 mb-1">Requirements (one per line)</label>
            <textarea
              className="brand-input min-h-[80px]"
              value={formData.requirements}
              onChange={(e) => setFormData({ ...formData, requirements: e.target.value })}
              placeholder="5+ years of experience&#10;Strong knowledge of React&#10;Excellent communication skills"
            />
          </div>
          <div>
            <label className="block text-xs text-zinc-500 mb-1">Responsibilities (one per line)</label>
            <textarea
              className="brand-input min-h-[80px]"
              value={formData.responsibilities}
              onChange={(e) => setFormData({ ...formData, responsibilities: e.target.value })}
              placeholder="Design and develop features&#10;Collaborate with team&#10;Code reviews"
            />
          </div>
          <div>
            <label className="block text-xs text-zinc-500 mb-1">Benefits (one per line)</label>
            <textarea
              className="brand-input min-h-[60px]"
              value={formData.benefits}
              onChange={(e) => setFormData({ ...formData, benefits: e.target.value })}
              placeholder="Health insurance&#10;Remote work&#10;Learning budget"
            />
          </div>
          <div>
            <label className="block text-xs text-zinc-500 mb-1">Status</label>
            <BrandSelect value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })}>
              <option value="draft">Draft</option>
              <option value="active">Active</option>
              <option value="closed">Closed</option>
            </BrandSelect>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation */}
      <Modal
        open={Boolean(deleteId)}
        title="Delete career?"
        confirmLabel="Delete"
        danger
        busy={saving}
        onConfirm={() => {
          if (!deleteId) return;
          handleDelete(deleteId);
        }}
        onCancel={() => {
          if (saving) return;
          setDeleteId(null);
        }}
      >
        <p className="text-sm text-zinc-500">This action cannot be undone.</p>
      </Modal>
    </div>
  );
}
