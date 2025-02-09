import { Show, createEffect, createSignal, on } from 'solid-js';
import { format } from 'sql-formatter';
import { invoke } from '@tauri-apps/api';
import {
  Copy,
  EditIcon,
  FireIcon,
  // VimIcon
} from 'components/UI-old/Icons';
import { useAppSelector } from 'services/Context';
import { QueryTaskEnqueueResult } from 'interfaces';
import { t } from 'utils/i18n';

import { createStore } from 'solid-js/store';
import { ActionRowButton } from './components/ActionRowButton';
// @ts-ignore
// import { initVimMode } from 'monaco-vim';

import * as monaco from 'monaco-editor';
import { QueryContentTabData } from 'services/Connections';
import { Editor } from './Editor';

interface EditorProps {
  readOnly?: boolean;
  value?: string;
}

export const QueryEditor = (props: EditorProps) => {
  const {
    connections: {
      store,
      updateContentTab,
      getConnection,
      getContentData,
      getSchemaEntity,
      getContent,
      queryIdx,
      updateResultSet,
    },
    app: {
      vimModeOn,
      // toggleVimModeOn
    },
    messages: { notify },
    backend: { cancelTask },
  } = useAppSelector();
  const idx = () => store.connections[store.idx].idx;
  const [code, setCode] = createSignal(props.value ?? '');
  const [schema, setSchema] = createStore({});
  const [loading, setLoading] = createSignal(false);
  const [autoLimit, setAutoLimit] = createSignal(true);
  // const [vimMode, setVimMode] = createSignal<any>(null);
  const [editor, setEditor] =
    createSignal<monaco.editor.IStandaloneCodeEditor>();

  // TODO: this was to persist the cursor position, should be implemented for monaco
  // const updateQuery = debounce(() => {
  //   updateContentTab('data', {
  //     query: code(),
  //     cursor: 0,
  //     // cursor: editorView()?.state.selection.ranges[0].from ?? 0,
  //   });
  // }, 300);

  const updateQueryText = (query: string) => {
    if (code() === query) return;
    setCode(query);
    // updateQuery();
  };

  const onFormat = () => {
    const formatted = format(code());
    setCode(formatted);
    updateQueryText(formatted);
  };

  // TODO:
  // const getSelection = () => {
  //   return editor()!.getSelection();
  // };

  const onExecute = async () => {
    if (loading() || !code()) return;
    setLoading(true);
    // const selectedText = getSelection();
    const conn = getConnection();
    try {
      // console.log(selectedText || code());
      const { result_sets } = await invoke<QueryTaskEnqueueResult>(
        'enqueue_query',
        {
          connId: conn.id,
          sql: code(),
          autoLimit: autoLimit(),
          tabIdx: conn.idx,
        }
      );
      updateContentTab('data', {
        query: code(),
        cursor: editor()!.getPosition()?.column,
        result_sets: result_sets.map((id) => ({
          loading: true,
          id,
        })),
      });
    } catch (error) {
      notify(error);
    } finally {
      setLoading(false);
    }
  };

  const copyQueryToClipboard = () => {
    navigator.clipboard.writeText(String(code()));
  };

  createEffect(() => {
    if (vimModeOn() && editor()) {
      // const vimm = initVimMode(editor());
    } else {
      // vimMode()?.dispose();
      // setVimMode(null);
    }
  });

  createEffect(
    on(idx, () => {
      const _schema = getSchemaEntity('tables').reduce(
        (acc, table) => ({
          ...acc,
          [table.name]: table.columns.map(({ name }) => name),
        }),
        {}
      );
      setSchema(_schema);
      const data = getContentData('Query');
      setCode(data.query ?? '');
      setAutoLimit(data.auto_limit ?? true);
    })
  );

  // const dummyAction = async () => {};

  return (
    <div class="flex-1 flex flex-col h-full">
      <div class="w-full border-b-2 border-accent flex justify-between items-center">
        <div class="flex items-center p-1 gap-2 bg-background ">
          <ActionRowButton
            dataTip={t('console.actions.format')}
            onClick={onFormat}
            icon={<EditIcon />}
          />
          <ActionRowButton
            dataTip={t('console.actions.execute')}
            onClick={onExecute}
            loading={loading()}
            icon={<FireIcon />}
          />

          <ActionRowButton
            dataTip={t('console.actions.copy_query')}
            onClick={copyQueryToClipboard}
            icon={<Copy />}
          />

          <div
            class="tooltip tooltip-primary tooltip-bottom"
            data-tip={t('console.actions.auto_limit')}
          >
            <div class="form-control">
              <label class="cursor-pointer label">
                <span class="label-text font-semibold mr-2 text-primary mt-1">
                  {t('console.actions.limit')}
                </span>
                <input
                  type="checkbox"
                  checked={autoLimit()}
                  onChange={(e) => setAutoLimit(e.target.checked)}
                  class="checkbox checkbox-sm checkbox-primary"
                />
              </label>
            </div>
          </div>

          {/* <div */}
          {/*   class="tooltip tooltip-primary tooltip-bottom" */}
          {/*   data-tip={t('console.actions.vim_mode_on')} */}
          {/* > */}
          {/*   <div class="flex items-center mx-2"> */}
          {/*     <span class="mr-2"> */}
          {/*       <VimIcon /> */}
          {/*     </span> */}
          {/*     <input */}
          {/*       type="checkbox" */}
          {/*       class="toggle toggle-sm" */}
          {/*       classList={{ */}
          {/*         'toggle-primary': vimModeOn(), */}
          {/*       }} */}
          {/*       checked={vimModeOn()} */}
          {/*       onChange={() => toggleVimModeOn()} */}
          {/*     /> */}
          {/*   </div> */}
          {/* </div> */}
        </div>
        <Show when={getContentData('Query').result_sets[queryIdx()]?.loading}>
          <div
            class="tooltip tooltip-error tooltip-left"
            data-tip={t('console.actions.cancel_all_queries')}
          >
            <button
              class="btn btn-error btn-xs"
              onClick={async () => {
                const ids = (
                  getContent().data as QueryContentTabData
                ).result_sets
                  .map((t) => t?.id ?? '')
                  .filter(Boolean);
                if (ids.length) {
                  await cancelTask(ids);
                  ids.forEach((_, i) => {
                    updateResultSet(store.idx, i, { loading: false });
                  });
                }
              }}
            >
              {t('console.actions.cancel')}
            </button>
          </div>
        </Show>
      </div>
      <div class="flex-1">
        <Editor
          language="sql"
          onMount={(_m, e) => {
            setEditor(e);

            e.addCommand(
              monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter,
              onExecute
            );
            e.addCommand(
              monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyE,
              onExecute
            );
            e.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyL, () =>
              editor()?.focus()
            );

            // either make this work or delete the shortcut from the shortcut list
            // e.addCommand(
            //   monaco.KeyMod.CtrlCmd |
            //     monaco.KeyMod.Shift |
            //     monaco.KeyCode.KeyE,
            //   onFormat
            // );
          }}
          onChange={updateQueryText}
          value={code()}
          schema={schema}
        />
      </div>
    </div>
  );
};
