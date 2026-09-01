import type { ElementType } from 'react';
import { cn } from '@/lib/utils';

type BrandWordmarkProps = {
  className?: string;
  as?: ElementType;
  name?: string;
};

/** One word, one tag. Lining figures keep 777 on the same line as the letters. */
export function BrandWordmark({
  className,
  as: Tag = 'span',
  name = 'VPOWER',
}: BrandWordmarkProps) {
  return (
    <Tag className={cn('brand-wordmark', className)}>
      {`${name}777`}
    </Tag>
  );
}
