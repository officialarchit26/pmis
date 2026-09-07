import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const ROLE_NAV = {
  worker: [
    { path: '/worker', icon: '🏠', label: 'My Dashboard' },
    { path: '/projects', icon: '📁', label: 'My Projects' },
    { path: '/map', icon: '🗺️', label: 'Project Map' },
  ],
  official: [
    { path: '/dashboard', icon: '📊', label: 'Dashboard' },
    { path: '/projects', icon: '📁', label: 'Projects' },
    { path: '/map', icon: '🗺️', label: 'Map' },
    { path: '/alerts', icon: '🔔', label: 'Alerts' },
  ],
  senior_official: [
    { path: '/executive', icon: '📈', label: 'Executive Dashboard' },
    { path: '/projects', icon: '📁', label: 'All Projects' },
    { path: '/departments', icon: '🏛️', label: 'Departments' },
    { path: '/districts', icon: '📍', label: 'Districts' },
    { path: '/map', icon: '🗺️', label: 'Map' },
    { path: '/alerts', icon: '🔔', label: 'Alerts' },
  ],
  admin: [
    { path: '/admin', icon: '⚙️', label: 'Admin Dashboard' },
    { path: '/projects', icon: '📁', label: 'Projects' },
    { path: '/users', icon: '👥', label: 'Users' },
    { path: '/departments', icon: '🏛️', label: 'Departments' },
    { path: '/districts', icon: '📍', label: 'Districts' },
    { path: '/map', icon: '🗺️', label: 'Map' },
    { path: '/alerts', icon: '🔔', label: 'Alerts' },
  ],
};

export default function RoleSidebar() {
  const { user, logout, ROLE_LABELS } = useAuth();
  const navigate = useNavigate();

  const navItems = ROLE_NAV[user?.role] || ROLE_NAV.worker;

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <aside className="w-64 bg-slate-800 text-white min-h-screen flex flex-col">
      <div className="p-6 border-b border-slate-700">
        <h1 className="text-2xl font-bold">PMIS</h1>
        <p className="text-xs text-slate-400 mt-1">Project Monitoring & Intelligence System</p>
      </div>
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {navItems.map(({ path, icon, label }) => (
            <li key={path}>
              <NavLink
                to={path}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                  }`
                }
              >
                <span className="text-xl">{icon}</span>
                <span className="font-medium">{label}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
      {user && (
        <div className="p-4 border-t border-slate-700">
          <div className="mb-3">
            <p className="text-sm font-semibold text-white truncate">
              {user.full_name || user.email}
            </p>
            <p className="text-xs text-slate-400">{ROLE_LABELS[user.role]}</p>
          </div>
          <button
            onClick={handleLogout}
            className="w-full px-3 py-2 bg-slate-700 hover:bg-slate-600 rounded text-sm text-white transition-colors"
          >
            🚪 Logout
          </button>
        </div>
      )}
    </aside>
  );
}