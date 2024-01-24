import { Show } from 'solid-js';
import { t } from 'utils/i18n';
import { AddIcon } from './Icons';

type FilePickerProps = {
  onChange: () => void;
  name: string;
  onCreate?: () => void;
};

export const FilePicker = (props: FilePickerProps) => {
  return (
    <div class="join w-full block flex">
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
    </div>
  );
};
