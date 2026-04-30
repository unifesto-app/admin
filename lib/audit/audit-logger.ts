import { createClient } from '@/lib/supabase/server';

export interface AuditLogData {
  userId?: string;
  action: string;
  resourceType: string;
  resourceId?: string;
  details?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  status: 'success' | 'failure' | 'pending';
  errorMessage?: string;
}

/**
 * Log an audit event from the admin panel
 */
export async function logAuditEvent(data: AuditLogData): Promise<string | null> {
  try {
    const supabase = await createClient();

    const { data: result, error } = await supabase.rpc('log_audit_event', {
      p_user_id: data.userId || null,
      p_action: data.action,
      p_resource_type: data.resourceType,
      p_resource_id: data.resourceId || null,
      p_details: data.details || {},
      p_ip_address: data.ipAddress || null,
      p_user_agent: data.userAgent || null,
      p_status: data.status,
      p_error_message: data.errorMessage || null,
      p_project: 'admin',
    });

    if (error) {
      console.error('Failed to log audit event:', error);
      return null;
    }

    return result;
  } catch (error) {
    console.error('Error logging audit event:', error);
    return null;
  }
}

/**
 * Log successful action
 */
export async function logSuccess(
  action: string,
  resourceType: string,
  options?: {
    userId?: string;
    resourceId?: string;
    details?: Record<string, any>;
    ipAddress?: string;
    userAgent?: string;
  },
): Promise<string | null> {
  return logAuditEvent({
    action,
    resourceType,
    status: 'success',
    ...options,
  });
}

/**
 * Log failed action
 */
export async function logFailure(
  action: string,
  resourceType: string,
  errorMessage: string,
  options?: {
    userId?: string;
    resourceId?: string;
    details?: Record<string, any>;
    ipAddress?: string;
    userAgent?: string;
  },
): Promise<string | null> {
  return logAuditEvent({
    action,
    resourceType,
    status: 'failure',
    errorMessage,
    ...options,
  });
}

/**
 * Extract client IP from request headers
 */
export function getClientIp(headers: Headers): string {
  return (
    headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    headers.get('x-real-ip') ||
    'unknown'
  );
}

/**
 * Get user agent from request headers
 */
export function getUserAgent(headers: Headers): string {
  return headers.get('user-agent') || 'unknown';
}
