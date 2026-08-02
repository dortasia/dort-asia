export type EmploymentStatus = 'ACTIVE' | 'ON_LEAVE' | 'PROBATION' | 'TERMINATED'
export type EmploymentType = 'FULL_TIME' | 'PART_TIME' | 'CONTRACT' | 'INTERN'

export interface Employee {
  id: string
  employeeCode: string
  fullName: string
  email: string
  phone: string
  nric: string
  department: string
  jobTitle: string
  role: string
  joinDate: string
  salary: number
  status: EmploymentStatus
  type: EmploymentType
  avatarUrl?: string
  reportingManager?: {
    id: string
    fullName: string
    avatarUrl?: string
    role: string
    email: string
  }
  firstName?: string
  lastName?: string
  dateOfBirth?: string
  gender?: string
  maritalStatus?: string
  nationality?: string
  race?: string
  religion?: string
  passType?: string
  skillStatus?: string
  linkedinUrl?: string
  instagramUrl?: string
  rawCustomFields?: any
}
