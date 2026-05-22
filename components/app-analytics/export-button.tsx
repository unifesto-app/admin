'use client';

import { useState } from 'react';
import { Download, FileText, FileSpreadsheet } from 'lucide-react';

interface ExportButtonProps {
  data: any;
  filename: string;
  type?: 'overview' | 'revenue' | 'users' | 'reviews' | 'crashes';
}

export function ExportButton({ data, filename, type = 'overview' }: ExportButtonProps) {
  const [exporting, setExporting] = useState(false);

  const exportToCSV = () => {
    setExporting(true);
    try {
      let csvContent = '';

      switch (type) {
        case 'overview':
          csvContent = generateOverviewCSV(data);
          break;
        case 'revenue':
          csvContent = generateRevenueCSV(data);
          break;
        case 'users':
          csvContent = generateUsersCSV(data);
          break;
        case 'reviews':
          csvContent = generateReviewsCSV(data);
          break;
        case 'crashes':
          csvContent = generateCrashesCSV(data);
          break;
      }

      downloadCSV(csvContent, `${filename}.csv`);
    } catch (error) {
      console.error('Export failed:', error);
      alert('Failed to export data');
    } finally {
      setExporting(false);
    }
  };

  const exportToJSON = () => {
    setExporting(true);
    try {
      const jsonContent = JSON.stringify(data, null, 2);
      downloadJSON(jsonContent, `${filename}.json`);
    } catch (error) {
      console.error('Export failed:', error);
      alert('Failed to export data');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="flex gap-2">
      <button
        onClick={exportToCSV}
        disabled={exporting}
        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        <FileSpreadsheet className="w-4 h-4" />
        <span>Export CSV</span>
      </button>
      <button
        onClick={exportToJSON}
        disabled={exporting}
        className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        <FileText className="w-4 h-4" />
        <span>Export JSON</span>
      </button>
    </div>
  );
}

// CSV Generation Functions

function generateOverviewCSV(data: any): string {
  const headers = ['Metric', 'Total', 'iOS', 'Android'];
  const rows = [
    ['Downloads', data.metrics.totalDownloads, data.byPlatform.ios.downloads, data.byPlatform.android.downloads],
    ['Installs', data.metrics.totalInstalls, data.byPlatform.ios.installs, data.byPlatform.android.installs],
    ['Active Users', data.metrics.totalActiveUsers, data.byPlatform.ios.activeUsers, data.byPlatform.android.activeUsers],
    ['Revenue', data.metrics.totalRevenue, data.byPlatform.ios.revenue, data.byPlatform.android.revenue],
    ['Sessions', data.metrics.totalSessions, data.byPlatform.ios.sessions, data.byPlatform.android.sessions],
    ['Crash-Free %', data.metrics.avgCrashFreePercentage, data.byPlatform.ios.crashFreePercentage, data.byPlatform.android.crashFreePercentage],
  ];

  return [headers, ...rows].map(row => row.join(',')).join('\n');
}

function generateRevenueCSV(data: any): string {
  const headers = ['Date', 'iOS Revenue', 'Android Revenue', 'Total Revenue'];
  const rows = data.chartData.map((item: any) => [
    item.date,
    item.ios,
    item.android,
    item.total,
  ]);

  return [headers, ...rows].map(row => row.join(',')).join('\n');
}

function generateUsersCSV(data: any): string {
  const headers = ['Date', 'Active Users', 'New Users', 'DAU'];
  const rows = data.chartData.map((item: any) => [
    item.date,
    item.activeUsers,
    item.newUsers,
    item.dau,
  ]);

  return [headers, ...rows].map(row => row.join(',')).join('\n');
}

function generateReviewsCSV(data: any): string {
  const headers = ['Date', 'Platform', 'Rating', 'Title', 'Review', 'Reviewer', 'Version'];
  const rows = data.reviews.map((review: any) => [
    review.review_date,
    review.platform,
    review.rating,
    escapeCSV(review.title || ''),
    escapeCSV(review.review_text || ''),
    review.reviewer_name || 'Anonymous',
    review.app_version || '',
  ]);

  return [headers, ...rows].map(row => row.join(',')).join('\n');
}

function generateCrashesCSV(data: any): string {
  const headers = ['Date', 'Platform', 'Type', 'Version', 'Error', 'Occurrences', 'Affected Users'];
  const rows = data.topCrashes.map((crash: any) => [
    crash.crash_date,
    crash.platform,
    crash.crash_type,
    crash.app_version,
    escapeCSV(crash.error_message || ''),
    crash.occurrence_count,
    crash.affected_users,
  ]);

  return [headers, ...rows].map(row => row.join(',')).join('\n');
}

// Helper Functions

function escapeCSV(str: string): string {
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function downloadCSV(content: string, filename: string): void {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function downloadJSON(content: string, filename: string): void {
  const blob = new Blob([content], { type: 'application/json' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
