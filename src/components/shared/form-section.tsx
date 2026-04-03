import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { cn } from '@/lib/utils';

type FormSectionCardProps = {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
};

export function FormSectionCard({
  title,
  description,
  children,
  className,
}: FormSectionCardProps) {
  return (
    <Card className={cn('border border-border', className)}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent className="space-y-4">{children}</CardContent>
    </Card>
  );
}

type FormRowProps = {
  children: React.ReactNode;
  cols?: 1 | 2 | 3;
  className?: string;
};

export function FormRow({ children, cols = 2, className }: FormRowProps) {
  return (
    <div
      className={cn(
        'grid gap-4',
        cols === 2 && 'sm:grid-cols-2',
        cols === 3 && 'sm:grid-cols-3',
        className,
      )}
    >
      {children}
    </div>
  );
}
