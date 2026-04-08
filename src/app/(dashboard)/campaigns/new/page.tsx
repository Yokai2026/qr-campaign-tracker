'use client';

import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/shared/page-header';
import { CampaignForm } from '../campaign-form';
import { checkFeatureAccess } from '@/lib/billing/check-access';
import { UpgradeBanner } from '@/components/shared/upgrade-banner';

export default function NewCampaignPage() {
  const [accessDenied, setAccessDenied] = useState(false);

  useEffect(() => {
    checkFeatureAccess('create').then(({ allowed }) => {
      if (!allowed) setAccessDenied(true);
    });
  }, []);

  if (accessDenied) {
    return (
      <div className="space-y-6">
        <PageHeader title="Neue Kampagne erstellen" description="Neue Kampagne anlegen" />
        <UpgradeBanner description="Um neue Kampagnen zu erstellen, benötigst du ein aktives Abo." />
      </div>
    );
  }

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
