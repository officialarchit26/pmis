import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getDashboardSummary, getProjects, getDepartments } from '../services/api';
import KPICard from '../components/KPICard';
import StatusBadge from '../components/StatusBadge';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LineChart, Line
} from 'recharts';

const STATUS_COLORS = {
  planning: '#3b82f6',
  active: '#10b981',
  on_hold: '#f59e0b',
  completed: '#6366f1',
  delayed: '#ef4444',
  cancelled: '#6b7280',
};

export default function ExecutiveDashboard() {
  const { user } = useAuth();
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getDashboardSummary();
      setSummary(data.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingSpinner message="Loading executive dashboard..." />;
  if (error) return <ErrorMessage message={error} onRetry={loadData} />;
  if (!summary) return null;

  const { kpis, projects_by_department = [], projects_by_status = [], projects_by_district = [] } = summary;

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Executive Dashboard</h1>
        <p className="text-gray-600 mt-1">State-wide project monitoring and analytics</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <KPICard title="Total Projects" value={kpis?.total_projects || 0} icon="📁" color="blue" />
        <KPICard title="Ongoing" value={kpis?.ongoing_projects ?? kpis?.active_projects ?? 0} icon="🔄" color="green" />
        <KPICard title="Completed" value={kpis?.completed_projects || 0} icon="✅" color="indigo" />
        <KPICard title="Delayed" value={kpis?.delayed_projects || 0} icon="⚠️" color="red" />
        <KPICard title="At Risk" value={kpis?.at_risk_projects || 0} icon="🚨" color="orange" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <KPICard title="Total Budget" value={`$${((kpis?.total_budget || 0) / 1000000).toFixed(1)}M`} icon="💰" color="blue" />
        <KPICard title="Budget Used" value={`${kpis?.utilization_percent || 0}%`} icon="📊" color="purple" />
        <KPICard title="Avg Progress" value={`${kpis?.average_progress || 0}%`} icon="📈" color="green" />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Department Performance */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Department Performance</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={projects_by_department}>
              <XAxis dataKey="department_name" tick={{ fontSize: 10 }} angle={-15} textAnchor="end" height={50} />
              <YAxis />
              <Tooltip />
              <Bar dataKey="avg_progress" fill="#3b82f6" name="Avg Progress %" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Status Distribution */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Project Status Overview</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={projects_by_status.filter(s => s.count > 0)}
                dataKey="count"
                nameKey="status"
                cx="50%"
                cy="50%"
                outerRadius={100}
                label={({ status, count }) => `${status}: ${count}`}
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

      {/* District Performance */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">District Performance</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={projects_by_district}>
            <XAxis dataKey="district_name" tick={{ fontSize: 11 }} />
            <YAxis />
            <Tooltip />
            <Bar dataKey="avg_progress" fill="#10b981" name="Avg Progress %" />
            <Bar dataKey="project_count" fill="#6366f1" name="Projects" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Critical Projects */}
      {summary.critical_projects?.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Critical Projects Requiring Attention</h2>
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
                {summary.critical_projects.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium text-gray-900">{p.name}</td>
                    <td className="px-6 py-4"><StatusBadge status={p.status} /></td>
                    <td className="px-6 py-4">{p.progress_percent}%</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded ${
                        p.risk_score >= 75 ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'
                      }`}>{p.risk_score}/100</span>
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