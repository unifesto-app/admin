'use client';
import { useEffect, useState, useCallback } from 'react';
import BrandButton from '../components/BrandButton';
import { BrandInput, BrandSelect } from '../components/BrandInput';
import { adminApi, ApiResponse } from '../lib/api';

interface Settings {
  platform_name?: string; support_email?: string; timezone?: string; currency?: string;
  allow_registration?: boolean; require_email_verification?: boolean;
  allow_organizer_self_registration?: boolean; maintenance_mode?: boolean;
  smtp_host?: string; smtp_port?: number; smtp_user?: string;
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminApi.get('settings') as ApiResponse<Settings>;
      setSettings(res.data ?? {});
    } catch {
      // Settings may not exist yet — use defaults
      setSettings({ platform_name: 'UNIFESTO', currency: 'INR', timezone: 'Asia/Kolkata' });
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const save = async (section: string, data: Partial<Settings>) => {
    setSaving(section); setError(''); setSuccess('');
    try {
      await adminApi.update('settings', data);
      setSuccess(`${section} settings saved.`);
      setTimeout(() => setSuccess(''), 3000);
    } catch (e: unknown) { setError(e instanceof Error ? e.message : 'Failed to save'); }
    finally { setSaving(''); }
  };

  const toggle = (key: keyof Settings) => {
    setSettings(s => ({ ...s, [key]: !s[key] }));
  };

  if (loading) return <div className="text-sm text-zinc-400 py-10 text-center">Loading settings...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-black">Settings</h1>
        <p className="text-sm text-zinc-400 mt-0.5">Configure platform-wide settings and preferences.</p>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-lg">{error}</div>}
      {success && <div className="bg-green-50 border border-green-200 text-green-700 text-sm px-4 py-3 rounded-lg">{success}</div>}

      {/* General */}
      <div className="bg-white border border-zinc-200 rounded-xl p-5 space-y-4">
        <h2 className="text-sm font-semibold text-black">General</h2>
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-zinc-500 mb-1">Platform Name</label>
            <BrandInput type="text" className="w-full" value={settings.platform_name ?? ''} onChange={e => setSettings(s => ({ ...s, platform_name: e.target.value }))} />
          </div>
          <div>
            <label className="block text-xs text-zinc-500 mb-1">Support Email</label>
            <BrandInput type="email" placeholder="support@yourdomain.com" className="w-full" value={settings.support_email ?? ''} onChange={e => setSettings(s => ({ ...s, support_email: e.target.value }))} />
          </div>
          <div>
            <label className="block text-xs text-zinc-500 mb-1">Default Timezone</label>
            <BrandSelect className="w-full" value={settings.timezone ?? 'UTC'} onChange={e => setSettings(s => ({ ...s, timezone: e.target.value }))}>
              <option value="UTC">UTC</option>
              <option value="Asia/Kolkata">Asia/Kolkata</option>
              <option value="America/New_York">America/New_York</option>
              <option value="Europe/London">Europe/London</option>
            </BrandSelect>
          </div>
          <div>
            <label className="block text-xs text-zinc-500 mb-1">Default Currency</label>
            <BrandSelect className="w-full" value={settings.currency ?? 'INR'} onChange={e => setSettings(s => ({ ...s, currency: e.target.value }))}>
              <option value="INR">INR</option>
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
              <option value="GBP">GBP</option>
            </BrandSelect>
          </div>
        </div>
        <BrandButton onClick={() => save('General', { platform_name: settings.platform_name, support_email: settings.support_email, timezone: settings.timezone, currency: settings.currency })} disabled={saving === 'General'}>
          {saving === 'General' ? 'Saving...' : 'Save General Settings'}
        </BrandButton>
      </div>

      {/* Access */}
      <div className="bg-white border border-zinc-200 rounded-xl p-5 space-y-4">
        <h2 className="text-sm font-semibold text-black">Registration & Access</h2>
        <div className="space-y-3">
          {([
            { key: 'allow_registration' as keyof Settings, label: 'Allow public registration', desc: 'Anyone can sign up for an account' },
            { key: 'require_email_verification' as keyof Settings, label: 'Require email verification', desc: 'Users must verify their email before accessing the platform' },
            { key: 'allow_organizer_self_registration' as keyof Settings, label: 'Allow organizer self-registration', desc: 'Organizers can register without admin approval' },
            { key: 'maintenance_mode' as keyof Settings, label: 'Maintenance mode', desc: 'Disable public access to the platform' },
          ] as const).map(item => (
            <div key={item.key} className="flex items-center justify-between py-2 border-b border-zinc-50 last:border-0">
              <div>
                <p className="text-sm text-black font-medium">{item.label}</p>
                <p className="text-xs text-zinc-400">{item.desc}</p>
              </div>
              <button onClick={() => toggle(item.key)}
                className={`w-10 h-5 rounded-full relative transition-colors ${settings[item.key] ? 'bg-blue-600' : 'bg-zinc-200'}`}
                style={{ backgroundColor: settings[item.key] ? '#0062ff' : undefined }}>
                <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${settings[item.key] ? 'translate-x-5' : 'translate-x-0.5'}`} />
              </button>
            </div>
          ))}
        </div>
        <BrandButton onClick={() => save('Access', { allow_registration: settings.allow_registration, require_email_verification: settings.require_email_verification, maintenance_mode: settings.maintenance_mode })} disabled={saving === 'Access'}>
          {saving === 'Access' ? 'Saving...' : 'Save Access Settings'}
        </BrandButton>
      </div>

      {/* Email */}
      <div className="bg-white border border-zinc-200 rounded-xl p-5 space-y-4">
        <h2 className="text-sm font-semibold text-black">Email & Notifications</h2>
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-zinc-500 mb-1">SMTP Host</label>
            <BrandInput type="text" placeholder="smtp.yourdomain.com" className="w-full" value={settings.smtp_host ?? ''} onChange={e => setSettings(s => ({ ...s, smtp_host: e.target.value }))} />
          </div>
          <div>
            <label className="block text-xs text-zinc-500 mb-1">SMTP Port</label>
            <BrandInput type="number" placeholder="587" className="w-full" value={settings.smtp_port ?? ''} onChange={e => setSettings(s => ({ ...s, smtp_port: Number(e.target.value) }))} />
          </div>
          <div>
            <label className="block text-xs text-zinc-500 mb-1">SMTP Username</label>
            <BrandInput type="text" placeholder="noreply@yourdomain.com" className="w-full" value={settings.smtp_user ?? ''} onChange={e => setSettings(s => ({ ...s, smtp_user: e.target.value }))} />
          </div>
          <div>
            <label className="block text-xs text-zinc-500 mb-1">SMTP Password</label>
            <BrandInput type="password" placeholder="••••••••" className="w-full" />
          </div>
        </div>
        <BrandButton onClick={() => save('Email', { smtp_host: settings.smtp_host, smtp_port: settings.smtp_port, smtp_user: settings.smtp_user })} disabled={saving === 'Email'}>
          {saving === 'Email' ? 'Saving...' : 'Save Email Settings'}
        </BrandButton>
      </div>

      {/* Danger */}
      <div className="bg-white border border-red-100 rounded-xl p-5 space-y-3">
        <h2 className="text-sm font-semibold text-red-600">Danger Zone</h2>
        <div className="flex items-center justify-between py-2 border-b border-zinc-50">
          <div>
            <p className="text-sm text-black font-medium">Clear all cached data</p>
            <p className="text-xs text-zinc-400">Flushes the application cache. This may temporarily slow down the platform.</p>
          </div>
          <button className="px-3 py-1.5 border border-zinc-200 text-sm rounded-lg hover:border-red-400 hover:text-red-500 transition-colors text-zinc-600">Clear Cache</button>
        </div>
        <div className="flex items-center justify-between py-2">
          <div>
            <p className="text-sm text-black font-medium">Reset platform settings</p>
            <p className="text-xs text-zinc-400">Resets all settings to factory defaults. This cannot be undone.</p>
          </div>
          <button className="px-3 py-1.5 border border-red-200 text-sm rounded-lg hover:bg-red-50 transition-colors text-red-500">Reset Settings</button>
        </div>
      </div>
    </div>
  );
}
