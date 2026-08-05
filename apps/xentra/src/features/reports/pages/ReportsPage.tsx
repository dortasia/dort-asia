import React from 'react'
import { PageContainer } from '@/components/layout/PageContainer'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Icon } from '@iconify/react'

export function ReportsPage() {
  return (
    <PageContainer
      title="Analytics & HR Reports"
      description="Singapore CPF compliance reports, turnover metrics, and audit logs."
      action={
        <Button size="sm">
          <Icon icon="lucide:file-spreadsheet" className="w-4 h-4 mr-2" />
          Generate Custom Report
        </Button>
      }
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <Card className="p-5 border border-border">
          <Icon icon="lucide:landmark" className="w-8 h-8 text-primary mb-2" />
          <h3 className="font-semibold text-foreground">Monthly CPF Submission File</h3>
          <p className="text-xs text-muted-foreground mt-1">Generate CPF PAL / FTP text file for Singapore Central Provident Fund Board.</p>
          <Button variant="outline" size="sm" className="mt-4">Download .txt File</Button>
        </Card>
        <Card className="p-5 border border-border">
          <Icon icon="lucide:file-text" className="w-8 h-8 text-emerald-500 mb-2" />
          <h3 className="font-semibold text-foreground">IR8A Tax Form Generator</h3>
          <p className="text-xs text-muted-foreground mt-1">Generate IRAS IR8A electronic filing data for Singapore tax assessment.</p>
          <Button variant="outline" size="sm" className="mt-4">Generate Forms</Button>
        </Card>
      </div>
    </PageContainer>
  )
}
