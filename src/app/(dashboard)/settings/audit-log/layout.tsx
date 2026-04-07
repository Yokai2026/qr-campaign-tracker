import { requireAdmin } from '@/lib/auth';

export default async function AuditLogLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Server-side admin check — redirects non-admins to /dashboard
  await requireAdmin();
  return <>{children}</>;
}
