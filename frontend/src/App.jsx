import { useState, useEffect } from 'react';

function App() {
  const [backendStatus, setBackendStatus] = useState('Checking...');
  const [backendConnected, setBackendConnected] = useState(false);

  useEffect(() => {
    // Check if backend is reachable
    fetch('/api/health')
      .then((res) => res.json())
      .then((data) => {
        if (data.status === 'ok') {
          setBackendStatus('Connected');
          setBackendConnected(true);
        } else {
          setBackendStatus('Unavailable');
        }
      })
      .catch(() => {
        setBackendStatus('Disconnected');
        setBackendConnected(false);
      });
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-3xl mx-auto text-center">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-5xl font-bold text-gray-900 mb-3">
              PMIS
            </h1>
            <p className="text-xl text-green-600">
              Project Monitoring & Intelligence System 
            </p>
          </div>

          {/* Status Card */}
          <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div
                className={`w-3 h-3 rounded-full ${
                  backendConnected ? 'bg-green-500' : 'bg-yellow-500'
                } animate-pulse`}
              />
              <h2 className="text-2xl font-semibold text-gray-800">
                Frontend Connected
              </h2>
            </div>

            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-500 mb-1">Backend Status</p>
              <p
                className={`text-lg font-semibold ${
                  backendConnected ? 'text-green-600' : 'text-yellow-600'
                }`}
              >
                {backendStatus}
              </p>
            </div>

            <div className="mt-4 text-sm text-gray-500">
              Phase 1 Setup Complete
            </div>
          </div>

          {/* Info */}
          <div className="bg-white/60 backdrop-blur rounded-lg p-6 text-left">
            <h3 className="font-semibold text-gray-800 mb-3">
              Next Steps
            </h3>
            <ul className="space-y-2 text-gray-600">
              <li className="flex items-start gap-2">
                <span className="text-primary-600">•</span>
                <span>Configure Supabase credentials in backend/.env</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary-600">•</span>
                <span>Database schema is ready in database/schema.sql</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary-600">•</span>
                <span>Sample data available in data/seed/</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
