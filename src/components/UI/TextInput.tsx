import { Component, JSX, Show } from 'solid-js';

export type TextInputProps = JSX.InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  errors?: string[] | null;
};

export const TextInput: Component<TextInputProps> = (props) => {
  return (
    <div class="flex flex-col w-full">
      <Show when={props.label}>
        <label for={props.name} class="my-1 block text-sm font-medium">
          {props.label}
        </label>
      </Show>
      <input
        type={props.type ?? 'text'}
        classList={{ 'border-red-400': !!props.errors }}
        class="input input-bordered input-sm w-full"
        autocorrect="off"
        autocapitalize="off"
        {...props}
      />
    </div>
  );
};
