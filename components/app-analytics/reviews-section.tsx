'use client';

import { useState, useEffect } from 'react';
import { appAnalyticsApi } from '@/lib/api/app-analytics-api';
import { Star, ThumbsUp, MessageSquare, ChevronLeft, ChevronRight } from 'lucide-react';
import { AppleLogo, GooglePlayLogo } from './brand-icons';

interface ReviewsSectionProps {
  dateRange: { startDate: string; endDate: string };
  platform: 'ios' | 'android' | 'all';
}

export function ReviewsSection({ dateRange, platform }: ReviewsSectionProps) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [ratingFilter, setRatingFilter] = useState<number | undefined>(undefined);

  useEffect(() => {
    loadData();
  }, [dateRange, platform, page, ratingFilter]);

  const loadData = async () => {
    try {
      setLoading(true);
      const result = await appAnalyticsApi.getReviews({
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
        platform,
        page,
        pageSize: 10,
        rating: ratingFilter,
      });
      setData(result);
    } catch (error) {
      console.error('Failed to load reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading && !data) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <div className="h-6 bg-slate-200 rounded w-1/4 mb-4 animate-pulse"></div>
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-24 bg-slate-100 rounded-xl animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm transition-all duration-300 hover:shadow-md">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 border-b border-slate-100 pb-5">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight font-sans">App Store Feedback</h2>
          <p className="text-xs text-slate-500 mt-0.5">User ratings and written reviews from active customers</p>
        </div>
        <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-xl self-start sm:self-auto">
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-bold text-slate-800">
              {data.summary.totalReviews.toLocaleString()}
            </span>
            <span className="text-xs font-semibold text-slate-500">reviews</span>
          </div>
          <div className="h-4 w-px bg-slate-200"></div>
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-bold text-slate-800">Avg: {data.summary.averageRating.toFixed(1)}</span>
            <div className="flex items-center">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`w-3.5 h-3.5 ${
                    i < Math.round(data.summary.averageRating)
                      ? 'fill-amber-400 text-amber-400'
                      : 'text-slate-200'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Rating Distribution */}
        <div className="lg:col-span-1 p-5 bg-slate-50/50 border border-slate-200 rounded-xl flex flex-col justify-center">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3.5">Rating Distribution</h3>
          <div className="space-y-2.5">
            {[5, 4, 3, 2, 1].map((rating) => {
              const count = data.summary.ratingDistribution[rating] || 0;
              const percentage = data.summary.totalReviews > 0 ? (count / data.summary.totalReviews) * 100 : 0;
              const isSelected = ratingFilter === rating;

              return (
                <button
                  key={rating}
                  onClick={() => setRatingFilter(ratingFilter === rating ? undefined : rating)}
                  className={`w-full flex items-center gap-3 p-1.5 rounded-lg border border-transparent transition-all active:scale-98 ${
                    isSelected 
                      ? 'bg-white border-slate-200 shadow-sm' 
                      : 'hover:bg-white hover:border-slate-200/50 hover:shadow-xxs'
                  }`}
                >
                  <div className="flex items-center gap-1 w-12">
                    <span className="text-xs font-bold text-slate-700">{rating}</span>
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  </div>
                  <div className="flex-1 bg-slate-200 rounded-full h-2">
                    <div
                      className="bg-amber-400 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                  <span className="text-xs font-semibold text-slate-500 w-10 text-right font-mono">{count}</span>
                </button>
              );
            })}
          </div>
          {ratingFilter !== undefined && (
            <button
              onClick={() => setRatingFilter(undefined)}
              className="mt-4 text-xs font-bold text-blue-600 hover:text-blue-700 transition-colors text-center self-start hover:underline"
            >
              Clear filter
            </button>
          )}
        </div>

        {/* Reviews List */}
        <div className="lg:col-span-2 space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
          {data.reviews.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center p-8 text-center text-slate-400 border border-dashed border-slate-200 rounded-xl bg-slate-50/20">
              <MessageSquare className="w-8 h-8 stroke-1.5 mb-2 text-slate-300" />
              <p className="text-sm font-medium">No reviews found matching this filter</p>
            </div>
          ) : (
            data.reviews.map((review: any) => (
              <div 
                key={review.id} 
                className="border border-slate-200 rounded-xl p-4.5 bg-white hover:border-slate-300 hover:shadow-xs transition-all duration-200"
              >
                <div className="flex items-start justify-between gap-4 mb-2.5">
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <div className="flex">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-3.5 h-3.5 ${
                              i < review.rating
                                ? 'fill-amber-400 text-amber-400'
                                : 'text-slate-200'
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-sm font-bold text-slate-800">{review.reviewer_name || 'Anonymous'}</span>
                    </div>
                    {review.app_version && (
                      <span className="text-xxs text-slate-400 font-mono">v{review.app_version}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2.5">
                    <span className="text-xxs text-slate-400 font-mono">
                      {new Date(review.review_date).toLocaleDateString()}
                    </span>
                    <div className={`
                      flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-semibold
                      ${review.platform === 'ios' 
                        ? 'bg-slate-50 text-slate-800 border-slate-200' 
                        : 'bg-emerald-50 text-emerald-800 border-emerald-100'
                      }
                    `}>
                      {review.platform === 'ios' ? (
                        <AppleLogo className="w-3 h-3 text-slate-800" />
                      ) : (
                        <GooglePlayLogo className="w-3 h-3" />
                      )}
                      <span className="text-[10px] uppercase tracking-wider">{review.platform === 'ios' ? 'iOS' : 'Android'}</span>
                    </div>
                  </div>
                </div>

                {review.title && (
                  <h4 className="font-bold text-slate-900 text-sm mb-1">{review.title}</h4>
                )}

                {review.review_text && (
                  <p className="text-slate-600 text-sm leading-relaxed">{review.review_text}</p>
                )}

                {review.developer_response && (
                  <div className="mt-4 pl-4 border-l-2 border-blue-500 bg-blue-50/30 p-3 rounded-xl">
                    <div className="flex items-center justify-between gap-4 mb-1.5">
                      <div className="flex items-center gap-1.5">
                        <MessageSquare className="w-3.5 h-3.5 text-blue-600" />
                        <span className="text-xs font-bold text-blue-900">Developer Response</span>
                      </div>
                      {review.developer_response_date && (
                        <span className="text-xxs text-slate-400 font-mono">
                          {new Date(review.developer_response_date).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                    <p className="text-slate-700 text-sm leading-relaxed">{review.developer_response}</p>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Pagination */}
      {data.pagination.totalPages > 1 && (
        <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-100">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Page {data.pagination.page} of {data.pagination.totalPages}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(page - 1)}
              disabled={page === 1}
              className="p-2.5 border border-slate-200 rounded-xl text-slate-500 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 hover:text-slate-800 transition-all duration-200 active:scale-95"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setPage(page + 1)}
              disabled={page === data.pagination.totalPages}
              className="p-2.5 border border-slate-200 rounded-xl text-slate-500 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 hover:text-slate-800 transition-all duration-200 active:scale-95"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

