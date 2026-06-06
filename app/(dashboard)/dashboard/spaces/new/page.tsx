'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Building2, Upload, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import ImageCropModal from '@/components/spaces/image-crop-modal';
import { getAuthHeader } from '@/lib/utils/auth';

export default function NewSpacePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  const [showLogoCropModal, setShowLogoCropModal] = useState(false);
  const [showBannerCropModal, setShowBannerCropModal] = useState(false);
  const [tempImageUrl, setTempImageUrl] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    websiteUrl: '',
    city: '',
    state: '',
    country: '',
    tags: [] as string[],
    visibility: 'PUBLIC' as 'PUBLIC' | 'PRIVATE',
    coOrganiserLimit: 5,
  });
  const [tagInput, setTagInput] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Validate required fields
      if (!formData.name || !formData.slug) {
        throw new Error('Name and slug are required');
      }

      // Remove @ from slug if present (store without @ in database)
      const slug = formData.slug.replace(/^@+/, '');

      const authHeader = getAuthHeader();
      if (!authHeader) {
        throw new Error('Authentication required');
      }
      
      // Step 1: Create the space
      const response = await fetch('/api/spaces', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: authHeader,
        },
        body: JSON.stringify({
          ...formData,
          slug,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create space');
      }

      const data = await response.json();
      const spaceId = data.id;

      // Step 2: Upload logo if provided
      if (logoFile) {
        const logoFormData = new FormData();
        logoFormData.append('file', logoFile);

        await fetch(`/api/spaces/${spaceId}/logo`, {
          method: 'POST',
          headers: {
            Authorization: authHeader,
          },
          body: logoFormData,
        });
      }

      // Step 3: Upload banner if provided
      if (bannerFile) {
        const bannerFormData = new FormData();
        bannerFormData.append('file', bannerFile);

        await fetch(`/api/spaces/${spaceId}/banner`, {
          method: 'POST',
          headers: {
            Authorization: authHeader,
          },
          body: bannerFormData,
        });
      }

      router.push(`/dashboard/spaces/${spaceId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create space');
    } finally {
      setLoading(false);
    }
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError('Please select an image file');
        return;
      }

      // Validate file size (max 10MB before compression)
      if (file.size > 10 * 1024 * 1024) {
        setError('Image must be less than 10MB');
        return;
      }

      // Create temporary URL for cropping
      const url = URL.createObjectURL(file);
      setTempImageUrl(url);
      setShowLogoCropModal(true);
      setError('');
    }
  };

  const handleBannerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError('Please select an image file');
        return;
      }

      // Validate file size (max 10MB before compression)
      if (file.size > 10 * 1024 * 1024) {
        setError('Image must be less than 10MB');
        return;
      }

      // Create temporary URL for cropping
      const url = URL.createObjectURL(file);
      setTempImageUrl(url);
      setShowBannerCropModal(true);
      setError('');
    }
  };

  const handleLogoCropComplete = (croppedFile: File) => {
    setLogoFile(croppedFile);
    
    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setLogoPreview(reader.result as string);
    };
    reader.readAsDataURL(croppedFile);
    
    // Cleanup
    if (tempImageUrl) {
      URL.revokeObjectURL(tempImageUrl);
      setTempImageUrl(null);
    }
  };

  const handleBannerCropComplete = (croppedFile: File) => {
    setBannerFile(croppedFile);
    
    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setBannerPreview(reader.result as string);
    };
    reader.readAsDataURL(croppedFile);
    
    // Cleanup
    if (tempImageUrl) {
      URL.revokeObjectURL(tempImageUrl);
      setTempImageUrl(null);
    }
  };

  const handleCropModalClose = () => {
    setShowLogoCropModal(false);
    setShowBannerCropModal(false);
    if (tempImageUrl) {
      URL.revokeObjectURL(tempImageUrl);
      setTempImageUrl(null);
    }
  };

  const removeLogo = () => {
    setLogoFile(null);
    setLogoPreview(null);
  };

  const removeBanner = () => {
    setBannerFile(null);
    setBannerPreview(null);
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData({
        ...formData,
        tags: [...formData.tags, tagInput.trim()],
      });
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter((tag) => tag !== tagToRemove),
    });
  };

  const handleSlugChange = (value: string) => {
    // Remove @ if user types it, we'll add it automatically for display
    const cleanValue = value.replace(/^@+/, '');
    // Only allow lowercase letters, numbers, and hyphens (no underscores)
    const slug = cleanValue.toLowerCase().replace(/[^a-z0-9-]/g, '');
    setFormData({ ...formData, slug });
  };

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => router.push('/dashboard/spaces')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Create New Space</h1>
          <p className="text-muted-foreground">Add a new community space to the platform</p>
        </div>
      </div>

      {error && (
        <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="grid gap-6 md:grid-cols-3">
          {/* Main Form - 2 columns */}
          <div className="space-y-6 md:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
                <CardDescription>Essential details about the space</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Space Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Tech Community"
                    className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Slug (Unique ID) <span className="text-red-500">*</span>
                  </label>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">@</span>
                    <input
                      type="text"
                      value={formData.slug}
                      onChange={(e) => handleSlugChange(e.target.value)}
                      placeholder="tech-community"
                      className="flex-1 px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring font-mono"
                      required
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Only lowercase letters, numbers, and hyphens (@ is added automatically)
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Describe what this space is about..."
                    rows={4}
                    className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Website URL</label>
                  <input
                    type="url"
                    value={formData.websiteUrl}
                    onChange={(e) => setFormData({ ...formData, websiteUrl: e.target.value })}
                    placeholder="https://example.com"
                    className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Location</CardTitle>
                <CardDescription>Where is this space based?</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium mb-2">City</label>
                    <input
                      type="text"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      placeholder="e.g., Mumbai"
                      className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">State/Region</label>
                    <input
                      type="text"
                      value={formData.state}
                      onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                      placeholder="e.g., Maharashtra"
                      className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Country</label>
                  <input
                    type="text"
                    value={formData.country}
                    onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                    placeholder="e.g., India"
                    className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Tags</CardTitle>
                <CardDescription>Add relevant tags to help users find this space</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddTag();
                      }
                    }}
                    placeholder="Enter a tag and press Enter"
                    className="flex-1 px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                  <Button type="button" onClick={handleAddTag}>
                    Add Tag
                  </Button>
                </div>
                {formData.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {formData.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center gap-1 px-3 py-1 rounded-md text-sm bg-secondary"
                      >
                        {tag}
                        <button
                          type="button"
                          onClick={() => handleRemoveTag(tag)}
                          className="text-muted-foreground hover:text-foreground"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Settings - 1 column */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Settings</CardTitle>
                <CardDescription>Configure space settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Visibility</label>
                  <select
                    value={formData.visibility}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        visibility: e.target.value as 'PUBLIC' | 'PRIVATE',
                      })
                    }
                    className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="PUBLIC">Public</option>
                    <option value="PRIVATE">Private</option>
                  </select>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formData.visibility === 'PUBLIC'
                      ? 'Anyone can see this space'
                      : 'Only members can see this space'}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Co-Organiser Limit</label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={formData.coOrganiserLimit}
                    onChange={(e) =>
                      setFormData({ ...formData, coOrganiserLimit: parseInt(e.target.value) })
                    }
                    className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Maximum number of co-organisers allowed
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Images</CardTitle>
                <CardDescription>Upload logo (512x512) and banner (4:3 ratio)</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Logo (512x512)</label>
                  {logoPreview ? (
                    <div className="relative">
                      <img
                        src={logoPreview}
                        alt="Logo preview"
                        className="w-32 h-32 object-cover rounded-lg border"
                      />
                      <button
                        type="button"
                        onClick={removeLogo}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <label className="border-2 border-dashed border-input rounded-lg p-6 text-center cursor-pointer hover:border-primary transition-colors block">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleLogoChange}
                        className="hidden"
                      />
                      <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">
                        Click to upload logo
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        PNG, JPG up to 5MB
                      </p>
                    </label>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Banner (4:3 ratio)</label>
                  {bannerPreview ? (
                    <div className="relative">
                      <img
                        src={bannerPreview}
                        alt="Banner preview"
                        className="w-full h-48 object-cover rounded-lg border"
                      />
                      <button
                        type="button"
                        onClick={removeBanner}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <label className="border-2 border-dashed border-input rounded-lg p-6 text-center cursor-pointer hover:border-primary transition-colors block">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleBannerChange}
                        className="hidden"
                      />
                      <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">
                        Click to upload banner
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        PNG, JPG up to 10MB
                      </p>
                    </label>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 mt-6">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push('/dashboard/spaces')}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? 'Creating...' : 'Create Space'}
          </Button>
        </div>
      </form>

      {/* Image Crop Modals */}
      {showLogoCropModal && tempImageUrl && (
        <ImageCropModal
          isOpen={showLogoCropModal}
          imageUrl={tempImageUrl}
          aspectRatio={1}
          onCropComplete={handleLogoCropComplete}
          onClose={handleCropModalClose}
          title="Crop Logo"
        />
      )}

      {showBannerCropModal && tempImageUrl && (
        <ImageCropModal
          isOpen={showBannerCropModal}
          imageUrl={tempImageUrl}
          aspectRatio={4 / 3}
          onCropComplete={handleBannerCropComplete}
          onClose={handleCropModalClose}
          title="Crop Banner"
        />
      )}
    </div>
  );
}
