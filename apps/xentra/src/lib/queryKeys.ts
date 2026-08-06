export const queryKeys = {
  claims: {
    all: ['claims'] as const,
    byUser: (userId: string) => ['claims', 'user', userId] as const,
    byId: (id: string) => ['claims', id] as const,
  },
  employees: {
    all: ['employees'] as const,
    byId: (id: string) => ['employees', id] as const,
  },
  departments: {
    all: ['departments'] as const,
    byId: (id: string) => ['departments', id] as const,
  },
  attendance: {
    all: ['attendance'] as const,
    byDate: (date: string) => ['attendance', date] as const,
  },
  leave: {
    all: ['leave'] as const,
    byUser: (userId: string) => ['leave', 'user', userId] as const,
  },
}
