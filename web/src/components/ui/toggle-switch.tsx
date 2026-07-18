import { cn } from '@/lib/utils';

export function ToggleSwitch({
  on,
  onToggle,
}: {
  on: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={cn(
        'relative h-[25px] w-[42px] flex-shrink-0 rounded-full transition-colors',
        on ? 'bg-accent-green' : 'bg-[#dfe3e7]',
      )}
    >
      <span
        className={cn(
          'absolute top-[3px] h-[19px] w-[19px] rounded-full bg-white shadow transition-all',
          on ? 'left-[20px]' : 'left-[3px]',
        )}
      />
    </button>
  );
}
