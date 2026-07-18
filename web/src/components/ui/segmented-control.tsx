import { cn } from '@/lib/utils';

interface SegmentedControlProps<T extends string> {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}

/** Dark segmented control used on the big-screen leaderboard. */
export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
}: SegmentedControlProps<T>) {
  return (
    <div className="mx-auto mb-3.5 flex w-fit gap-1 rounded-xl border border-white/[0.09] bg-white/[0.05] p-1">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={cn(
            'rounded-lg px-4 py-2 font-sans text-[12.5px] font-bold transition-all',
            value === o.value ? 'bg-white/15 text-white' : 'text-[#9db3c8]',
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
