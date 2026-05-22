'use client';

import React from 'react';

interface BrandIconProps {
  className?: string;
}

/**
 * Crisp, official silhouette vector representation of the Apple Logo.
 */
export function AppleLogo({ className = 'w-5 h-5' }: BrandIconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.54 9.103 1.51 12.06 1.005 1.45 2.175 3.07 3.756 3.01 1.524-.062 2.098-.98 3.94-.98 1.829 0 2.355.98 3.94.94 1.62-.03 2.64-1.47 3.63-2.92 1.14-1.67 1.61-3.29 1.64-3.37-.03-.02-3.158-1.21-3.188-4.79-.03-2.98 2.445-4.41 2.565-4.48-1.41-2.06-2.92-2.3-3.53-2.36-1.605-.13-3.224 1.01-3.844 1.01-.62 0-1.92-1.01-3.26-.968zM14.622 3.5c.808-1.01 1.348-2.41 1.2-3.8-.148.06-1.544.92-2.335 1.85a4.78 4.78 0 00-1.251 3.61c1.474.12 2.87-.79 3.386-1.66z" />
    </svg>
  );
}

/**
 * Brand-accurate colored vector representation of the Google Play Store Triangle Logo.
 */
export function GooglePlayLogo({ className = 'w-5 h-5' }: BrandIconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M12.0003 12.0002L3.25391 3.25378V20.7465L12.0003 12.0002Z"
        fill="#3B82F6"
      />
      <path
        d="M16.3734 7.6272L12.0003 12.0002L3.25391 3.25378L16.3734 7.6272Z"
        fill="#EF4444"
      />
      <path
        d="M16.3734 16.3731L12.0003 12.0002L3.25391 20.7465L16.3734 16.3731Z"
        fill="#10B981"
      />
      <path
        d="M20.7465 12.0002L16.3734 7.6272V16.3731L20.7465 12.0002Z"
        fill="#F59E0B"
      />
    </svg>
  );
}

/**
 * Crisp 3D flame vector representation of the Firebase logo.
 */
export function FirebaseLogo({ className = 'w-5 h-5' }: BrandIconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M18.57 15.93L13.11 6.37L10.02 1.05C9.87.8 9.5-.12 9.13.01c-.37.13-.5.5-.5.5L6.64 5.37L2.14 13.91c-.26.5-.1.87.38.99l9.31 2.58a1.6 1.6 0 00.84 0l5.52-2.58c.48-.12.64-.49.38-.97z"
        fill="#FFA000"
      />
      <path
        d="M11.67 17.48a1.6 1.6 0 01-.84 0L1.52 14.9c-.48-.12-.64-.49-.38-.97L5.64 5.37a.46.46 0 01.88 0l3.14 12.11z"
        fill="#F57C00"
      />
      <path
        d="M18.57 15.93c.26.48.1.85-.38.97l-5.52 2.58a1.6 1.6 0 01-.84 0l-9.31-2.58c-.48-.12-.64-.49-.38-.97L6.64 5.37c.13-.26.5-.26.63 0l11.3 10.56z"
        fill="#FFCA28"
      />
    </svg>
  );
}
