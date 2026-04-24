'use client';

interface ComingSoonProps {
  feature: string;
  description?: string;
}

export default function ComingSoon({ feature, description }: ComingSoonProps) {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center max-w-md">
        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
          <svg
            className="w-10 h-10 text-white"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 6v6m0 0v6m0-6h6m-6 0H6"
            />
          </svg>
        </div>
        
        <h2 className="text-2xl font-bold text-zinc-900 mb-3">
          {feature} Coming Soon
        </h2>
        
        <p className="text-sm text-zinc-500 mb-6">
          {description ||
            'This feature requires backend API implementation. The admin endpoints are currently being developed.'}
        </p>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-left">
          <p className="text-xs font-semibold text-blue-900 mb-2">
            What's needed:
          </p>
          <ul className="text-xs text-blue-700 space-y-1">
            <li className="flex items-start gap-2">
              <span className="text-blue-400 mt-0.5">•</span>
              <span>Backend admin endpoints at <code className="bg-blue-100 px-1 rounded">api.unifesto.app/admin/*</code></span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-400 mt-0.5">•</span>
              <span>Admin authentication guard</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-400 mt-0.5">•</span>
              <span>CRUD operations for {feature.toLowerCase()}</span>
            </li>
          </ul>
        </div>

        <div className="mt-6 text-xs text-zinc-400">
          <p>
            See <code className="bg-zinc-100 px-1.5 py-0.5 rounded">ADMIN_PANEL_STATUS.md</code> for implementation details
          </p>
        </div>
      </div>
    </div>
  );
}
