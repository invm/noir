import { TbLoader3 } from 'solid-icons/tb';
import { cn } from 'utils/cn';

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
}

export function Loader(props: SpinnerProps) {
  return (
    <TbLoader3
      class={cn('animate-spin', {
        'h-4 w-4': props.size === 'sm',
        'h-6 w-6': props.size === 'md',
        'h-8 w-8': props.size === 'lg',
      })}
    />
  );
}
