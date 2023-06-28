import { FieldProps, Field } from 'solid-form-handler';
import { Component, JSX, Show, splitProps } from 'solid-js';
import { Label } from '.';

export type TextInputProps = JSX.InputHTMLAttributes<HTMLInputElement> &
  FieldProps & { label?: string };

export const TextInput: Component<TextInputProps> = (props) => {
  const [local, rest] = splitProps(props, [
    'classList',
    'label',
    'formHandler',
  ]);

  return (
    <Field
      {...props}
      mode="input"
      render={(field) => (
        <div classList={local.classList}>
          <Show when={local.label}>
            <div class="my-1 block">
              <Label for={field.props.id ?? ''} value={local.label} />
            </div>
          </Show>
          <input type={props.type ?? 'text'} class="app-input"
            {...rest}
            {...field.props}
            classList={{
              'is-invalid': field.helpers.error,
              'form-control': true,
            }}
          />
        </div>
      )}
    />
  );
};

