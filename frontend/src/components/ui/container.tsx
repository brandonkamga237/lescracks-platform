import { cn } from '@/lib/utils';

interface ContainerProps {
  children: React.ReactNode;
  className?: string;
}

/** The width and side gutters every redesigned section shares. */
export function Container({ children, className }: ContainerProps) {
  return <div className={cn('mx-auto w-full max-w-[1320px] px-4 sm:px-8', className)}>{children}</div>;
}
