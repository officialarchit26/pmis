import React from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'

// Mock data for demonstration
const projectStatusData = [
  { name: 'Planning', value: 25, color: '#60A5FA' },
  { name: 'Active', value: 85, color: '#22C55E' },
  { name: 'On Hold', value: 12, color: '#F59E0B' },
  { name: 'Completed', value: 25, color: '#10B981' },
  { name: 'Cancelled', value: 3, color: '#EF4444' }
]

const departmentProgressData = [
  { department: 'Transportation', progress: 72 },
  { department: 'Education', progress: 85 },
  { department: 'Health', progress: 68 },
  { department: 'Public Works', progress: 55 },
  { department: 'Finance', progress: 90 }
]

const DashboardPage: React.FC = () => {
  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Dashboard</h1>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-gray-500 text-sm font-medium">Total Projects</h3>
          <p className="text-3xl font-bold text-gray-800">150</p>
          <p className="text-green-600 text-sm mt-2">↑ 12% from last month</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-gray-500 text-sm font-medium">Active Projects</h3>
          <p className="text-3xl font-bold text-blue-600">85</p>
          <p className="text-green-600 text-sm mt-2">↑ 5% from last month</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-gray-500 text-sm font-medium">At Risk</h3>
          <p className="text-3xl font-bold text-red-600">18</p>
          <p className="text-red-600 text-sm mt-2">↑ 3 new this week</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-gray-500 text-sm font-medium">Budget Utilization</h3>
          <p className="text-3xl font-bold text-purple-600">47%</p>
          <p className="text-gray-600 text-sm mt-2">$23.5M / $50M</p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Project Status Distribution */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Project Status Distribution</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={projectStatusData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={5}
                dataKey="value"
              >
                {projectStatusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-wrap gap-4 mt-4 justify-center">
            {projectStatusData.map((item) => (
              <div key={item.name} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-sm text-gray-600">{item.name}: {item.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Department Progress */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Department Progress</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={departmentProgressData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" domain={[0, 100]} />
              <YAxis type="category" dataKey="department" width={100} />
              <Tooltip />
              <Bar dataKey="progress" fill="#3B82F6" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}

export default DashboardPage