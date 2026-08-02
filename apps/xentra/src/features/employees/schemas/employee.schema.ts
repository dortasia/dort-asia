import { z } from 'zod'

export const employeeSchema = z.object({
  fullName: z.string().min(2, 'Full name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(8, 'Phone number must be at least 8 digits'),
  nric: z.string().min(9, 'NRIC/FIN must be 9 characters'),
  department: z.string().min(1, 'Department selection is required'),
  jobTitle: z.string().min(2, 'Job title is required'),
  salary: z.number().positive('Salary must be a positive number'),
  type: z.enum(['FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERN']),
  joinDate: z.string().min(1, 'Join date is required'),
})

export type EmployeeSchema = z.infer<typeof employeeSchema>
