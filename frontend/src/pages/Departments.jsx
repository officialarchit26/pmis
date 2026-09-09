import { useState, useEffect } from 'react';
import { getDepartments, getProjects } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';

export default function Departments() {
  const [departments, setDepartments] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [deptData, projData] = await Promise.all([
        getDepartments(),
        getProjects(),
      ]);
      setDepartments(deptData.data || []);
      setProjects(projData.data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingSpinner message="Loading departments..." />;
  if (error) return <ErrorMessage message={error} onRetry={loadData} />;

  const getDepartmentStats = (dept) => {
    if (dept && dept.project_count !== undefined) {
      return {
        count: dept.project_count,
        totalBudget: dept.total_budget || 0,
        avgProgress: dept.avg_progress || 0,
      };
    }
    const deptProjects = projects.filter(p => p.department_id === (dept?.id || dept));
    return {
      count: deptProjects.length,
      totalBudget: deptProjects.reduce((sum, p) => sum + (p.budget_total || 0), 0),
      avgProgress: deptProjects.length > 0
        ? Math.round((deptProjects.reduce((sum, p) => sum + (p.progress_percent || 0), 0) / deptProjects.length) * 10) / 10
        : 0,
    };
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Departments</h1>
        <p className="text-gray-600 mt-1">Government department overview</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {departments.map((dept) => {
          const stats = getDepartmentStats(dept.id);
          return (
            <div key={dept.id} className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <span className="text-2xl">🏛️</span>
                </div>
                <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs font-semibold rounded">
                  {dept.code}
                </span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{dept.name}</h3>
              <p className="text-sm text-gray-600 mb-4">{dept.description}</p>
              <div className="grid grid-cols-3 gap-2 pt-4 border-t border-gray-100">
                <div className="text-center">
                  <p className="text-2xl font-bold text-blue-600">{stats.count}</p>
                  <p className="text-xs text-gray-500">Projects</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600">{stats.avgProgress}%</p>
                  <p className="text-xs text-gray-500">Avg Progress</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-purple-600">${(stats.totalBudget / 1000000).toFixed(1)}M</p>
                  <p className="text-xs text-gray-500">Budget</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}