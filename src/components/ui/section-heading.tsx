import { cn } from '@/lib/utils';

type Props = {
  /** Primary heading text. */
  children: React.ReactNode;
  /** Optional muted accent appended inline (shown in lighter weight + muted color). */
  accent?: React.ReactNode;
  /** `as` element — defaults to h2. Use h1 for hero. */
  as?: 'h1' | 'h2' | 'h3';
  className?: string;
  /** Center-align, default true. */
  align?: 'center' | 'left';
  /** Max line-length helper — text-balance applies when true. */
  balance?: boolean;
};

const SIZES: Record<NonNullable<Props['as']>, string> = {
  h1: 'text-[40px] sm:text-[56px] md:text-[68px] leading-[1.02]',
  h2: 'text-[30px] sm:text-[40px] md:text-[44px] leading-[1.08]',
  h3: 'text-[22px] sm:text-[26px] leading-[1.15]',
};

export function SectionHeading({
  children,
  accent,
  as: Tag = 'h2',
  className,
  align = 'center',
  balance = true,
}: Props) {
  return (
    <Tag
      className={cn(
        'font-heading font-bold tracking-[-0.025em] text-foreground',
        SIZES[Tag],
        balance && 'text-balance',
        align === 'center' && 'text-center',
        className,
      )}
    >
      {children}
      {accent && (
        <>
          {' '}
          <span className="font-normal text-muted-foreground">
            {accent}
          </span>
        </>
      )}
    </Tag>
  );
}
