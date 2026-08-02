export const queryKeys = {
  auth: {
    session: ['auth', 'session'] as const,
    user: ['auth', 'user'] as const,
    permissions: ['auth', 'permissions'] as const,
  },
  employees: {
    all: ['employees'] as const,
    lists: () => [...queryKeys.employees.all, 'list'] as const,
    list: (filters?: Record<string, any>) => [...queryKeys.employees.lists(), filters] as const,
    details: () => [...queryKeys.employees.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.employees.details(), id] as const,
    stats: ['employees', 'stats'] as const,
  },
  attendance: {
    all: ['attendance'] as const,
    today: ['attendance', 'today'] as const,
    history: (employeeId?: string) => ['attendance', 'history', employeeId] as const,
    stats: ['attendance', 'stats'] as const,
  },
  leave: {
    all: ['leave'] as const,
    requests: (status?: string) => ['leave', 'requests', status] as const,
    balances: (employeeId?: string) => ['leave', 'balances', employeeId] as const,
    stats: ['leave', 'stats'] as const,
  },
  claims: {
    all: ['claims'] as const,
    list: (status?: string) => ['claims', 'list', status] as const,
    stats: ['claims', 'stats'] as const,
  },
  departments: {
    all: ['departments'] as const,
    list: ['departments', 'list'] as const,
    detail: (id: string) => ['departments', id] as const,
  },
  payroll: {
    all: ['payroll'] as const,
    runs: ['payroll', 'runs'] as const,
    slips: (employeeId?: string) => ['payroll', 'slips', employeeId] as const,
  },
  dashboard: {
    metrics: ['dashboard', 'metrics'] as const,
    charts: ['dashboard', 'charts'] as const,
    activity: ['dashboard', 'activity'] as const,
  },
} as const
