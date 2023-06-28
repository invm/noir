import { FieldProps, Field } from 'solid-form-handler';
import {
  Component,
  createEffect,
  createSignal,
  For,
  JSX,
  Show,
  splitProps,
} from 'solid-js';
import { Label } from '.';

type SelectableOption = { value: string | number; label: string };

export type SelectProps = JSX.SelectHTMLAttributes<HTMLSelectElement> &
  FieldProps & {
    label?: string;
    options?: Array<SelectableOption>;
    placeholder?: string;
  };

export const Select: Component<SelectProps> = (props) => {
  const [local, rest] = splitProps(props, [
    'placeholder',
    'options',
    'label',
    'classList',
    'class',
    'formHandler',
  ]);
  const [options, setOptions] = createSignal<SelectableOption[]>([]);

  /**
   * Computes the select options by using the placeholder and options props.
   */
  createEffect(() => {
    setOptions(() => [
      ...(local.placeholder ? [{ value: '', label: local.placeholder }] : []),
      ...(local.options || []),
    ]);
  });

  return (
    <Field
      {...props}
      mode="input"
      render={(field) => (
        <div class={local.class} classList={local.classList}>
          <Show when={local.label}>
            <div class="my-1 block">
              <Label for={field.props.id ?? ''} value={local.label} />
            </div>
          </Show>
          <select
            {...rest}
            {...field.props}
            class="app-select"
            classList={{ 'is-invalid': field.helpers.error }}
          >
            <For each={options()}>
              {(option) => (
                <option
                  value={option.value}
                  selected={option.value == field.props.value}
                >
                  {option.label}
                </option>
              )}
            </For>
          </select>
        </div>
      )}
    />
  );
};
