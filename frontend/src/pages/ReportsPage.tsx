import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/utils/api'
import type { Report } from '@/types/project'

const ReportsPage: React.FC = () => {
  const { data: reports = [], isLoading } = useQuery({
    queryKey: ['reports'],
    queryFn: async () => {
      const response = await api.get<{ data: Report[] }>('/ai/reports')
      return response.data.data
    }
  })

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">AI-Generated Reports</h1>
        <button className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700">
          + Generate New Report
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600" />
        </div>
      ) : reports.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <div className="text-6xl mb-4">📊</div>
          <h2 className="text-xl font-semibold text-gray-700 mb-2">No Reports Yet</h2>
          <p className="text-gray-500 mb-4">
            AI-generated reports will appear here once you have projects with data.
          </p>
          <button className="bg-purple-600 text-white px-6 py-2 rounded-md hover:bg-purple-700">
            Generate Sample Report
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {reports.map((report) => (
            <div key={report.id} className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-start mb-4">
                <span className="px-2 py-1 text-xs rounded-full bg-purple-100 text-purple-800">
                  {report.report_type}
                </span>
                <span className="text-sm text-gray-500">
                  {new Date(report.created_at).toLocaleDateString()}
                </span>
              </div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                {report.ai_generated_title}
              </h3>
              <p className="text-gray-600 text-sm mb-4">
                {report.ai_generated_content.summary}
              </p>
              <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                View Full Report →
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default ReportsPage