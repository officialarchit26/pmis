-- ============================================
-- Project Pulse Database Schema
-- PostgreSQL via Supabase
-- Created: Phase 2
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. DEPARTMENTS TABLE
-- ============================================
CREATE TABLE departments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 2. DISTRICTS TABLE
-- ============================================
CREATE TABLE districts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    state VARCHAR(100) NOT NULL,
    region VARCHAR(100),
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 3. USERS TABLE
-- ============================================
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    full_name VARCHAR(255),
    role VARCHAR(50) NOT NULL DEFAULT 'viewer'
        CHECK (role IN ('admin', 'department_officer', 'district_officer', 'viewer')),
    department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
    district_id UUID REFERENCES districts(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 4. PROJECTS TABLE
-- ============================================
CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
    district_id UUID REFERENCES districts(id) ON DELETE SET NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'planning'
        CHECK (status IN ('planning', 'active', 'on_hold', 'completed', 'cancelled')),
    priority VARCHAR(20) DEFAULT 'medium'
        CHECK (priority IN ('low', 'medium', 'high', 'critical')),
    start_date DATE,
    end_date DATE,
    progress_percent DECIMAL(5, 2) DEFAULT 0
        CHECK (progress_percent >= 0 AND progress_percent <= 100),
    budget_total DECIMAL(15, 2) DEFAULT 0,
    budget_utilized DECIMAL(15, 2) DEFAULT 0,
    risk_score DECIMAL(5, 2) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 5. MILESTONES TABLE
-- ============================================
CREATE TABLE milestones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    due_date DATE NOT NULL,
    status VARCHAR(50) DEFAULT 'pending'
        CHECK (status IN ('pending', 'in_progress', 'completed', 'overdue', 'blocked')),
    completed_at TIMESTAMPTZ,
    order_num INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 6. BUDGETS TABLE
-- ============================================
CREATE TABLE budgets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    category VARCHAR(100) NOT NULL,
    allocated DECIMAL(15, 2) NOT NULL DEFAULT 0,
    utilized DECIMAL(15, 2) DEFAULT 0,
    fiscal_year VARCHAR(10) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT budget_utilized_check CHECK (utilized <= allocated)
);

-- ============================================
-- 7. RISK ASSESSMENTS TABLE
-- ============================================
CREATE TABLE risk_assessments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    ai_analysis JSONB,
    risk_score DECIMAL(5, 2) NOT NULL,
    risk_level VARCHAR(20) CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
    factors TEXT[],
    generated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 8. REPORTS TABLE
-- ============================================
CREATE TABLE reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    ai_generated_title VARCHAR(255),
    ai_generated_content JSONB NOT NULL,
    report_type VARCHAR(50) CHECK (report_type IN ('status', 'executive_summary', 'recommendations', 'budget_review')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 9. CHAT SESSIONS TABLE
-- ============================================
CREATE TABLE chat_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    title VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 10. CHAT MESSAGES TABLE
-- ============================================
CREATE TABLE chat_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
    user_message TEXT NOT NULL,
    ai_response TEXT,
    is_user BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================
CREATE INDEX idx_projects_department ON projects(department_id);
CREATE INDEX idx_projects_district ON projects(district_id);
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_projects_risk_score ON projects(risk_score DESC);
CREATE INDEX idx_milestones_project ON milestones(project_id);
CREATE INDEX idx_milestones_status ON milestones(status);
CREATE INDEX idx_milestones_due_date ON milestones(due_date);
CREATE INDEX idx_budgets_project ON budgets(project_id);
CREATE INDEX idx_budgets_fiscal_year ON budgets(fiscal_year);
CREATE INDEX idx_risk_assessments_project ON risk_assessments(project_id);
CREATE INDEX idx_risk_assessments_generated_at ON risk_assessments(generated_at DESC);
CREATE INDEX idx_reports_project ON reports(project_id);
CREATE INDEX idx_reports_type ON reports(report_type);
CREATE INDEX idx_chat_sessions_user ON chat_sessions(user_id);
CREATE INDEX idx_chat_messages_session ON chat_messages(session_id);

-- ============================================
-- TRIGGERS FOR UPDATED_AT
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_projects_updated_at
    BEFORE UPDATE ON projects
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_budgets_updated_at
    BEFORE UPDATE ON budgets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE risk_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS POLICIES
-- ============================================

-- Users: Only admins can manage users
CREATE POLICY users_select ON users FOR SELECT TO authenticated USING (true);
CREATE POLICY users_admin_all ON users FOR ALL TO authenticated
    USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'));

-- Projects: All authenticated users can view
CREATE POLICY projects_select ON projects FOR SELECT TO authenticated USING (true);

-- Allow department officers to update their department's projects
CREATE POLICY projects_dept_update ON projects FOR UPDATE TO authenticated
    USING (
        department_id IN (SELECT department_id FROM users WHERE id = auth.uid())
        OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
    );

-- Allow admins to do everything with projects
CREATE POLICY projects_admin_all ON projects FOR ALL TO authenticated
    USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'));

-- Milestones: Same as projects
CREATE POLICY milestones_select ON milestones FOR SELECT TO authenticated USING (true);
CREATE POLICY milestones_modify ON milestones FOR ALL TO authenticated
    USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'department_officer')));

-- Budgets: Same as projects
CREATE POLICY budgets_select ON budgets FOR SELECT TO authenticated USING (true);
CREATE POLICY budgets_modify ON budgets FOR ALL TO authenticated
    USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'department_officer')));

-- Risk assessments: Read for all, write for department officers and admins
CREATE POLICY risk_assessments_select ON risk_assessments FOR SELECT TO authenticated USING (true);
CREATE POLICY risk_assessments_modify ON risk_assessments FOR ALL TO authenticated
    USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'department_officer')));

-- Reports: Read for all authenticated, write for department officers and admins
CREATE POLICY reports_select ON reports FOR SELECT TO authenticated USING (true);
CREATE POLICY reports_modify ON reports FOR ALL TO authenticated
    USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'department_officer')));

-- Chat sessions and messages: User can only see their own
CREATE POLICY chat_sessions_select ON chat_sessions FOR SELECT TO authenticated
    USING (user_id = auth.uid() OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY chat_sessions_insert ON chat_sessions FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

CREATE POLICY chat_messages_select ON chat_messages FOR SELECT TO authenticated
    USING (
        session_id IN (SELECT id FROM chat_sessions WHERE user_id = auth.uid())
        OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
    );
CREATE POLICY chat_messages_insert ON chat_messages FOR INSERT TO authenticated WITH CHECK (
        session_id IN (SELECT id FROM chat_sessions WHERE user_id = auth.uid())
    );
