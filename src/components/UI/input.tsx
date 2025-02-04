import { splitProps } from 'solid-js';
import { JSX, Component } from 'solid-js';
import { cn } from 'utils/cn';

export interface InputProps extends JSX.InputHTMLAttributes<HTMLInputElement> {
  class?: string;
}

export const Input: Component<InputProps> = (props) => {
  const [local, rest] = splitProps(props, ['class', 'type']);
  return (
    <input
      type={local.type}
      class={cn(
        'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm'
      )}
      {...rest}
    />
  );
};
