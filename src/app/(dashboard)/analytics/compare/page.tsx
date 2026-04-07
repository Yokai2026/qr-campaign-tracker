import dynamic from 'next/dynamic';
import { ChartSkeleton } from '@/components/shared/loading-skeleton';

const CompareClient = dynamic(() => import('./compare-client').then((m) => m.CompareClient), {
  ssr: false,
  loading: () => <ChartSkeleton />,
});

export default function ComparePage() {
  return <CompareClient />;
}
