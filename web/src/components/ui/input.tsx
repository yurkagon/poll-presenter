import * as React from 'react';
import { cn } from '@/lib/utils';

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        'w-full rounded-xl border-[1.5px] border-[#e4e8eb] bg-[#fafbfc] px-3.5 py-3 font-sans text-sm text-ink outline-none transition-colors focus:border-accent-blue focus:bg-white',
        className,
      )}
      {...props}
    />
  ),
);
Input.displayName = 'Input';

export { Input };
