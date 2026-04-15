import { cn } from '@/lib/utils';

type Props = {
  /** First part — rendered in sans-bold. */
  children: React.ReactNode;
  /** Optional serif-italic accent appended inline. */
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
        'font-sans font-semibold tracking-[-0.02em] text-foreground',
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
          <span className="font-display font-normal italic tracking-[-0.01em] text-primary">
            {accent}
          </span>
        </>
      )}
    </Tag>
  );
}
