import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const AuthContext = createContext(null);

const ROLES = {
  WORKER: 'worker',
  OFFICIAL: 'official',
  SENIOR_OFFICIAL: 'senior_official',
  ADMIN: 'admin',
};

const ROLE_LABELS = {
  worker: 'Worker',
  official: 'Official',
  senior_official: 'Senior Official',
  admin: 'Administrator',
};

const ROLE_DASHBOARDS = {
  worker: '/worker',
  official: '/dashboard',
  senior_official: '/executive',
  admin: '/admin',
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Check for existing session on mount
  useEffect(() => {
    const savedUser = localStorage.getItem('pmis_user');
    const savedToken = localStorage.getItem('pmis_token');

    if (savedUser && savedToken) {
      try {
        setUser(JSON.parse(savedUser));
        // Set default auth header
        // fetch.defaults.headers.common['Authorization'] = `Bearer ${savedToken}`;
      } catch (e) {
        localStorage.removeItem('pmis_user');
        localStorage.removeItem('pmis_token');
      }
    }
    setLoading(false);
  }, []);

  const login = useCallback(async (email, password) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error?.message || 'Login failed');
      }

      const { session } = data.data;
      const userData = session.user;

      // Save to localStorage
      localStorage.setItem('pmis_token', session.access_token);
      localStorage.setItem('pmis_user', JSON.stringify(userData));

      setUser(userData);
      return userData;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      const token = localStorage.getItem('pmis_token');
      if (token) {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        });
      }
    } catch (e) {
      // Ignore logout errors
    } finally {
      localStorage.removeItem('pmis_token');
      localStorage.removeItem('pmis_user');
      setUser(null);
    }
  }, []);

  const getDashboardRoute = useCallback(() => {
    if (!user) return '/login';
    return ROLE_DASHBOARDS[user.role] || '/dashboard';
  }, [user]);

  const hasRole = useCallback((roles) => {
    if (!user) return false;
    const roleArray = Array.isArray(roles) ? roles : [roles];
    return roleArray.includes(user.role);
  }, [user]);

  const value = {
    user,
    loading,
    error,
    login,
    logout,
    getDashboardRoute,
    hasRole,
    isAuthenticated: !!user,
    ROLES,
    ROLE_LABELS,
    ROLE_DASHBOARDS,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;