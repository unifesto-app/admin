'use client';

import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  DollarSign,
  RefreshCw,
  AlertCircle,
  TrendingUp,
  Calendar,
  BarChart3,
  Activity,
} from 'lucide-react';

const BASE_URL = 'https://api.unifesto.app';

export default function BillingPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('unifesto_admin_token');
      if (!token) {
        window.location.href = '/login';
        return;
      }

      const response = await axios.get(`${BASE_URL}/aws/cost`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setData(response.data);
    } catch (err: any) {
      if (err.response?.status === 401) {
        localStorage.removeItem('unifesto_admin_token');
        window.location.href = '/login';
      } else if (err.response?.status === 403) {
        setError('Admin access required');
      } else {
        setError(err.response?.data?.message || 'Failed to fetch billing data');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 300000); // Refresh every 5 minutes
    return () => clearInterval(interval);
  }, [fetchData]);

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="w-8 h-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading billing data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center gap-3">
              <AlertCircle className="w-12 h-12 text-destructive" />
              <p className="text-sm text-destructive">{error}</p>
              <Button onClick={fetchData} variant="outline">
                Retry
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const currentCost = data?.currentMonthCost || 0;
  const forecastedCost = data?.forecastedCost || 0;
  const projectedCost = data?.projectedMonthEndCost || 0;
  const serviceBreakdown = data?.serviceBreakdown || [];
  const billingPeriod = data?.billingPeriod || {};

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">AWS Billing</h1>
          <p className="text-muted-foreground mt-1">Real-time cost tracking and forecasting</p>
          {data?.error && (
            <p className="text-xs text-yellow-500 mt-1">⚠️ {data.error}</p>
          )}
        </div>
        <Button onClick={fetchData} disabled={loading} variant="outline" size="sm">
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Main Cost Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Current Month Cost */}
        <Card className="border-2 border-primary">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <DollarSign className="h-8 w-8 text-primary" />
              <Activity className="h-5 w-5 text-muted-foreground" />
            </div>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Current Month-to-Date
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold">${currentCost.toFixed(2)}</p>
            <p className="text-xs text-muted-foreground mt-1">
              As of {billingPeriod.current ? new Date(billingPeriod.current).toLocaleDateString() : 'today'}
            </p>
          </CardContent>
        </Card>

        {/* Forecasted Cost */}
        <Card>
          <CardHeader className="pb-3">
            <TrendingUp className="h-8 w-8 text-yellow-500" />
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Remaining Forecast
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold text-yellow-500">${forecastedCost.toFixed(2)}</p>
            <p className="text-xs text-muted-foreground mt-1">
              Expected until month end
            </p>
          </CardContent>
        </Card>

        {/* Projected Total */}
        <Card>
          <CardHeader className="pb-3">
            <BarChart3 className="h-8 w-8 text-blue-500" />
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Projected Month Total
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold text-blue-500">${projectedCost.toFixed(2)}</p>
            <p className="text-xs text-muted-foreground mt-1">
              Full month estimate
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Billing Period */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-purple-500" />
            Billing Period
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Period Start</p>
              <p className="text-lg font-bold">
                {billingPeriod.start ? new Date(billingPeriod.start).toLocaleDateString('en-US', {
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                }) : 'N/A'}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Current Date</p>
              <p className="text-lg font-bold">
                {billingPeriod.current ? new Date(billingPeriod.current).toLocaleDateString('en-US', {
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                }) : 'N/A'}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Period End</p>
              <p className="text-lg font-bold">
                {billingPeriod.end ? new Date(billingPeriod.end).toLocaleDateString('en-US', {
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                }) : 'N/A'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Service Cost Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Cost by Service</CardTitle>
        </CardHeader>
        <CardContent>
          {serviceBreakdown.length > 0 ? (
            <div className="space-y-4">
              {serviceBreakdown.map((service: any, idx: number) => (
                <div key={idx} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{service.service}</p>
                    </div>
                    <div className="flex items-center gap-4 ml-4">
                      <span className="text-sm text-muted-foreground whitespace-nowrap">
                        {service.percentage}%
                      </span>
                      <span className="text-lg font-bold whitespace-nowrap">
                        ${service.cost.toFixed(2)}
                      </span>
                    </div>
                  </div>
                  <div className="h-2 bg-secondary rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary transition-all"
                      style={{ width: `${service.percentage}%` }}
                    />
                  </div>
                </div>
              ))}

              {/* Total */}
              <div className="pt-4 border-t">
                <div className="flex items-center justify-between">
                  <p className="text-lg font-semibold">Total</p>
                  <p className="text-2xl font-bold">${currentCost.toFixed(2)}</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="py-12 text-center">
              <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-sm text-muted-foreground">No service breakdown available</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Cost Forecast Comparison */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-green-500" />
              Current vs Projected
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Current Spend</span>
                <span className="font-bold">${currentCost.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Projected Total</span>
                <span className="font-bold">${projectedCost.toFixed(2)}</span>
              </div>
              <div className="flex justify-between pt-2 border-t">
                <span className="font-medium">Remaining Budget</span>
                <span className="font-bold text-yellow-500">
                  ${forecastedCost.toFixed(2)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-500" />
              Spending Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-2 text-sm">
                  <span className="text-muted-foreground">Month Progress</span>
                  <span className="font-semibold">
                    {projectedCost > 0 
                      ? Math.round((currentCost / projectedCost) * 100)
                      : 0}%
                  </span>
                </div>
                <div className="h-3 bg-secondary rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500 transition-all"
                    style={{
                      width: `${projectedCost > 0 
                        ? Math.min(Math.round((currentCost / projectedCost) * 100), 100)
                        : 0}%`,
                    }}
                  />
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                You've spent {projectedCost > 0 
                  ? Math.round((currentCost / projectedCost) * 100)
                  : 0}% of your projected monthly cost
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
