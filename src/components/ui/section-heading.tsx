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
  h1: 'text-[40px] sm:text-[54px] md:text-[64px] leading-[1.04]',
  h2: 'text-[30px] sm:text-[38px] md:text-[44px] leading-[1.08]',
  h3: 'text-[22px] sm:text-[26px] leading-[1.18]',
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
        'font-heading font-semibold tracking-[-0.025em] text-foreground',
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
          <span className="font-normal text-foreground/55 dark:text-foreground/50">
            {accent}
          </span>
        </>
      )}
    </Tag>
  );
}
