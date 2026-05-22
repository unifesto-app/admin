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

    const { data: result, error } = await supabase
      .from('audit_logs')
      .insert({
        actor_id: data.userId || null,
        action: data.action as any,
        resource_type: data.resourceType,
        resource_id: data.resourceId || null,
        details: data.details || {},
        actor_ip: data.ipAddress || null,
        actor_user_agent: data.userAgent || null,
        status: data.status,
        error_message: data.errorMessage || null,
        project: 'admin',
      })
      .select('id')
      .single();

    if (error) {
      console.error('Failed to log audit event:', error);
      return null;
    }

    return result?.id || null;
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
