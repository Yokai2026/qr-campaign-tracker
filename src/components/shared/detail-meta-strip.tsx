import { cn } from '@/lib/utils';

type MetaItem = {
  label: string;
  value: React.ReactNode;
};

type DetailMetaStripProps = {
  items: MetaItem[];
  className?: string;
};

export function DetailMetaStrip({ items, className }: DetailMetaStripProps) {
  return (
    <div
      className={cn(
        'flex flex-wrap gap-x-6 gap-y-2 border-b border-border pb-4 text-[13px]',
        className,
      )}
    >
      {items.map((item) => (
        <div key={item.label} className="flex items-center gap-1.5">
          <span className="text-muted-foreground">{item.label}</span>
          <span className="font-medium">{item.value}</span>
        </div>
      ))}
    </div>
  );
}
