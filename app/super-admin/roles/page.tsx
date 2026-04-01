'use client';
import BrandButton from '../components/BrandButton';

const defaultRoles = [
  {
    name: 'Super Admin',
    description: 'Full unrestricted access to all system modules and settings.',
    permissions: ['All permissions'],
    system: true,
  },
  {
    name: 'Organizer',
    description: 'Can create and manage their own events and view their organization analytics.',
    permissions: ['Create Events', 'Edit Own Events', 'View Own Analytics', 'Manage Registrations'],
    system: false,
  },
  {
    name: 'Attendee',
    description: 'Can browse events, register, and manage their own profile.',
    permissions: ['Browse Events', 'Register for Events', 'View Own Profile'],
    system: false,
  },
];

export default function RolesPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-black">Roles & Permissions</h1>
          <p className="text-sm text-zinc-400 mt-0.5">Define what each role can access and do across the platform.</p>
        </div>
        <BrandButton>+ New Role</BrandButton>
      </div>

      <div className="space-y-4">
        {defaultRoles.map((role) => (
          <div key={role.name} className="bg-white border border-zinc-200 rounded-xl p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h2 className="text-sm font-semibold text-black">{role.name}</h2>
                  {role.system && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-medium text-white" style={{ backgroundColor: '#0062ff' }}>System</span>
                  )}
                </div>
                <p className="text-xs text-zinc-500 mb-3">{role.description}</p>
                <div className="flex flex-wrap gap-1.5">
                  {role.permissions.map((p) => (
                    <span key={p} className="text-[11px] border text-zinc-600 px-2 py-0.5 rounded-md" style={{ borderColor: '#0062ff22', backgroundColor: '#0062ff08', color: '#0062ff' }}>
                      {p}
                    </span>
                  ))}
                </div>
              </div>
              {!role.system && (
                <div className="flex gap-2 shrink-0">
                  <button className="text-xs px-3 py-1.5 border border-zinc-200 rounded-lg transition-colors text-zinc-600 brand-btn-outline">
                    Edit
                  </button>
                  <button className="text-xs px-3 py-1.5 border border-red-100 rounded-lg hover:border-red-400 transition-colors text-red-400 hover:text-red-600">
                    Delete
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="bg-zinc-50 border border-dashed border-zinc-200 rounded-xl p-5 text-center">
        <p className="text-sm font-medium text-zinc-500">Permission Matrix</p>
        <p className="text-xs text-zinc-400 mt-1">A granular permission matrix will render here once roles are connected to your backend.</p>
      </div>
    </div>
  );
}
