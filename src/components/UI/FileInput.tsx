import { Field, FieldProps } from 'solid-form-handler';
import { Component, JSX, Show, splitProps } from 'solid-js';
import { Label } from '.';

export type FileInputProps = Omit<JSX.InputHTMLAttributes<HTMLInputElement>, 'type' | 'value'> &
  FieldProps & { label?: string } & ({ multiple?: false; value?: File } | { multiple?: true; value?: File[] });

export const FileInput: Component<FileInputProps> = (props) => {
  let fileInput: HTMLInputElement;
  const [local] = splitProps(props, ['classList', 'label', 'formHandler', 'multiple', 'value']);

  return (
    <Field
      {...props}
      mode="file-input"
      render={(field) => (
        <div classList={local.classList}>
          <Show when={local.label}>
            <div class="my-1 block">
              <Label for={field.props.id ?? ''} value={local.label} />
            </div>
          </Show>
          <input
            ref={fileInput}
            multiple={local.multiple}
            type="file"
            classList={{ 'hidden': true }}
            onChange={field.props.onChange}
          />
          <button
            onBlur={field.props.onBlur}
            classList={{ 'is-invalid': field.helpers.error }}
            type="button"
            onClick={() => fileInput?.click()}
          >
            <span class="p-2 border-end">Choose File</span>
          </button>
        </div>
      )}
    />
  );
};
