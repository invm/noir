import { Show } from 'solid-js';
import { t } from 'utils/i18n';
import { VsClose as CloseIcon } from 'solid-icons/vs';
import { FaSolidPlus as AddIcon } from 'solid-icons/fa';

type FilePickerProps = {
  onChange: () => void;
  name: string;
  onCreate?: () => void;
  onClear?: () => void;
};

export const FilePicker = (props: FilePickerProps) => {
  return (
    <div class="w-full flex relative border rounded-md h-8">
      <button class="px-2" onClick={props.onChange}>
        {t('file_input.choose_file')}
      </button>
      <Show when={props.onCreate}>
        <button class="px-2 border-r border-l" onClick={props.onCreate}>
          <AddIcon />
        </button>
      </Show>
      <input
        name={props.name}
        type="text"
        readonly
        onClick={props.onChange}
        placeholder="No file selected"
        class="flex-1 flex items-center px-2 relative bg-accent"
      />
      <Show when={props.onClear}>
        <div class="z-10 right-0">
          <button onClick={props.onClear} class="z-10 px-2 h-full bg-accent">
            <CloseIcon />
          </button>
        </div>
      </Show>
    </div>
  );
};
