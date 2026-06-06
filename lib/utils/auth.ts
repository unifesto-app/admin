/**
 * Get auth token from cookies
 */
export function getAuthToken(): string | null {
  if (typeof document === 'undefined') return null;
  
  const cookies = document.cookie.split(';');
  const tokenCookie = cookies.find(c => c.trim().startsWith('unifesto_admin_token='));
  
  if (!tokenCookie) return null;
  
  return tokenCookie.split('=')[1];
}

/**
 * Get authorization header
 */
export function getAuthHeader(): string | null {
  const token = getAuthToken();
  return token ? `Bearer ${token}` : null;
}
