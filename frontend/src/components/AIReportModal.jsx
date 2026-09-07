export default function AIReportModal({ isOpen, onClose, report, loading, onRegenerate }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[85vh] flex flex-col overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-slate-900 text-white p-5 flex items-center justify-between border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xl">📄</span>
              <span className="text-xs uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-400/30">
                PMIS AI Intelligence Report
              </span>
            </div>
            <h2 className="text-xl font-bold text-white">
              {report?.title || 'Project Intelligence & Assessment Report'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 p-6 overflow-y-auto space-y-6">
          {loading ? (
            <div className="py-16 text-center">
              <div className="inline-block w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
              <p className="text-base font-semibold text-slate-800">Generating AI Executive Report...</p>
              <p className="text-xs text-slate-500 mt-1">
                Gemini is synthesizing timeline velocity, budget burn-rate, and risk indicators
              </p>
            </div>
          ) : report ? (
            <>
              {/* Verdict Banner */}
              <div className={`p-4 rounded-xl border flex items-center justify-between ${
                report.overall_verdict?.includes('CRITICAL')
                  ? 'bg-red-50 border-red-200 text-red-800'
                  : report.overall_verdict?.includes('RISK')
                  ? 'bg-amber-50 border-amber-200 text-amber-800'
                  : 'bg-emerald-50 border-emerald-200 text-emerald-800'
              }`}>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider">Strategic Assessment</p>
                  <p className="text-lg font-bold mt-0.5">{report.overall_verdict || 'EVALUATED'}</p>
                </div>
                <div className="text-3xl">
                  {report.overall_verdict?.includes('CRITICAL') ? '🚨' : report.overall_verdict?.includes('RISK') ? '⚠️' : '✅'}
                </div>
              </div>

              {/* Executive Summary */}
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-2">Executive Summary</h3>
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-slate-800 text-sm leading-relaxed">
                  {report.executive_summary}
                </div>
              </div>

              {/* Two Column Analysis */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 flex items-center gap-1.5">
                    <span>⏱️</span> Timeline & Milestone Analysis
                  </h4>
                  <p className="text-sm text-slate-700 leading-relaxed">{report.timeline_analysis}</p>
                </div>

                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 flex items-center gap-1.5">
                    <span>💰</span> Financial & Budget Analysis
                  </h4>
                  <p className="text-sm text-slate-700 leading-relaxed">{report.financial_analysis}</p>
                </div>
              </div>

              {/* Risk Assessment */}
              {report.risk_assessment && (
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-2">Risk Vector Analysis</h3>
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-slate-800 text-sm leading-relaxed">
                    {report.risk_assessment}
                  </div>
                </div>
              )}

              {/* Strategic Recommendations */}
              {report.strategic_recommendations && report.strategic_recommendations.length > 0 && (
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-2">Strategic Action Items</h3>
                  <div className="space-y-2">
                    {report.strategic_recommendations.map((rec, i) => (
                      <div key={i} className="flex items-start gap-3 p-3 bg-blue-50/50 border border-blue-100 rounded-lg text-sm text-slate-800">
                        <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                          {i + 1}
                        </span>
                        <span className="leading-snug">{rec}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <p className="text-center text-slate-500 py-12">No report data generated yet.</p>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-between items-center">
          <button
            onClick={() => window.print()}
            className="px-4 py-2 border border-slate-300 rounded-lg text-sm text-slate-700 hover:bg-white font-medium transition-colors"
          >
            🖨️ Print Report
          </button>
          <div className="flex gap-2">
            {onRegenerate && (
              <button
                onClick={onRegenerate}
                disabled={loading}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
              >
                🔄 Refresh Report
              </button>
            )}
            <button
              onClick={onClose}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
