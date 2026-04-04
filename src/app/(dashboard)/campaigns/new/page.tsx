'use client';

import { PageHeader } from '@/components/shared/page-header';
import { CampaignForm } from '../campaign-form';

export default function NewCampaignPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Neue Kampagne erstellen"
        description="Neue Kampagne anlegen"
      />
      <CampaignForm />
    </div>
  );
}
