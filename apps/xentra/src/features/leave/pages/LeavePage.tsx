import React from 'react'
import { PageContainer } from '@/components/layout/PageContainer'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Icon } from '@iconify/react'

export function LeavePage() {
  return (
    <PageContainer
      title="Leave & Time Off Management"
      description="Singapore MOM statutory annual leave, medical leave, and maternity/paternity tracking."
      action={
        <Button size="sm">
          <Icon icon="lucide:calendar-plus" className="w-4 h-4 mr-2" />
          Apply For Leave
        </Button>
      }
    >
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <Card className="p-5 border border-border">
          <span className="type-caption uppercase text-muted-foreground">Annual Leave Balance</span>
          <h3 className="type-h1 text-foreground mt-2">14 Days</h3>
          <p className="type-small text-muted-foreground mt-1">4 Days Taken / 18 Entitled</p>
        </Card>
        <Card className="p-5 border border-border">
          <span className="type-caption uppercase text-muted-foreground">Medical Leave</span>
          <h3 className="type-h1 text-foreground mt-2">12 Days</h3>
          <p className="type-small text-muted-foreground mt-1">2 Days Taken / 14 Entitled</p>
        </Card>
        <Card className="p-5 border border-border">
          <span className="type-caption uppercase text-muted-foreground">Child Care Leave</span>
          <h3 className="type-h1 text-foreground mt-2">6 Days</h3>
          <p className="type-small text-muted-foreground mt-1">0 Days Taken / 6 Entitled</p>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Pending Leave Approvals</CardTitle>
          <CardDescription>Requests awaiting your approval</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="divide-y divide-border">
            <div className="py-3.5 flex items-center justify-between">
              <div>
                <p className="type-body-medium font-semibold text-foreground">Sarah Chen &bull; Annual Leave</p>
                <p className="type-small text-muted-foreground">24 Aug 2026 - 26 Aug 2026 (3 Days)</p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="h-8">Reject</Button>
                <Button size="sm" className="h-8">Approve</Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </PageContainer>
  )
}
