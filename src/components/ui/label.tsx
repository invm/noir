import { splitProps } from 'solid-js';
import { JSX, Component } from 'solid-js';
import { cn } from 'utils/cn';

export interface LabelProps extends JSX.LabelHTMLAttributes<HTMLLabelElement> {
  class?: string;
}

const Label: Component<LabelProps> = (props) => {
  const [local, rest] = splitProps(props, ['class']);

  return (
    <label
      class={cn(
        'text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70',
        local.class
      )}
      {...rest}
    />
  );
};

export { Label };
