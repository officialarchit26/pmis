import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getDashboardSummary, getDepartments, getDistricts } from '../services/api';
import KPICard from '../components/KPICard';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';

export default function AdminDashboard() {
  const { user } = useAuth();
  const [summary, setSummary] = useState(null);
  const [departments, setDepartments] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [summaryData, deptData, distData] = await Promise.all([
        getDashboardSummary(),
        getDepartments(),
        getDistricts(),
      ]);
      setSummary(summaryData.data);
      setDepartments(deptData.data || []);
      setDistricts(distData.data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingSpinner message="Loading admin dashboard..." />;
  if (error) return <ErrorMessage message={error} onRetry={loadData} />;

  const { kpis, projects_by_department = [] } = summary || {};

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-600 mt-1">System administration and overview</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <KPICard title="Total Projects" value={kpis?.total_projects || 0} icon="📁" color="blue" />
        <KPICard title="Total Departments" value={departments.length} icon="🏛️" color="indigo" />
        <KPICard title="Total Districts" value={districts.length} icon="📍" color="green" />
        <KPICard title="Active Alerts" value={summary?.active_alerts || 0} icon="🔔" color="orange" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <KPICard title="Budget Used" value={`${kpis?.utilization_percent || 0}%`} icon="💰" color="purple" />
        <KPICard title="Delayed Projects" value={kpis?.delayed_projects || 0} icon="⚠️" color="red" />
        <KPICard title="At Risk Projects" value={kpis?.at_risk_projects || 0} icon="🚨" color="orange" />
      </div>

      {/* Management Sections */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Users Management */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-3xl">👥</span>
            <h2 className="text-lg font-semibold text-gray-900">Users</h2>
          </div>
          <p className="text-gray-600 mb-4">Manage user accounts and roles</p>
          <Link
            to="/users"
            className="block w-full py-2 bg-blue-600 hover:bg-blue-700 text-white text-center font-medium rounded-lg"
          >
            Manage Users
          </Link>
        </div>

        {/* Departments Management */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-3xl">🏛️</span>
            <h2 className="text-lg font-semibold text-gray-900">Departments</h2>
          </div>
          <p className="text-gray-600 mb-4">{departments.length} departments configured</p>
          <Link
            to="/departments"
            className="block w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-center font-medium rounded-lg"
          >
            Manage Departments
          </Link>
        </div>

        {/* Districts Management */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-3xl">📍</span>
            <h2 className="text-lg font-semibold text-gray-900">Districts</h2>
          </div>
          <p className="text-gray-600 mb-4">{districts.length} districts configured</p>
          <Link
            to="/districts"
            className="block w-full py-2 bg-green-600 hover:bg-green-700 text-white text-center font-medium rounded-lg"
          >
            Manage Districts
          </Link>
        </div>
      </div>

      {/* Department Summary */}
      <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Department Overview</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Department</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Projects</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Budget</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Avg Progress</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {projects_by_department.map((dept) => (
                <tr key={dept.department_id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium text-gray-900">{dept.department_name}</td>
                  <td className="px-6 py-4">{dept.project_count}</td>
                  <td className="px-6 py-4">${(dept.total_budget / 1000000).toFixed(1)}M</td>
                  <td className="px-6 py-4">{dept.avg_progress}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}