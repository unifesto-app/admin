/**
 * Infrastructure Health API Client
 * 
 * Handles requests to the /admin/health endpoint
 */

import backendClient from './backend-client';

export interface ServiceStatus {
  status: 'connected' | 'disconnected';
  latency: number;
  message: string;
}

export interface AppStatus {
  status: 'online';
  uptime: number;
  memoryMB: number;
}

export interface HealthResponse {
  status: 'healthy' | 'degraded' | 'down';
  timestamp: string;
  services: {
    database: ServiceStatus;
    redis: ServiceStatus;
    storage: ServiceStatus;
    app: AppStatus;
  };
}

/**
 * Get infrastructure health status
 */
export async function getHealthStatus(): Promise<HealthResponse> {
  const response = await backendClient.get<HealthResponse>('/admin/health');
  return response.data;
}
