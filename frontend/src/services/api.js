// PMIS Frontend API Service Layer
// Handles all communication with the backend API

const API_BASE = '/api';

class ApiError extends Error {
  constructor(message, status, code) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
}

function getAuthToken() {
  return localStorage.getItem('pmis_token');
}

async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const token = getAuthToken();

  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  // Add authentication token if available
  if (token && !options.skipAuth) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }

  if (options.body && typeof options.body === 'object') {
    config.body = JSON.stringify(options.body);
  }

  try {
    const response = await fetch(url, config);
    const data = await response.json();

    if (!response.ok) {
      throw new ApiError(
        data.error?.message || `HTTP error ${response.status}`,
        response.status,
        data.error?.code || 'HTTP_ERROR'
      );
    }

    return data;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(
      error.message || 'Network error',
      0,
      'NETWORK_ERROR'
    );
  }
}

// ============ HEALTH ============
export async function checkHealth() {
  return request('/health');
}

export async function checkFullHealth() {
  return request('/health/full');
}

// ============ DASHBOARD ============
export async function getDashboardSummary() {
  return request('/dashboard/summary');
}

// ============ PROJECTS ============
export async function getProjects(filters = {}) {
  const params = new URLSearchParams();
  if (filters.status) params.append('status', filters.status);
  if (filters.department_id) params.append('department_id', filters.department_id);
  if (filters.district_id) params.append('district_id', filters.district_id);
  if (filters.search) params.append('search', filters.search);
  const query = params.toString() ? `?${params.toString()}` : '';
  return request(`/projects${query}`);
}

export async function getProjectById(id) {
  return request(`/projects/${id}`);
}

export async function getProjectMapData() {
  return request('/projects/map-data');
}

export async function createProject(projectData) {
  return request('/projects', {
    method: 'POST',
    body: projectData,
  });
}

export async function updateProject(id, updates) {
  return request(`/projects/${id}`, {
    method: 'PUT',
    body: updates,
  });
}

// ============ PROJECT PROGRESS ============
export async function getProjectProgress(projectId) {
  return request(`/projects/${projectId}/progress`);
}

export async function addProjectProgress(projectId, progressData) {
  return request(`/projects/${projectId}/progress`, {
    method: 'POST',
    body: progressData,
  });
}

// ============ DEPARTMENTS ============
export async function getDepartments() {
  return request('/departments');
}

export async function getDepartmentById(id) {
  return request(`/departments/${id}`);
}

// ============ DISTRICTS ============
export async function getDistricts() {
  return request('/districts');
}

// ============ ALERTS ============
export async function getAlerts(filters = {}) {
  const params = new URLSearchParams();
  if (filters.project_id) params.append('project_id', filters.project_id);
  if (filters.type) params.append('type', filters.type);
  if (filters.severity) params.append('severity', filters.severity);
  if (filters.resolved !== undefined) params.append('resolved', filters.resolved);
  const query = params.toString() ? `?${params.toString()}` : '';
  return request(`/alerts${query}`);
}

// ============ AUTH (for future) ============
export async function login(credentials) {
  return request('/auth/login', {
    method: 'POST',
    body: credentials,
  });
}

export async function logout() {
  return request('/auth/logout', {
    method: 'POST',
  });
}

export async function getCurrentUser() {
  return request('/auth/me');
}

export default {
  checkHealth,
  checkFullHealth,
  getDashboardSummary,
  getProjects,
  getProjectById,
  getProjectMapData,
  createProject,
  updateProject,
  getProjectProgress,
  addProjectProgress,
  getDepartments,
  getDepartmentById,
  getDistricts,
  getAlerts,
  login,
  logout,
  getCurrentUser,
};