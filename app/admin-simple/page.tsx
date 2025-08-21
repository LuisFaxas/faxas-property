export default function SimpleAdminPage() {
  return (
    <div className="min-h-screen bg-graphite-900 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-4">Simple Admin Dashboard</h1>
        <p className="text-graphite-300">If you can see this, the redirect worked!</p>
        
        <div className="mt-8 space-y-4">
          <div className="glass p-6 rounded-lg">
            <h2 className="text-xl font-semibold text-white mb-2">Test Links</h2>
            <div className="space-x-4">
              <a href="/admin" className="text-accent-500 hover:underline">Full Admin Dashboard</a>
              <a href="/login" className="text-accent-500 hover:underline">Back to Login</a>
              <a href="/test-auth" className="text-accent-500 hover:underline">Test Auth Page</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}