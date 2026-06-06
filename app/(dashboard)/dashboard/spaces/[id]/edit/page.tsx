'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Building2, Upload, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import ImageCropModal from '@/components/spaces/image-crop-modal';
import { getAuthHeader } from '@/lib/utils/auth';

interface Space {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  websiteUrl: string | null;
  logoUrl: string | null;
  bannerUrl: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  tags: string[];
  visibility: 'PUBLIC' | 'PRIVATE';
  coOrganiserLimit: number;
}

export default function EditSpacePage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
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

  useEffect(() => {
    fetchSpace();
  }, [resolvedParams.id]);

  const fetchSpace = async () => {
    try {
      setFetchLoading(true);
      const authHeader = getAuthHeader();
      if (!authHeader) {
        throw new Error('Authentication required');
      }

      const response = await fetch(`/api/spaces/${resolvedParams.id}`, {
        headers: {
          Authorization: authHeader,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch space');
      }

      const space: Space = await response.json();
      setFormData({
        name: space.name,
        slug: space.slug,
        description: space.description || '',
        websiteUrl: space.websiteUrl || '',
        city: space.city || '',
        state: space.state || '',
        country: space.country || '',
        tags: space.tags || [],
        visibility: space.visibility,
        coOrganiserLimit: space.coOrganiserLimit,
      });
      
      // Set existing images
      if (space.logoUrl) {
        setLogoPreview(space.logoUrl);
      }
      if (space.bannerUrl) {
        setBannerPreview(space.bannerUrl);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch space');
    } finally {
      setFetchLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const authHeader = getAuthHeader();
      if (!authHeader) {
        throw new Error('Authentication required');
      }
      
      // Step 1: Update space data
      const response = await fetch(`/api/spaces/${resolvedParams.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: authHeader,
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update space');
      }

      // Step 2: Upload new logo if provided
      if (logoFile) {
        console.log('Uploading logo...', logoFile.size, 'bytes');
        const logoFormData = new FormData();
        logoFormData.append('file', logoFile);

        const logoResponse = await fetch(`/api/spaces/${resolvedParams.id}/logo`, {
          method: 'POST',
          headers: {
            Authorization: authHeader,
          },
          body: logoFormData,
        });

        if (!logoResponse.ok) {
          const errorData = await logoResponse.json();
          throw new Error(`Failed to upload logo: ${errorData.message || 'Unknown error'}`);
        }

        const logoResult = await logoResponse.json();
        console.log('Logo uploaded successfully:', logoResult);
      }

      // Step 3: Upload new banner if provided
      if (bannerFile) {
        console.log('Uploading banner...', bannerFile.size, 'bytes');
        const bannerFormData = new FormData();
        bannerFormData.append('file', bannerFile);

        const bannerResponse = await fetch(`/api/spaces/${resolvedParams.id}/banner`, {
          method: 'POST',
          headers: {
            Authorization: authHeader,
          },
          body: bannerFormData,
        });

        if (!bannerResponse.ok) {
          const errorData = await bannerResponse.json();
          throw new Error(`Failed to upload banner: ${errorData.message || 'Unknown error'}`);
        }

        const bannerResult = await bannerResponse.json();
        console.log('Banner uploaded successfully:', bannerResult);
      }

      router.push(`/dashboard/spaces/${resolvedParams.id}`);
    } catch (err) {
      console.error('Error updating space:', err);
      setError(err instanceof Error ? err.message : 'Failed to update space');
    } finally {
      setLoading(false);
    }
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setError('Please select an image file');
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        setError('Image must be less than 10MB');
        return;
      }
      const url = URL.createObjectURL(file);
      setTempImageUrl(url);
      setShowLogoCropModal(true);
      setError('');
    }
  };

  const handleBannerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setError('Please select an image file');
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        setError('Image must be less than 10MB');
        return;
      }
      const url = URL.createObjectURL(file);
      setTempImageUrl(url);
      setShowBannerCropModal(true);
      setError('');
    }
  };

  const handleLogoCropComplete = (croppedFile: File) => {
    setLogoFile(croppedFile);
    const reader = new FileReader();
    reader.onloadend = () => {
      setLogoPreview(reader.result as string);
    };
    reader.readAsDataURL(croppedFile);
    if (tempImageUrl) {
      URL.revokeObjectURL(tempImageUrl);
      setTempImageUrl(null);
    }
  };

  const handleBannerCropComplete = (croppedFile: File) => {
    setBannerFile(croppedFile);
    const reader = new FileReader();
    reader.onloadend = () => {
      setBannerPreview(reader.result as string);
    };
    reader.readAsDataURL(croppedFile);
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

  if (fetchLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-muted-foreground">Loading space...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => router.push(`/dashboard/spaces/${resolvedParams.id}`)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Edit Space</h1>
          <p className="text-muted-foreground">Update space information</p>
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
                  <input
                    type="text"
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    placeholder="@tech-community"
                    className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring font-mono"
                    required
                  />
                  <p className="text-xs text-amber-600 mt-1">
                    ⚠️ Changing the slug will affect all references to this space
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
                      <label className="mt-2 text-xs text-blue-600 cursor-pointer hover:underline block">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleLogoChange}
                          className="hidden"
                        />
                        Change logo
                      </label>
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
                      <label className="mt-2 text-xs text-blue-600 cursor-pointer hover:underline block">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleBannerChange}
                          className="hidden"
                        />
                        Change banner
                      </label>
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
            onClick={() => router.push(`/dashboard/spaces/${resolvedParams.id}`)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? 'Saving...' : 'Save Changes'}
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
