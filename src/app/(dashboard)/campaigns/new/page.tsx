'use client';

import { PageHeader } from '@/components/shared/page-header';
import { CampaignForm } from '../campaign-form';

export default function NewCampaignPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Neue Kampagne erstellen"
        description="Legen Sie eine neue Kampagne an."
      />
      <CampaignForm />
    </div>
  );
}
