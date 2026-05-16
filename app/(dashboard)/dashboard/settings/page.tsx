'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Settings, Coins, Save, RefreshCw, Wallet } from 'lucide-react';

interface SystemSetting {
  key: string;
  value: any;
  description: string | null;
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/settings');
      
      if (response.ok) {
        const data = await response.json();
        const settingsMap: Record<string, any> = {};
        
        data.settings.forEach((setting: SystemSetting) => {
          settingsMap[setting.key] = setting.value;
        });
        
        setSettings(settingsMap);
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (key: string, value: any) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    try {
      setSaving(true);

      // Save each setting
      const promises = Object.entries(settings).map(([key, value]) =>
        fetch('/api/settings', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ key, value }),
        })
      );

      const results = await Promise.all(promises);
      const allSuccessful = results.every((r) => r.ok);

      if (allSuccessful) {
        alert('Settings saved successfully!');
        setHasChanges(false);
        fetchSettings();
      } else {
        alert('Some settings failed to save. Please try again.');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
          <p className="mt-4 text-gray-600">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">System Settings</h1>
          <p className="text-gray-600 mt-1">Configure general system settings</p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={handleSave}
            disabled={!hasChanges || saving}
            className="rounded-full"
          >
            <Save className="w-4 h-4 mr-2" />
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>

      {hasChanges && (
        <Card className="p-4 bg-yellow-50 border-yellow-200">
          <div className="flex items-center text-yellow-800">
            <Settings className="w-5 h-5 mr-2" />
            <span className="font-semibold">You have unsaved changes</span>
          </div>
        </Card>
      )}

      {/* Wallet Settings Placeholder */}
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
            <Wallet className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold">General Settings</h2>
            <p className="text-sm text-gray-600">System-wide configuration options</p>
          </div>
        </div>

        <div className="text-center py-12">
          <Coins className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 mb-2">No general settings configured yet</p>
          <p className="text-sm text-gray-400">
            Feature-specific settings are available in their respective pages
          </p>
        </div>
      </Card>
    </div>
  );
}
