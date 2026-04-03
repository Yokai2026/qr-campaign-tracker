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
        'flex flex-wrap gap-x-5 gap-y-2.5 rounded-xl bg-muted/40 px-5 py-3.5 text-[13px]',
        className,
      )}
    >
      {items.map((item) => (
        <div key={item.label} className="flex items-center gap-1.5">
          <span className="text-muted-foreground/70">{item.label}</span>
          <span className="font-medium">{item.value}</span>
        </div>
      ))}
    </div>
  );
}
