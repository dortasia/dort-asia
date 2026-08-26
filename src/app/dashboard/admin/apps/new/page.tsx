import { Metadata } from 'next';
import { AddAppWizard } from '@/components/admin/apps/AddAppWizard';

export const metadata: Metadata = {
  title: 'Add New Application | Dort Asia Admin',
  description: 'Create and configure a new Marketplace application',
};

export default function AddNewAppPage() {
  return (
    <div className="py-2">
      <AddAppWizard />
    </div>
  );
}
