import { Suspense } from 'react';
import { ChartSkeleton } from '@/components/shared/loading-skeleton';
import { CompareClient } from './compare-client';

export default function ComparePage() {
  return (
    <Suspense fallback={<ChartSkeleton />}>
      <CompareClient />
    </Suspense>
  );
}
