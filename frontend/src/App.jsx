import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import AccessDenied from './pages/AccessDenied';
import RoleRedirect from './pages/RoleRedirect';

// Dashboard pages
import Dashboard from './pages/Dashboard';
import WorkerDashboard from './pages/WorkerDashboard';
import ExecutiveDashboard from './pages/ExecutiveDashboard';
import AdminDashboard from './pages/AdminDashboard';

// Feature pages
import Projects from './pages/Projects';
import ProjectDetail from './pages/ProjectDetail';
import MapView from './pages/MapView';
import Alerts from './pages/Alerts';

// Management pages
import Users from './pages/Users';
import Departments from './pages/Departments';
import Districts from './pages/Districts';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/access-denied" element={<AccessDenied />} />

          {/* Protected routes with Layout */}
          <Route element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }>
            {/* Root redirect based on role */}
            <Route path="/" element={<RoleRedirect />} />

            {/* Worker routes */}
            <Route path="/worker" element={
              <ProtectedRoute allowedRoles={['worker']}>
                <WorkerDashboard />
              </ProtectedRoute>
            } />

            {/* Official routes */}
            <Route path="/dashboard" element={
              <ProtectedRoute allowedRoles={['official', 'senior_official', 'admin']}>
                <Dashboard />
              </ProtectedRoute>
            } />

            {/* Executive routes */}
            <Route path="/executive" element={
              <ProtectedRoute allowedRoles={['senior_official', 'admin']}>
                <ExecutiveDashboard />
              </ProtectedRoute>
            } />

            {/* Admin routes */}
            <Route path="/admin" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminDashboard />
              </ProtectedRoute>
            } />

            {/* Common routes */}
            <Route path="/projects" element={<Projects />} />
            <Route path="/projects/:id" element={<ProjectDetail />} />
            <Route path="/map" element={<MapView />} />
            <Route path="/alerts" element={<Alerts />} />

            {/* Management routes (admin) */}
            <Route path="/users" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <Users />
              </ProtectedRoute>
            } />
            <Route path="/departments" element={<Departments />} />
            <Route path="/districts" element={<Districts />} />
          </Route>

          {/* Catch all */}
          <Route path="*" element={<AccessDenied />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;