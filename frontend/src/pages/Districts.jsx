import { useState, useEffect } from 'react';
import { getDistricts, getProjects } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';

export default function Districts() {
  const [districts, setDistricts] = useState([]);
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
      const [distData, projData] = await Promise.all([
        getDistricts(),
        getProjects(),
      ]);
      setDistricts(distData.data || []);
      setProjects(projData.data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingSpinner message="Loading districts..." />;
  if (error) return <ErrorMessage message={error} onRetry={loadData} />;

  const getDistrictStats = (distId) => {
    const distProjects = projects.filter(p => p.district_id === distId);
    return {
      count: distProjects.length,
      totalBudget: distProjects.reduce((sum, p) => sum + (p.budget_total || 0), 0),
      avgProgress: distProjects.length > 0
        ? Math.round(distProjects.reduce((sum, p) => sum + (p.progress_percent || 0), 0) / distProjects.length)
        : 0,
    };
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Districts</h1>
        <p className="text-gray-600 mt-1">Government district overview</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {districts.map((dist) => {
          const stats = getDistrictStats(dist.id);
          return (
            <div key={dist.id} className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-green-100 rounded-lg">
                  <span className="text-2xl">📍</span>
                </div>
                <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs font-semibold rounded">
                  {dist.region}
                </span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{dist.name}</h3>
              <p className="text-sm text-gray-600 mb-2">{dist.state}</p>
              {dist.latitude && dist.longitude && (
                <p className="text-xs text-gray-500 mb-4">
                  📍 {Number(dist.latitude).toFixed(4)}, {Number(dist.longitude).toFixed(4)}
                </p>
              )}
              <div className="grid grid-cols-3 gap-2 pt-4 border-t border-gray-100">
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600">{stats.count}</p>
                  <p className="text-xs text-gray-500">Projects</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-blue-600">{stats.avgProgress}%</p>
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