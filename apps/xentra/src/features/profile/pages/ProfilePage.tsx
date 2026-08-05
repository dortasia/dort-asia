import React from 'react'
import { PageContainer } from '@/components/layout/PageContainer'
import { useAuthStore } from '@/store/useAuthStore'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'

export function ProfilePage() {
  const user = useAuthStore((state) => state.user)

  return (
    <PageContainer title="My Profile" description="Manage personal account settings and security.">
      <Card className="p-6">
        <div className="flex items-center gap-4">
          <Avatar className="w-16 h-16 border border-border">
            <AvatarImage src={user?.avatarUrl} alt={user?.fullName} />
            <AvatarFallback>{user?.fullName.slice(0, 2)}</AvatarFallback>
          </Avatar>
          <div>
            <h2 className="text-xl font-semibold text-foreground">{user?.fullName}</h2>
            <p className="text-sm text-muted-foreground">{user?.email}</p>
            <Badge variant="outline" className="mt-1">{user?.role}</Badge>
          </div>
        </div>
      </Card>
    </PageContainer>
  )
}
