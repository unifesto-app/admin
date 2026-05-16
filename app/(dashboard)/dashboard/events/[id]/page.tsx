'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { brandGradient } from '@/lib/styles';
import {
  Calendar,
  MapPin,
  Users,
  Clock,
  DollarSign,
  Globe,
  ArrowLeft,
  Edit,
  Trash2,
  TrendingUp,
  Star,
  Building2,
  Mail,
  Phone,
  ExternalLink,
} from 'lucide-react';
import Link from 'next/link';

interface Event {
  id: string;
  title: string;
  slug: string;
  description?: string;
  short_description?: string;
  start_date: string;
  end_date: string;
  status: 'draft' | 'published' | 'cancelled' | 'completed';
  is_trending: boolean;
  is_featured: boolean;
  event_type: 'online' | 'offline' | 'hybrid';
  city?: string;
  venue?: string;
  is_free: boolean;
  price?: number;
  max_attendees?: number;
  current_attendees?: number;
  organization?: {
    id: string;
    name: string;
    logo_url?: string;
  };
  created_at: string;
  updated_at: string;
}

export default function EventDetailPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = params.id as string;

  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchEvent();
  }, [eventId]);

  const fetchEvent = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/events/${eventId}`);
      const data = await response.json();

      if (response.ok) {
        setEvent(data.event);
        setError(null);
      } else {
        console.error('Error fetching event:', data.error);
        setError(data.error || 'Failed to load event');
        if (response.status === 404) {
          setTimeout(() => {
            router.push('/dashboard/events');
          }, 2000);
        }
      }
    } catch (error) {
      console.error('Error fetching event:', error);
      setError('Failed to load event');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'draft':
        return 'bg-gray-100 text-gray-800 border-gray-300';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'completed':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Header Skeleton */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Skeleton className="h-9 w-20 rounded-full" />
            <Skeleton className="h-9 w-96" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-9 w-24 rounded-full" />
            <Skeleton className="h-9 w-24 rounded-full" />
          </div>
        </div>

        {/* Badges Skeleton */}
        <div className="flex items-center gap-2">
          <Skeleton className="h-7 w-24 rounded-full" />
          <Skeleton className="h-7 w-24 rounded-full" />
          <Skeleton className="h-7 w-20 rounded-full" />
        </div>

        {/* Main Content Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Event Details */}
          <Card className="lg:col-span-2 p-6 space-y-6">
            <div>
              <Skeleton className="h-6 w-32 mb-4" />
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-3/4" />
            </div>

            <div className="space-y-4 pt-6 border-t">
              <Skeleton className="h-6 w-40 mb-4" />
              <div className="flex items-center gap-3">
                <Skeleton className="w-5 h-5 rounded" />
                <Skeleton className="h-4 w-64" />
              </div>
              <div className="flex items-center gap-3">
                <Skeleton className="w-5 h-5 rounded" />
                <Skeleton className="h-4 w-48" />
              </div>
              <div className="flex items-center gap-3">
                <Skeleton className="w-5 h-5 rounded" />
                <Skeleton className="h-4 w-56" />
              </div>
              <div className="flex items-center gap-3">
                <Skeleton className="w-5 h-5 rounded" />
                <Skeleton className="h-4 w-40" />
              </div>
            </div>
          </Card>

          {/* Sidebar Skeleton */}
          <div className="space-y-4">
            <Card className="p-6">
              <Skeleton className="h-6 w-32 mb-4" />
              <div className="flex items-center gap-3 mb-4">
                <Skeleton className="w-12 h-12 rounded-full" />
                <div className="flex-1">
                  <Skeleton className="h-5 w-32 mb-2" />
                  <Skeleton className="h-4 w-24" />
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <Skeleton className="h-6 w-24 mb-4" />
              <Skeleton className="h-10 w-20 mb-2" />
              <Skeleton className="h-4 w-32" />
            </Card>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-96 space-y-4">
        <div className="text-red-500 text-lg font-semibold">{error}</div>
        <p className="text-gray-600">Redirecting to events list...</p>
        <Link href="/dashboard/events">
          <Button className="rounded-full">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Go to Events
          </Button>
        </Link>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="flex flex-col items-center justify-center h-96 space-y-4">
        <div className="text-gray-500">Event not found</div>
        <Link href="/dashboard/events">
          <Button className="rounded-full">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Go to Events
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/events">
            <Button variant="outline" size="sm" className="rounded-full">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </Link>
          <h1 className="text-3xl font-bold">{event.title}</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="rounded-full">
            <Edit className="w-4 h-4 mr-2" />
            Edit
          </Button>
          <Button
            variant="outline"
            className="rounded-full text-red-600 hover:bg-red-50"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Delete
          </Button>
        </div>
      </div>

      {/* Badges */}
      <div className="flex items-center gap-2">
        <span
          className={`px-3 py-1 text-sm font-medium rounded-full border ${getStatusColor(
            event.status
          )}`}
        >
          {event.status.charAt(0).toUpperCase() + event.status.slice(1)}
        </span>
        {event.is_trending && (
          <span className="px-3 py-1 text-sm font-medium bg-orange-100 text-orange-800 rounded-full border border-orange-300">
            <TrendingUp className="w-4 h-4 inline mr-1" />
            Trending
          </span>
        )}
        {event.is_featured && (
          <span className="px-3 py-1 text-sm font-medium bg-yellow-100 text-yellow-800 rounded-full border border-yellow-300">
            <Star className="w-4 h-4 inline mr-1" />
            Featured
          </span>
        )}
        <span
          className={`px-3 py-1 text-sm font-medium rounded-full border ${
            event.is_free
              ? 'bg-green-100 text-green-800 border-green-300'
              : 'bg-purple-100 text-purple-800 border-purple-300'
          }`}
        >
          {event.is_free ? 'Free' : `₹${event.price || 0}`}
        </span>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Event Details */}
        <Card className="lg:col-span-2 p-6 space-y-6">
          <div>
            <h2 className="text-xl font-bold mb-4">Description</h2>
            <p className="text-gray-700 whitespace-pre-wrap">
              {event.description || event.short_description || 'No description available'}
            </p>
          </div>

          {/* Event Information */}
          <div className="space-y-4 pt-6 border-t">
            <h2 className="text-xl font-bold mb-4">Event Information</h2>
            
            <div className="flex items-center gap-3 text-gray-700">
              <Calendar className="w-5 h-5 text-gray-400" />
              <div>
                <div className="font-medium">Start Date</div>
                <div className="text-sm">{formatDate(event.start_date)}</div>
              </div>
            </div>

            <div className="flex items-center gap-3 text-gray-700">
              <Clock className="w-5 h-5 text-gray-400" />
              <div>
                <div className="font-medium">End Date</div>
                <div className="text-sm">{formatDate(event.end_date)}</div>
              </div>
            </div>

            {event.venue && (
              <div className="flex items-center gap-3 text-gray-700">
                <MapPin className="w-5 h-5 text-gray-400" />
                <div>
                  <div className="font-medium">Venue</div>
                  <div className="text-sm">{event.venue}</div>
                  {event.city && <div className="text-sm text-gray-500">{event.city}</div>}
                </div>
              </div>
            )}

            <div className="flex items-center gap-3 text-gray-700">
              <Globe className="w-5 h-5 text-gray-400" />
              <div>
                <div className="font-medium">Event Type</div>
                <div className="text-sm capitalize">{event.event_type}</div>
              </div>
            </div>

            {event.max_attendees && (
              <div className="flex items-center gap-3 text-gray-700">
                <Users className="w-5 h-5 text-gray-400" />
                <div>
                  <div className="font-medium">Capacity</div>
                  <div className="text-sm">
                    {event.current_attendees || 0} / {event.max_attendees} attendees
                  </div>
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Organization */}
          {event.organization && (
            <Card className="p-6">
              <h3 className="font-semibold text-lg mb-4">Organized By</h3>
              <div className="flex items-center gap-3">
                {event.organization.logo_url ? (
                  <img
                    src={event.organization.logo_url}
                    alt={event.organization.name}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                ) : (
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center"
                    style={{ background: brandGradient }}
                  >
                    <Building2 className="w-6 h-6 text-white" />
                  </div>
                )}
                <div>
                  <div className="font-medium">{event.organization.name}</div>
                  <Link
                    href={`/dashboard/organizations/${event.organization.id}`}
                    className="text-sm text-blue-600 hover:underline"
                  >
                    View Organization
                  </Link>
                </div>
              </div>
            </Card>
          )}

          {/* Stats */}
          <Card className="p-6">
            <h3 className="font-semibold text-lg mb-4">Statistics</h3>
            <div className="space-y-3">
              <div>
                <div className="text-sm text-gray-600">Current Attendees</div>
                <div className="text-2xl font-bold">{event.current_attendees || 0}</div>
              </div>
              {event.max_attendees && (
                <div>
                  <div className="text-sm text-gray-600">Capacity</div>
                  <div className="text-2xl font-bold">{event.max_attendees}</div>
                </div>
              )}
            </div>
          </Card>

          {/* Metadata */}
          <Card className="p-6">
            <h3 className="font-semibold text-lg mb-4">Metadata</h3>
            <div className="space-y-2 text-sm">
              <div>
                <span className="text-gray-600">Created:</span>{' '}
                <span className="font-medium">
                  {new Date(event.created_at).toLocaleDateString()}
                </span>
              </div>
              <div>
                <span className="text-gray-600">Updated:</span>{' '}
                <span className="font-medium">
                  {new Date(event.updated_at).toLocaleDateString()}
                </span>
              </div>
              <div>
                <span className="text-gray-600">Slug:</span>{' '}
                <span className="font-mono text-xs">{event.slug}</span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
