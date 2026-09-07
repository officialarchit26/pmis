import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getProjectById } from '../services/api';
import StatusBadge from '../components/StatusBadge';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';

export default function ProjectDetail() {
  const { id } = useParams();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadProject();
  }, [id]);

  const loadProject = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getProjectById(id);
      setProject(data.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingSpinner message="Loading project details..." />;
  if (error) return <ErrorMessage message={error} onRetry={loadProject} />;
  if (!project) return null;

  const budgetPercent = project.budget_total > 0
    ? Math.round((project.budget_utilized / project.budget_total) * 100)
    : 0;

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-6">
        <Link to="/projects" className="text-blue-600 hover:text-blue-800 text-sm mb-2 inline-block">
          ← Back to Projects
        </Link>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{project.name}</h1>
            <p className="text-gray-600 mt-2">{project.description}</p>
          </div>
          <StatusBadge status={project.status} />
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <p className="text-sm text-gray-500">Physical Progress</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{project.progress_percent || 0}%</p>
          <div className="mt-2 h-2 bg-gray-200 rounded-full">
            <div
              className="h-2 bg-blue-600 rounded-full"
              style={{ width: `${project.progress_percent || 0}%` }}
            />
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <p className="text-sm text-gray-500">Budget Utilized</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">${(project.budget_utilized / 1000000).toFixed(1)}M</p>
          <p className="text-sm text-gray-500 mt-1">of ${(project.budget_total / 1000000).toFixed(1)}M ({budgetPercent}%)</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <p className="text-sm text-gray-500">Risk Score</p>
          <p className={`text-3xl font-bold mt-2 ${
            (project.risk_score || 0) >= 75 ? 'text-red-600' :
            (project.risk_score || 0) >= 50 ? 'text-orange-600' : 'text-green-600'
          }`}>
            {project.risk_score || 0}/100
          </p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <p className="text-sm text-gray-500">Timeline</p>
          <p className="text-sm font-medium text-gray-900 mt-2">
            {project.start_date} to {project.end_date}
          </p>
        </div>
      </div>

      {/* Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Project Details</h2>
          <dl className="space-y-3">
            <div className="flex justify-between">
              <dt className="text-gray-500">Department</dt>
              <dd className="font-medium text-gray-900">{project.department?.name || '-'}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">District</dt>
              <dd className="font-medium text-gray-900">{project.district?.name || '-'}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">Priority</dt>
              <dd className="font-medium text-gray-900 capitalize">{project.priority || '-'}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">Start Date</dt>
              <dd className="font-medium text-gray-900">{project.start_date || '-'}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">End Date</dt>
              <dd className="font-medium text-gray-900">{project.end_date || '-'}</dd>
            </div>
          </dl>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Budget Breakdown</h2>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-500">Total Budget</span>
                <span className="font-medium">${project.budget_total?.toLocaleString()}</span>
              </div>
              <div className="h-3 bg-gray-200 rounded-full">
                <div className="h-3 bg-green-500 rounded-full" style={{ width: '100%' }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-500">Utilized</span>
                <span className="font-medium">${project.budget_utilized?.toLocaleString()}</span>
              </div>
              <div className="h-3 bg-gray-200 rounded-full">
                <div
                  className={`h-3 rounded-full ${budgetPercent > 90 ? 'bg-red-500' : 'bg-blue-500'}`}
                  style={{ width: `${budgetPercent}%` }}
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-500">Remaining</span>
                <span className="font-medium text-green-600">
                  ${(project.budget_total - project.budget_utilized)?.toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Milestones */}
      {project.milestones && project.milestones.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Milestones</h2>
          <div className="space-y-3">
            {project.milestones.map((milestone) => (
              <div key={milestone.id} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                <div className={`w-3 h-3 rounded-full ${
                  milestone.status === 'completed' ? 'bg-green-500' :
                  milestone.status === 'in_progress' ? 'bg-blue-500' :
                  milestone.status === 'overdue' ? 'bg-red-500' : 'bg-gray-400'
                }`} />
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{milestone.title}</p>
                  <p className="text-sm text-gray-500">Due: {milestone.due_date}</p>
                </div>
                <StatusBadge status={milestone.status} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Progress History */}
      {project.progress_updates && project.progress_updates.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Progress History</h2>
          <div className="space-y-3">
            {project.progress_updates.map((update) => (
              <div key={update.id} className="flex items-start gap-4 p-3 bg-gray-50 rounded-lg">
                <div className="text-2xl">📝</div>
                <div className="flex-1">
                  <div className="flex justify-between">
                    <p className="font-medium text-gray-900">{update.progress_percent}%</p>
                    <p className="text-sm text-gray-500">
                      {new Date(update.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  {update.notes && <p className="text-sm text-gray-600 mt-1">{update.notes}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}