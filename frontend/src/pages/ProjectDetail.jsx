import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getProjectById, getRiskAnalysis, generateAiReport } from '../services/api';
import StatusBadge from '../components/StatusBadge';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import AIAssistantModal from '../components/AIAssistantModal';
import AIReportModal from '../components/AIReportModal';

export default function ProjectDetail() {
  const { id } = useParams();
  const [project, setProject] = useState(null);
  const [riskData, setRiskData] = useState(null);
  const [reportData, setReportData] = useState(null);
  const [reportLoading, setReportLoading] = useState(false);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadProject();
  }, [id]);

  const loadProject = async () => {
    try {
      setLoading(true);
      setError(null);
      const [projRes, riskRes] = await Promise.all([
        getProjectById(id),
        getRiskAnalysis(id).catch(() => null)
      ]);
      setProject(projRes.data);
      if (riskRes?.data) {
        setRiskData(riskRes.data);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateReport = async () => {
    setIsReportModalOpen(true);
    setReportLoading(true);
    try {
      const res = await generateAiReport(id);
      setReportData(res.data);
    } catch (err) {
      console.error('Failed to generate report:', err);
    } finally {
      setReportLoading(false);
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
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{project.name}</h1>
            <p className="text-gray-600 mt-2">{project.description}</p>
          </div>
          <div className="flex items-center gap-3">
            <StatusBadge status={project.status} />
            <button
              onClick={() => setIsAiModalOpen(true)}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5"
            >
              <span>🤖</span>
              <span>Ask AI</span>
            </button>
            <button
              onClick={handleGenerateReport}
              className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 shadow-sm"
            >
              <span>📄</span>
              <span>Generate AI Report</span>
            </button>
          </div>
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
          {riskData && (
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 mt-1 block">
              Level: {riskData.riskLevel}
            </span>
          )}
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <p className="text-sm text-gray-500">Timeline</p>
          <p className="text-sm font-medium text-gray-900 mt-2">
            {project.start_date || 'N/A'} to {project.end_date || 'N/A'}
          </p>
        </div>
      </div>

      {/* AI Risk Assessment Card */}
      {riskData && (
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl shadow-md p-6 mb-8 border border-indigo-900/50">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 flex items-center justify-center text-2xl">
                ⚡
              </div>
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  PMIS AI Risk Engine Intelligence
                  <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                    riskData.riskLevel === 'CRITICAL' ? 'bg-red-500/20 text-red-300 border border-red-400/30' :
                    riskData.riskLevel === 'HIGH' ? 'bg-orange-500/20 text-orange-300 border border-orange-400/30' :
                    'bg-emerald-500/20 text-emerald-300 border border-emerald-400/30'
                  }`}>
                    {riskData.riskLevel} RISK
                  </span>
                </h2>
                <p className="text-xs text-indigo-200 mt-0.5">
                  Automated telemetry analysis of milestone velocity, budget drawdown, and schedule variance
                </p>
              </div>
            </div>
            <button
              onClick={handleGenerateReport}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 self-start md:self-auto"
            >
              <span>📄</span>
              <span>Generate Full Report</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-5">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-300 mb-2">Key Risk Factors</h3>
              {riskData.factors.length > 0 ? (
                <ul className="space-y-2">
                  {riskData.factors.map((f, i) => (
                    <li key={i} className="text-xs text-slate-200 flex items-start gap-2 bg-white/5 p-2 rounded-lg border border-white/5">
                      <span className="text-amber-400">⚠️</span>
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-emerald-300">✓ No critical risk triggers detected.</p>
              )}
            </div>

            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-300 mb-2">AI Recommended Actions</h3>
              {riskData.recommendations.length > 0 ? (
                <ul className="space-y-2">
                  {riskData.recommendations.map((r, i) => (
                    <li key={i} className="text-xs text-slate-200 flex items-start gap-2 bg-white/5 p-2 rounded-lg border border-white/5">
                      <span className="text-blue-400">💡</span>
                      <span>{r}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-slate-300">Maintain standard monitoring intervals.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Details & Budget */}
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

      {/* AI Assistant Modal for this project */}
      <AIAssistantModal
        isOpen={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
        defaultProjectId={project.id}
        projectName={project.name}
      />

      {/* AI Report Modal */}
      <AIReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        report={reportData}
        loading={reportLoading}
        onRegenerate={handleGenerateReport}
      />
    </div>
  );
}