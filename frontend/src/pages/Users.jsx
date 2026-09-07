import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getDepartments, getDistricts } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';

const DEMO_USERS = [
  { id: 'demo-worker', email: 'worker@pmis.demo', full_name: 'John Worker', role: 'worker', department: 'Department of Transportation' },
  { id: 'demo-official', email: 'official@pmis.demo', full_name: 'Jane Official', role: 'official', department: 'Department of Transportation' },
  { id: 'demo-senior', email: 'senior@pmis.demo', full_name: 'Robert Senior', role: 'senior_official', department: null },
  { id: 'demo-admin', email: 'admin@pmis.demo', full_name: 'Sarah Admin', role: 'admin', department: null },
];

const ROLE_LABELS = {
  worker: 'Worker',
  official: 'Official',
  senior_official: 'Senior Official',
  admin: 'Administrator',
};

const ROLE_COLORS = {
  worker: 'bg-green-100 text-green-700',
  official: 'bg-blue-100 text-blue-700',
  senior_official: 'bg-purple-100 text-purple-700',
  admin: 'bg-gray-100 text-gray-700',
};

export default function Users() {
  const { user, hasRole } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setTimeout(() => {
      setUsers(DEMO_USERS);
      setLoading(false);
    }, 500);
  }, []);

  if (!hasRole('admin')) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-2xl font-bold text-red-600">Access Denied</h2>
        <p className="text-gray-600 mt-2">Admin access required</p>
      </div>
    );
  }

  if (loading) return <LoadingSpinner message="Loading users..." />;

  return (
    <div className="p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Users</h1>
          <p className="text-gray-600 mt-1">Manage user accounts and roles</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Department</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {users.map((u) => (
              <tr key={u.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 font-medium text-gray-900">{u.full_name}</td>
                <td className="px-6 py-4 text-gray-600">{u.email}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded text-xs font-semibold ${ROLE_COLORS[u.role]}`}>
                    {ROLE_LABELS[u.role]}
                  </span>
                </td>
                <td className="px-6 py-4 text-gray-600">{u.department || '—'}</td>
                <td className="px-6 py-4">
                  <span className="px-2 py-1 rounded text-xs font-semibold bg-green-100 text-green-700">Active</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-blue-800">
          <strong>Note:</strong> User management UI is for demo. In production, use the Supabase dashboard or
          admin API to create/manage users with proper authentication.
        </p>
      </div>
    </div>
  );
}