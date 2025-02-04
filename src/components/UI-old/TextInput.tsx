import { Component, JSX, Show } from 'solid-js';
import { Label } from './Label';

export type TextInputProps = JSX.InputHTMLAttributes<HTMLInputElement> & {
  name: string;
  label?: string;
  errors?: string[] | null;
};

export const TextInput: Component<TextInputProps> = (props) => {
  return (
    <div class="flex flex-col w-full">
      <Show when={props.label}>
        <Label label={props.label!} for={props.name!} />
      </Show>
      <input
        type={props.type ?? 'text'}
        classList={{ 'border-red-400': !!props.errors }}
        class="input input-bordered border-base-content input-sm w-full"
        autocorrect="off"
        autocapitalize="off"
        {...props}
      />
    </div>
  );
};
