import { Component, JSX, Show } from 'solid-js';
import { titleCase } from 'utils/formatters';

export type SelectProps = JSX.InputHTMLAttributes<HTMLSelectElement> & {
  label?: string;
  isInvalid?: boolean;
  options: string[];
  suppressTitlecase?: boolean;
};

export const Select: Component<SelectProps> = (props) => {
  return (
    <div class="flex flex-1 flex-col justify-between h-full">
      <Show when={props.label}>
        <label for={props.name} class="block text-sm font-medium">
          {props.label}
        </label>
      </Show>
      <select
        {...props}
        class="select select-bordered border-base-content select-sm w-full"
        classList={{ 'border-red-500': props.isInvalid }}>
        {props.options.map((opt) => (
          <option value={opt}>{props.suppressTitlecase ? opt : titleCase(opt)}</option>
        ))}
      </select>
    </div>
  );
};
