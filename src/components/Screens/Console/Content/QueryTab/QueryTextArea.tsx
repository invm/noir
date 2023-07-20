import { createCodeMirror, createEditorControlledValue } from "solid-codemirror";
import { createEffect, createSignal } from "solid-js";
import { lineNumbers } from '@codemirror/view';
import { sql } from '@codemirror/lang-sql'
import { dracula } from '@uiw/codemirror-theme-dracula'
import { format } from 'sql-formatter';
import { t } from "i18next";
import { invoke } from '@tauri-apps/api';
import { EditIcon, FireIcon } from "components/UI/Icons";
import { useAppSelector } from "services/Context";
import { ContentTab, ContentTabData } from "services/ConnectionTabs";
import { QueryResult } from "interfaces";

export const QueryTextArea = () => {
  const { connectionsService: { setActiveContentQueryTabData, contentStore,
    setContentStore, getActiveConnection, getActiveContentTab } } =
    useAppSelector()

  const updateQueryText = async (query: string) => {
    setContentStore('tabs', contentStore.tabs.map((t, idx) => idx === contentStore.idx ? {
      ...t,
      data: { ...t.data, query }
    } as ContentTab<'QueryTab'> : t))
  }

  const onInput = (q: string) => {
    updateQueryText(q)
    setCode(q)
  }

  const [code, setCode] = createSignal('');
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
    const activeConnection = getActiveConnection()
    const { result } = await invoke<QueryResult>('execute_query', { connId: activeConnection.id, query: code() })
    setActiveContentQueryTabData({ data: { query: code, results: result } })
  }

  createEffect(() => {
    setCode((getActiveContentTab()?.data as ContentTabData['QueryTab']).query ?? '')
  })

  return (
    <div class="flex-1 flex flex-col">
      <div class="w-full p-1 bg-base-100">
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
