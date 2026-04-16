import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';

type BreadcrumbEntry = {
  label: string;
  href?: string;
};

type PageHeaderProps = {
  title: string;
  description?: string;
  actionLabel?: string;
  actionHref?: string;
  action?: React.ReactNode;
  badge?: React.ReactNode;
  breadcrumbs?: BreadcrumbEntry[];
  className?: string;
};

export function PageHeader({
  title,
  description,
  actionLabel,
  actionHref,
  action,
  badge,
  breadcrumbs,
  className,
}: PageHeaderProps) {
  return (
    <div className={cn('space-y-1', className)}>
      {breadcrumbs && breadcrumbs.length > 0 && (
        <Breadcrumb className="mb-1">
          <BreadcrumbList className="text-[12px]">
            {breadcrumbs.map((crumb, i) => {
              const isLast = i === breadcrumbs.length - 1;
              return (
                <span key={crumb.label} className="contents">
                  {i > 0 && <BreadcrumbSeparator />}
                  <BreadcrumbItem>
                    {isLast ? (
                      <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
                    ) : (
                      <BreadcrumbLink render={<Link href={crumb.href ?? '#'} />}>
                        {crumb.label}
                      </BreadcrumbLink>
                    )}
                  </BreadcrumbItem>
                </span>
              );
            })}
          </BreadcrumbList>
        </Breadcrumb>
      )}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2.5">
            <h1 className="text-[22px] font-semibold tracking-[-0.015em] sm:text-[24px]">{title}</h1>
            {badge}
          </div>
          {description && (
            <p className="mt-1 text-[13.5px] text-muted-foreground">{description}</p>
          )}
        </div>
        {action}
        {!action && actionLabel && actionHref && (
          <Button
            variant="brand"
            size="sm"
            className="self-start"
            render={<Link href={actionHref} />}
          >
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            {actionLabel}
          </Button>
        )}
      </div>
    </div>
  );
}
