import { Show } from 'solid-js';
import { t } from 'utils/i18n';
import { AddIcon, CloseIcon } from './Icons';

type FilePickerProps = {
  onChange: () => void;
  name: string;
  onCreate?: () => void;
  onClear?: () => void;
};

export const FilePicker = (props: FilePickerProps) => {
  return (
    <div class="join w-full block flex relative">
      <button
        onClick={props.onChange}
        class="rounded-r-none btn hover:btn-accent btn-ghost hover:border-base-content btn-sm btn-bordered border-base-content">
        {t('file_input.choose_file')}
      </button>
      <Show when={props.onCreate}>
        <button
          onClick={props.onCreate}
          class="rounded-none btn hover:btn-accent btn-ghost hover:border-base-content btn-sm btn-bordered border-base-content">
          <AddIcon />
        </button>
      </Show>
      <input
        name={props.name}
        type="text"
        readonly
        onClick={props.onChange}
        placeholder="No file selected"
        class="input active input-bordered input-sm rounded-l-none flex-1 border-base-content"
      />
      <Show when={props.onClear}>
        <div class="absolute z-10 right-0">
          <button onClick={props.onClear} class="z-10 btn btn-sm btn-ghost px-2">
            <CloseIcon />
          </button>
        </div>
      </Show>
    </div>
  );
};
