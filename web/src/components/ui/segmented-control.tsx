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
    <div className="mx-auto mb-[0.5vw] flex w-fit gap-[0.4vw] rounded-xl border border-white/[0.09] bg-white/[0.05] p-[0.3vw]">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={cn(
            'rounded-lg px-[1.1vw] py-[0.5vw] font-sans text-[clamp(0.85rem,1vw,1.15rem)] font-bold transition-all',
            value === o.value ? 'bg-white/15 text-white' : 'text-[#9db3c8]',
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
