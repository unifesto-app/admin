'use client';
import { useEffect, useState, useCallback } from 'react';
import BrandButton from '../components/BrandButton';
import { BrandInput } from '../components/BrandInput';
import Modal from '../components/Modal';
import { useToast } from '../components/ToastProvider';
import { adminApi, ApiResponse } from '@/lib/api';

interface Role {
  id: string;
  name: string;
  description: string;
  permissions: string[];
  is_system: boolean;
}

export default function RolesPage() {
  const { showToast } = useToast();
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing] = useState<Role | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Role | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [permissions, setPermissions] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminApi.get('roles') as ApiResponse<Role[]>;
      setRoles(res.data ?? []);
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : 'Failed to load roles', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    load();
  }, [load]);

  const resetForm = () => {
    setName('');
    setDescription('');
    setPermissions('');
  };

  const parsePermissions = () => permissions
    .split(',')
    .map((p) => p.trim())
    .filter(Boolean);

  const handleNewRole = async () => {
    if (!name.trim()) {
      showToast('Role name is required', 'error');
      return;
    }
    setSaving(true);
    try {
      await adminApi.create('roles', {
        name: name.trim(),
        description: description.trim(),
        permissions: parsePermissions(),
      });
      setShowCreate(false);
      resetForm();
      await load();
      showToast('Role created', 'success');
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : 'Failed to create role', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleEditRole = async () => {
    if (!editing) return;
    if (!name.trim()) {
      showToast('Role name is required', 'error');
      return;
    }

    setSaving(true);
    try {
      await adminApi.update('roles', {
        name: name.trim(),
        description: description.trim(),
        permissions: parsePermissions(),
      }, editing.id);
      setEditing(null);
      resetForm();
      await load();
      showToast('Role updated', 'success');
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : 'Failed to update role', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteRole = async () => {
    if (!deleteTarget) return;
    setSaving(true);
    try {
      await adminApi.delete('roles', deleteTarget.id);
      setDeleteTarget(null);
      await load();
      showToast('Role deleted', 'success');
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : 'Failed to delete role', 'error');
    } finally {
      setSaving(false);
    }
  };

  const openEdit = (role: Role) => {
    setEditing(role);
    setName(role.name);
    setDescription(role.description ?? '');
    setPermissions((role.permissions ?? []).join(', '));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-black">Roles & Permissions</h1>
          <p className="text-sm text-zinc-400 mt-0.5">Define what each role can access and do across the platform.</p>
        </div>
        <BrandButton onClick={() => setShowCreate(true)}>+ New Role</BrandButton>
      </div>

      <div className="space-y-4">
        {loading && (
          <div className="bg-white border border-zinc-200 rounded-xl p-5 text-sm text-zinc-400">Loading roles...</div>
        )}
        {roles.map((role) => (
          <div key={role.id} className="bg-white border border-zinc-200 rounded-xl p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h2 className="text-sm font-semibold text-black">{role.name}</h2>
                  {role.is_system && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-medium text-white" style={{ backgroundColor: '#0062ff' }}>System</span>
                  )}
                </div>
                <p className="text-xs text-zinc-500 mb-3">{role.description}</p>
                <div className="flex flex-wrap gap-1.5">
                  {role.permissions.map((p) => (
                    <span key={p} className="text-[11px] border text-zinc-600 px-2 py-0.5 rounded-md" style={{ borderColor: '#0062ff22', backgroundColor: '#0062ff08', color: '#0062ff' }}>
                      {p}
                    </span>
                  ))}
                </div>
              </div>
              {!role.is_system && (
                <div className="flex gap-2 shrink-0">
                  <button onClick={() => openEdit(role)} className="text-xs px-3 py-1.5 border border-zinc-200 rounded-lg transition-colors text-zinc-600 brand-btn-outline">
                    Edit
                  </button>
                  <button onClick={() => setDeleteTarget(role)} className="text-xs px-3 py-1.5 border border-red-100 rounded-lg hover:border-red-400 transition-colors text-red-400 hover:text-red-600">
                    Delete
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="bg-zinc-50 border border-dashed border-zinc-200 rounded-xl p-5 text-center">
        <p className="text-sm font-medium text-zinc-500">Permission Matrix</p>
        <p className="text-xs text-zinc-400 mt-1">A granular permission matrix will render here once roles are connected to your backend.</p>
      </div>

      <Modal
        open={showCreate}
        title="Create Role"
        confirmLabel="Create Role"
        busy={saving}
        onConfirm={handleNewRole}
        onCancel={() => {
          if (saving) return;
          setShowCreate(false);
          resetForm();
        }}
      >
        <div className="space-y-3">
          <div>
            <label className="block text-xs text-zinc-500 mb-1">Name</label>
            <BrandInput type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Moderator" />
          </div>
          <div>
            <label className="block text-xs text-zinc-500 mb-1">Description</label>
            <BrandInput type="text" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What this role can do" />
          </div>
          <div>
            <label className="block text-xs text-zinc-500 mb-1">Permissions (comma-separated)</label>
            <BrandInput type="text" value={permissions} onChange={(e) => setPermissions(e.target.value)} placeholder="Create Events, Manage Users" />
          </div>
        </div>
      </Modal>

      <Modal
        open={Boolean(editing)}
        title="Edit Role"
        confirmLabel="Save Changes"
        busy={saving}
        onConfirm={handleEditRole}
        onCancel={() => {
          if (saving) return;
          setEditing(null);
          resetForm();
        }}
      >
        <div className="space-y-3">
          <div>
            <label className="block text-xs text-zinc-500 mb-1">Name</label>
            <BrandInput type="text" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <label className="block text-xs text-zinc-500 mb-1">Description</label>
            <BrandInput type="text" value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          <div>
            <label className="block text-xs text-zinc-500 mb-1">Permissions (comma-separated)</label>
            <BrandInput type="text" value={permissions} onChange={(e) => setPermissions(e.target.value)} />
          </div>
        </div>
      </Modal>

      <Modal
        open={Boolean(deleteTarget)}
        title="Delete role?"
        confirmLabel="Delete"
        danger
        busy={saving}
        onConfirm={handleDeleteRole}
        onCancel={() => {
          if (saving) return;
          setDeleteTarget(null);
        }}
      >
        <p className="text-sm text-zinc-500">This action cannot be undone.</p>
      </Modal>
    </div>
  );
}
