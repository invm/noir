import { createCodeMirror, createEditorControlledValue } from "solid-codemirror";
import { createSignal } from "solid-js";
import { lineNumbers } from '@codemirror/view';
import { sql } from '@codemirror/lang-sql'
import { dracula } from '@uiw/codemirror-theme-dracula'
import { format } from 'sql-formatter';
import { EditIcon, FireIcon } from "../../UI/Icons";
import { t } from "i18next";
import { invoke } from '@tauri-apps/api';

export const QueryTextArea = (props: { query: string, updateQueryText: (s: string) => void }) => {
  const onInput = (q: string) => {
    props.updateQueryText(q)
    setCode(q)
  }

  const [code, setCode] = createSignal(props.query);
  const { ref, editorView, createExtension } = createCodeMirror({ onValueChange: onInput });
  createEditorControlledValue(editorView, code);
  createExtension(() => lineNumbers());
  createExtension(() => sql());
  createExtension(dracula);

  const onFormat = () => {
    const formatted = format(code())
    onInput(formatted)
  }

  const onExecute = async () => {
    await invoke('execute_query', { query: code() })
  }

  return (
    <div class="flex-1 flex flex-col ">
      <div class="w-full p-1">
        <div class="tooltip tooltip-primary" data-tip={t('components.console.actions.format')}>
          <button class="btn btn-ghost btn-sm" onClick={() => onFormat()}><EditIcon /></button>
        </div>
        <div class="tooltip tooltip-primary" data-tip={t('components.console.actions.execute')}>
          <button class="btn btn-ghost btn-sm" onClick={() => onExecute()}><FireIcon /></button>
        </div>
      </div>
      <div class="overflow-hidden w-full h-full">
        <div ref={ref} class="w-full h-full" />
      </div>
    </div>
  )
}
