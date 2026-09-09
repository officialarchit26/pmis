import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getDashboardSummary, getProjects } from '../services/api';
import KPICard from '../components/KPICard';
import StatusBadge from '../components/StatusBadge';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

const STATUS_COLORS = {
  planning: '#3b82f6',
  active: '#10b981',
  on_hold: '#f59e0b',
  completed: '#6366f1',
  delayed: '#ef4444',
  cancelled: '#6b7280',
};

export default function Dashboard() {
  const { user } = useAuth();
  const [summary, setSummary] = useState(null);
  const [criticalProjects, setCriticalProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [summaryData, projectsData] = await Promise.all([
        getDashboardSummary(),
        getProjects(),
      ]);
      setSummary(summaryData.data);
      setCriticalProjects(
        (projectsData.data || [])
          .filter(p => p.status === 'delayed' || (p.risk_score && p.risk_score >= 60))
          .sort((a, b) => (b.risk_score || 0) - (a.risk_score || 0))
          .slice(0, 5)
      );
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingSpinner message="Loading dashboard..." />;
  if (error) return <ErrorMessage message={error} onRetry={loadData} />;
  if (!summary) return null;

  const { kpis, projects_by_department = [], projects_by_status = [] } = summary;

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Welcome, {user?.full_name || 'Official'}</h1>
        <p className="text-gray-600 mt-1">Real-time project monitoring and analytics</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <KPICard
          title="Total Projects"
          value={kpis?.total_projects || 0}
          icon="📁"
          color="blue"
        />
        <KPICard
          title="Ongoing"
          value={kpis?.ongoing_projects ?? kpis?.active_projects ?? 0}
          icon="🔄"
          color="green"
        />
        <KPICard
          title="Completed"
          value={kpis?.completed_projects || 0}
          icon="✅"
          color="indigo"
        />
        <KPICard
          title="Delayed"
          value={kpis?.delayed_projects || 0}
          icon="⚠️"
          color="red"
        />
        <KPICard
          title="At Risk"
          value={kpis?.at_risk_projects || 0}
          icon="🚨"
          color="orange"
        />
        <KPICard
          title="Total Budget"
          value={`$${((kpis?.total_budget || 0) / 1000000).toFixed(1)}M`}
          icon="💰"
          color="blue"
        />
        <KPICard
          title="Budget Used"
          value={`${kpis?.utilization_percent || 0}%`}
          icon="📊"
          color="purple"
        />
        <KPICard
          title="Avg Progress"
          value={`${kpis?.average_progress || 0}%`}
          icon="📈"
          color="green"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Department Performance */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Department Performance</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={projects_by_department}>
              <XAxis dataKey="department_name" tick={{ fontSize: 11 }} angle={-20} textAnchor="end" height={60} />
              <YAxis />
              <Tooltip />
              <Bar dataKey="avg_progress" fill="#3b82f6" name="Avg Progress %" />
              <Bar dataKey="project_count" fill="#10b981" name="Projects" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Status Distribution */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Project Status Distribution</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={projects_by_status.filter(s => s.count > 0)}
                dataKey="count"
                nameKey="status"
                cx="50%"
                cy="50%"
                outerRadius={100}
                label={(entry) => `${entry.status}: ${entry.count}`}
              >
                {projects_by_status.map((entry, index) => (
                  <Cell key={index} fill={STATUS_COLORS[entry.status] || '#6b7280'} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Critical Projects */}
      {criticalProjects.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Critical Projects</h2>
            <p className="text-sm text-gray-500">Projects requiring immediate attention</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Project</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Progress</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Risk Score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {criticalProjects.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{p.name}</td>
                    <td className="px-6 py-4"><StatusBadge status={p.status} /></td>
                    <td className="px-6 py-4 text-sm text-gray-600">{p.progress_percent}%</td>
                    <td className="px-6 py-4 text-sm">
                      <span className={`px-2 py-1 rounded ${
                        p.risk_score >= 75 ? 'bg-red-100 text-red-700' :
                        p.risk_score >= 50 ? 'bg-orange-100 text-orange-700' :
                        'bg-yellow-100 text-yellow-700'
                      }`}>
                        {p.risk_score}/100
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}