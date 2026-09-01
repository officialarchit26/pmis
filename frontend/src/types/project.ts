// Project type definitions
export interface Department {
  id: string
  name: string
  code: string
  description?: string
}

export interface District {
  id: string
  name: string
  state: string
  region?: string
  latitude?: number
  longitude?: number
}

export interface Project {
  id: string
  name: string
  description?: string
  department_id: string
  district_id: string
  status: 'planning' | 'active' | 'on_hold' | 'completed' | 'cancelled'
  progress_percent: number
  start_date: string
  end_date: string
  budget_total: number
  budget_utilized: number
  risk_score: number
  department?: Department
  district?: District
  created_at: string
  updated_at: string
}

export interface Milestone {
  id: string
  project_id: string
  title: string
  description?: string
  due_date: string
  status: 'pending' | 'in_progress' | 'completed' | 'overdue' | 'blocked'
  completed_at?: string
  order_num: number
}

export interface Budget {
  id: string
  project_id: string
  category: string
  allocated: number
  utilized: number
  fiscal_year: number
}

export interface RiskAssessment {
  id: string
  project_id: string
  ai_analysis: {
    summary: string
    factors: string[]
    recommendations: string[]
    confidence: number
  }
  risk_score: number
  risk_level: 'low' | 'medium' | 'high' | 'critical'
  factors: string[]
  generated_at: string
}

export interface Report {
  id: string
  project_id: string
  ai_generated_title: string
  ai_generated_content: {
    title: string
    sections: { heading: string; content: string }[]
    summary: string
    next_steps: string[]
  }
  report_type: 'status' | 'executive_summary' | 'recommendations' | 'budget_review'
  created_at: string
}