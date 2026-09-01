// User type definition
export interface User {
  id: string
  email: string
  full_name?: string
  role: 'admin' | 'department_officer' | 'district_officer' | 'viewer'
  department_id?: string
  district_id?: string
}