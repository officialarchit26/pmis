import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getAlerts } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';

const SEVERITY_STYLES = {
  critical: { bg: 'bg-red-100', border: 'border-red-300', icon: '🚨', text: 'text-red-800' },
  high: { bg: 'bg-orange-100', border: 'border-orange-300', icon: '⚠️', text: 'text-orange-800' },
  medium: { bg: 'bg-yellow-100', border: 'border-yellow-300', icon: '⚡', text: 'text-yellow-800' },
  low: { bg: 'bg-blue-100', border: 'border-blue-300', icon: 'ℹ️', text: 'text-blue-800' },
};

const TYPE_LABELS = {
  delay: 'Delay Alert',
  budget_overrun: 'Budget Alert',
  risk: 'Risk Alert',
  deadline: 'Deadline Alert',
  milestone_overdue: 'Milestone Alert',
};

export default function Alerts() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    loadAlerts();
  }, []);

  const loadAlerts = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getAlerts({ resolved: 'false' });
      setAlerts(data.data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const filteredAlerts = filter === 'all'
    ? alerts
    : alerts.filter(a => a.severity === filter);

  if (loading) return <LoadingSpinner message="Loading alerts..." />;
  if (error) return <ErrorMessage message={error} onRetry={loadAlerts} />;

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Alerts</h1>
        <p className="text-gray-600 mt-1">Projects requiring attention</p>
      </div>

      {/* Filters */}
      <div className="mb-6 flex gap-2">
        {['all', 'critical', 'high', 'medium', 'low'].map((sev) => (
          <button
            key={sev}
            onClick={() => setFilter(sev)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === sev
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            {sev.charAt(0).toUpperCase() + sev.slice(1)}
          </button>
        ))}
      </div>

      {/* Alerts List */}
      <div className="space-y-4">
        {filteredAlerts.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-8 text-center">
            <div className="text-6xl mb-4">✅</div>
            <h3 className="text-xl font-semibold text-gray-900">No Alerts</h3>
            <p className="text-gray-600 mt-2">All projects are running smoothly!</p>
          </div>
        ) : (
          filteredAlerts.map((alert) => {
            const style = SEVERITY_STYLES[alert.severity] || SEVERITY_STYLES.medium;
            return (
              <div
                key={alert.id}
                className={`${style.bg} ${style.border} border rounded-xl p-6`}
              >
                <div className="flex items-start gap-4">
                  <div className="text-3xl">{style.icon}</div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div>
                        <span className={`text-xs font-semibold uppercase px-2 py-1 rounded ${style.text}`}>
                          {TYPE_LABELS[alert.type] || alert.type}
                        </span>
                        <h3 className={`font-bold text-lg mt-2 ${style.text}`}>{alert.title}</h3>
                      </div>
                      <span className={`px-2 py-1 rounded text-xs font-semibold bg-white ${style.text}`}>
                        {alert.severity.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-gray-700 mt-2">{alert.message}</p>
                    {alert.project_name && (
                      <Link
                        to={`/projects/${alert.project_id}`}
                        className="inline-block mt-3 text-sm font-medium text-blue-600 hover:text-blue-800"
                      >
                        View Project →
                      </Link>
                    )}
                    <p className="text-xs text-gray-500 mt-3">
                      {new Date(alert.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}