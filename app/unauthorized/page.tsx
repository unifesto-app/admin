import Link from 'next/link';

export default function UnauthorizedPage() {
  return (
    <main className="min-h-screen bg-zinc-100 flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm text-center">
        <h1 className="text-xl font-semibold text-black mb-2">Access denied</h1>
        <p className="text-sm text-zinc-500 mb-5">
          Your account is signed in, but it does not have admin privileges for this dashboard.
        </p>
        <Link
          href="/login"
          className="inline-flex items-center justify-center bg-blue-600 text-white text-sm rounded-lg px-4 py-2.5 font-medium hover:bg-blue-700"
        >
          Back to login
        </Link>
      </div>
    </main>
  );
}
