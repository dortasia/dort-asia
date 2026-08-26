import { Metadata } from 'next';
import { AddAppWizard } from '@/components/admin/apps/AddAppWizard';

export const metadata: Metadata = {
  title: 'Edit Application | Dort Asia Admin',
  description: 'Modify and update Marketplace application configuration',
};

export default async function EditAppPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  return (
    <div className="py-2">
      <AddAppWizard existingAppId={params.id} />
    </div>
  );
}
