'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { brandGradient } from '@/lib/styles';
import {
  Search,
  Filter,
  Calendar,
  TrendingUp,
  Star,
  MapPin,
  Users,
  Eye,
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles,
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
  organization?: {
    id: string;
    name: string;
    logo_url?: string;
  };
}

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [filter, setFilter] = useState<'all' | 'ongoing' | 'trending' | 'featured'>('all');
  const [selectedEvents, setSelectedEvents] = useState<Set<string>>(new Set());
  
  // Search and filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    loadEvents();
  }, [page, filter]);

  const loadEvents = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
      });
      
      if (filter === 'trending') {
        params.append('is_trending', 'true');
      } else if (filter === 'featured') {
        params.append('is_featured', 'true');
      } else if (filter === 'ongoing') {
        params.append('status', 'published');
      }
      
      if (search) params.append('search', search);
      if (statusFilter) params.append('status', statusFilter);

      const response = await fetch(`/api/events?${params}`);
      if (!response.ok) throw new Error('Failed to fetch events');
      
      const data = await response.json();
      let filteredEvents = data.events || [];

      // Filter ongoing events (started but not ended)
      if (filter === 'ongoing') {
        const now = new Date();
        filteredEvents = filteredEvents.filter((event: Event) => {
          const startDate = new Date(event.start_date);
          const endDate = new Date(event.end_date);
          return startDate <= now && endDate >= now;
        });
      }

      setEvents(filteredEvents);
      setTotal(data.total || filteredEvents.length);
      setTotalPages(data.totalPages || Math.ceil(filteredEvents.length / 20));
    } catch (error) {
      console.error('Error loading events:', error);
      setEvents([]);
      setTotal(0);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setPage(1);
    loadEvents();
  };

  const markAsTrending = async () => {
    if (selectedEvents.size === 0) return;

    try {
      const response = await fetch('/api/events/trending', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event_ids: Array.from(selectedEvents) }),
      });

      if (!response.ok) throw new Error('Failed to mark events as trending');

      setSelectedEvents(new Set());
      loadEvents();
    } catch (error) {
      console.error('Error marking events as trending:', error);
      alert('Failed to mark events as trending');
    }
  };

  const removeTrending = async () => {
    if (selectedEvents.size === 0) return;

    try {
      const response = await fetch('/api/events/trending', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event_ids: Array.from(selectedEvents) }),
      });

      if (!response.ok) throw new Error('Failed to remove trending status');

      setSelectedEvents(new Set());
      loadEvents();
    } catch (error) {
      console.error('Error removing trending status:', error);
      alert('Failed to remove trending status');
    }
  };

  const markAsFeatured = async () => {
    if (selectedEvents.size === 0) return;

    try {
      const response = await fetch('/api/events/featured', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event_ids: Array.from(selectedEvents) }),
      });

      if (!response.ok) throw new Error('Failed to mark events as featured');

      setSelectedEvents(new Set());
      loadEvents();
    } catch (error) {
      console.error('Error marking events as featured:', error);
      alert('Failed to mark events as featured');
    }
  };

  const removeFeatured = async () => {
    if (selectedEvents.size === 0) return;

    try {
      const response = await fetch('/api/events/featured', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event_ids: Array.from(selectedEvents) }),
      });

      if (!response.ok) throw new Error('Failed to remove featured status');

      setSelectedEvents(new Set());
      loadEvents();
    } catch (error) {
      console.error('Error removing featured status:', error);
      alert('Failed to remove featured status');
    }
  };

  const isOngoing = (event: Event) => {
    const now = new Date();
    const startDate = new Date(event.start_date);
    const endDate = new Date(event.end_date);
    return startDate <= now && endDate >= now;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Events Management</h1>
          <p className="text-gray-600 mt-1">
            Manage trending events and event status ({total.toLocaleString()} total)
          </p>
        </div>
      </div>

      {/* Quick Filters */}
      <div className="flex gap-3">
        <Button
          onClick={() => {
            setFilter('all');
            setPage(1);
          }}
          variant={filter === 'all' ? 'default' : 'outline'}
          className="rounded-full"
        >
          <Calendar className="w-4 h-4 mr-2" />
          All Events
        </Button>
        <Button
          onClick={() => {
            setFilter('ongoing');
            setPage(1);
          }}
          variant={filter === 'ongoing' ? 'default' : 'outline'}
          className="rounded-full"
        >
          <Clock className="w-4 h-4 mr-2" />
          Ongoing Events
        </Button>
        <Button
          onClick={() => {
            setFilter('trending');
            setPage(1);
          }}
          variant={filter === 'trending' ? 'default' : 'outline'}
          className="rounded-full"
        >
          <TrendingUp className="w-4 h-4 mr-2" />
          Trending Events
        </Button>
        <Button
          onClick={() => {
            setFilter('featured');
            setPage(1);
          }}
          variant={filter === 'featured' ? 'default' : 'outline'}
          className="rounded-full"
        >
          <Star className="w-4 h-4 mr-2" />
          Featured Events
        </Button>
      </div>

      {/* Search and Filters */}
      <Card className="p-4">
        <div className="space-y-4">
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search events..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <Button onClick={handleSearch} className="rounded-full">
              Search
            </Button>
            <Button
              onClick={() => setShowFilters(!showFilters)}
              variant="outline"
              className="rounded-full"
            >
              <Filter className="w-4 h-4 mr-2" />
              Filters
            </Button>
          </div>

          {showFilters && (
            <div className="grid grid-cols-2 gap-4 pt-4 border-t">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Status</option>
                  <option value="published">Published</option>
                  <option value="draft">Draft</option>
                  <option value="cancelled">Cancelled</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Bulk Actions */}
      {selectedEvents.size > 0 && (() => {
        // Check if all selected events are trending/featured
        const selectedEventsList = events.filter(e => selectedEvents.has(e.id));
        const allTrending = selectedEventsList.every(e => e.is_trending);
        const allFeatured = selectedEventsList.every(e => e.is_featured);
        const someTrending = selectedEventsList.some(e => e.is_trending);
        const someFeatured = selectedEventsList.some(e => e.is_featured);

        return (
          <Card className="p-4 bg-blue-50 border-blue-200">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-700">
                {selectedEvents.size} event{selectedEvents.size > 1 ? 's' : ''} selected
              </span>
              <div className="flex gap-2">
                {/* Show Mark as Trending if not all are trending */}
                {!allTrending && (
                  <Button onClick={markAsTrending} size="sm" className="rounded-full">
                    <TrendingUp className="w-4 h-4 mr-2" />
                    Mark as Trending
                  </Button>
                )}
                {/* Show Remove Trending if some are trending */}
                {someTrending && (
                  <Button onClick={removeTrending} size="sm" variant="outline" className="rounded-full">
                    <XCircle className="w-4 h-4 mr-2" />
                    Remove Trending
                  </Button>
                )}
                {/* Show Mark as Featured if not all are featured */}
                {!allFeatured && (
                  <Button onClick={markAsFeatured} size="sm" className="rounded-full">
                    <Star className="w-4 h-4 mr-2" />
                    Mark as Featured
                  </Button>
                )}
                {/* Show Remove Featured if some are featured */}
                {someFeatured && (
                  <Button onClick={removeFeatured} size="sm" variant="outline" className="rounded-full">
                    <XCircle className="w-4 h-4 mr-2" />
                    Remove Featured
                  </Button>
                )}
                <Button
                  onClick={() => setSelectedEvents(new Set())}
                  size="sm"
                  variant="ghost"
                  className="rounded-full"
                >
                  Clear
                </Button>
              </div>
            </div>
          </Card>
        );
      })()}

      {/* Events Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          // Skeleton Loading
          Array.from({ length: 6 }).map((_, index) => (
            <Card key={index} className="p-6">
              {/* Header with badges */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-6 w-20 rounded-full" />
                  <Skeleton className="h-6 w-20 rounded-full" />
                </div>
                <Skeleton className="w-5 h-5 rounded" />
              </div>

              {/* Event Info */}
              <div className="mb-4">
                <Skeleton className="h-6 w-full mb-2" />
                <Skeleton className="h-6 w-3/4 mb-2" />
                <Skeleton className="h-4 w-32 mb-3" />
                <Skeleton className="h-4 w-full mb-1" />
                <Skeleton className="h-4 w-5/6" />
              </div>

              {/* Event Details */}
              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2">
                  <Skeleton className="w-4 h-4 rounded" />
                  <Skeleton className="h-4 w-32" />
                </div>
                <div className="flex items-center gap-2">
                  <Skeleton className="w-4 h-4 rounded" />
                  <Skeleton className="h-4 w-24" />
                </div>
                <div className="flex items-center gap-2">
                  <Skeleton className="h-6 w-20 rounded-full" />
                  <Skeleton className="h-6 w-16 rounded-full" />
                </div>
              </div>

              {/* Actions */}
              <div className="pt-4 border-t">
                <Skeleton className="h-9 w-full rounded-full" />
              </div>
            </Card>
          ))
        ) : events.length === 0 ? (
          <Card className="col-span-full p-12">
            <div className="text-center space-y-4">
              <div
                className="w-20 h-20 rounded-full flex items-center justify-center mx-auto"
                style={{ background: brandGradient }}
              >
                <Calendar className="w-10 h-10 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  No events found
                </h3>
                <p className="text-gray-600 mb-6 max-w-md mx-auto">
                  {search || statusFilter
                    ? 'Try adjusting your filters or search terms.'
                    : filter === 'ongoing'
                    ? 'No events are currently ongoing.'
                    : filter === 'trending'
                    ? 'No events are marked as trending yet.'
                    : filter === 'featured'
                    ? 'No events are marked as featured yet.'
                    : 'No events available.'}
                </p>
              </div>
            </div>
          </Card>
        ) : (
          events.map((event) => (
            <Card
              key={event.id}
              className={`p-6 hover:shadow-lg transition-all cursor-pointer ${
                selectedEvents.has(event.id) ? 'ring-2 ring-blue-500 bg-blue-50' : ''
              }`}
              onClick={() => {
                const newSelection = new Set(selectedEvents);
                if (newSelection.has(event.id)) {
                  newSelection.delete(event.id);
                } else {
                  newSelection.add(event.id);
                }
                setSelectedEvents(newSelection);
              }}
            >
              {/* Header with Checkbox */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    {event.is_trending && (
                      <span className="px-2 py-1 text-xs font-medium bg-orange-100 text-orange-800 rounded-full border border-orange-300">
                        <TrendingUp className="w-3 h-3 inline mr-1" />
                        Trending
                      </span>
                    )}
                    {event.is_featured && (
                      <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full border border-yellow-300">
                        <Star className="w-3 h-3 inline mr-1" />
                        Featured
                      </span>
                    )}
                    {isOngoing(event) && (
                      <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full border border-green-300">
                        <Sparkles className="w-3 h-3 inline mr-1" />
                        Ongoing
                      </span>
                    )}
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={selectedEvents.has(event.id)}
                  onChange={(e) => {
                    e.stopPropagation();
                    const newSelection = new Set(selectedEvents);
                    if (e.target.checked) {
                      newSelection.add(event.id);
                    } else {
                      newSelection.delete(event.id);
                    }
                    setSelectedEvents(newSelection);
                  }}
                  className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
              </div>

              {/* Event Info */}
              <div className="mb-4">
                <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2">
                  {event.title}
                </h3>
                {event.organization && (
                  <p className="text-xs text-gray-500 mb-2">
                    {event.organization.name}
                  </p>
                )}
                {event.short_description && (
                  <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                    {event.short_description}
                  </p>
                )}
              </div>

              {/* Event Details */}
              <div className="space-y-2 mb-4 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <span>{formatDate(event.start_date)}</span>
                </div>
                {event.city && (
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-gray-400" />
                    <span>{event.city}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2 py-1 text-xs font-medium rounded-full border ${getStatusColor(
                      event.status
                    )}`}
                  >
                    {event.status.charAt(0).toUpperCase() + event.status.slice(1)}
                  </span>
                  <span
                    className={`px-2 py-1 text-xs font-medium rounded-full border ${
                      event.is_free
                        ? 'bg-green-100 text-green-800 border-green-300'
                        : 'bg-purple-100 text-purple-800 border-purple-300'
                    }`}
                  >
                    {event.is_free ? 'Free' : `₹${event.price || 0}`}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 pt-4 border-t">
                <Link
                  href={`/dashboard/events/${event.id}`}
                  className="flex-1"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Button variant="outline" className="w-full rounded-full" size="sm">
                    <Eye className="w-4 h-4 mr-2" />
                    View Details
                  </Button>
                </Link>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Page {page} of {totalPages} ({total.toLocaleString()} total events)
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => setPage(page - 1)}
                disabled={page === 1}
                variant="outline"
                className="rounded-full"
              >
                Previous
              </Button>
              <Button
                onClick={() => setPage(page + 1)}
                disabled={page === totalPages}
                variant="outline"
                className="rounded-full"
              >
                Next
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
