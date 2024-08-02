import {
  createCodeMirror,
  createEditorControlledValue,
  createEditorFocus,
} from 'solid-codemirror';
import { Show, createEffect, createSignal, on } from 'solid-js';
import { EditorView } from '@codemirror/view';
import { MySQL, sql, SQLite, PostgreSQL, MariaSQL } from '@codemirror/lang-sql';

import { vim } from '@replit/codemirror-vim';
import { format } from 'sql-formatter';
import { invoke } from '@tauri-apps/api';
import { Copy, EditIcon, FireIcon, VimIcon } from 'components/UI/Icons';
import { useAppSelector } from 'services/Context';
import { Dialect, QueryTaskEnqueueResult } from 'interfaces';
import { t } from 'utils/i18n';
import { createShortcut } from '@solid-primitives/keyboard';
import { createStore } from 'solid-js/store';
import { ActionRowButton } from './components/ActionRowButton';
import { debounce } from 'utils/utils';
import {
  moveCompletionSelection,
  autocompletion,
} from '@codemirror/autocomplete';

import { EditorTheme } from 'services/App';
import { editorThemes } from './components/EditorThemes';
import { basicSetup } from './components/EditorExtensions';
import { QueryContentTabData } from 'services/Connections';

const SQLDialects = {
  [Dialect.Mysql]: MySQL,
  [Dialect.MariaDB]: MariaSQL,
  [Dialect.Postgresql]: PostgreSQL,
  [Dialect.Sqlite]: SQLite,
};

export const Editor = (props: { editorTheme: EditorTheme }) => {
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
    app: { vimModeOn, toggleVimModeOn },
    messages: { notify },
    backend: { cancelTask },
  } = useAppSelector();
  const idx = () => store.tabs[store.idx].idx;
  const [code, setCode] = createSignal('');
  const [schema, setSchema] = createStore({});
  const [loading, setLoading] = createSignal(false);
  const [autoLimit, setAutoLimit] = createSignal(true);

  const updateQuery = debounce(() => {
    updateContentTab('data', {
      query: code(),
      cursor: editorView()?.state.selection.ranges[0].from ?? 0,
    });
  }, 300);

  const updateQueryText = (query: string) => {
    if (code() === query) return;
    setCode(query);
    updateQuery();
  };

  const { ref, editorView, createExtension } = createCodeMirror({
    value: code(),
    onValueChange: updateQueryText,
  });
  createEditorControlledValue(editorView, code);
  const lineWrapping = EditorView.lineWrapping;
  createExtension(lineWrapping);
  createExtension(editorThemes[props.editorTheme]);
  createExtension(basicSetup);
  createExtension(autocompletion);
  createExtension(() => (vimModeOn() ? vim() : []));
  createExtension(() =>
    sql({ dialect: SQLDialects[getConnection().connection.dialect], schema })
  );
  const { setFocused, focused } = createEditorFocus(editorView);

  const onFormat = () => {
    const formatted = format(code());
    setCode(formatted);
    updateQueryText(formatted);
  };

  const getSelection = () => {
    return editorView().state.sliceDoc(
      editorView().state.selection.ranges[0].from,
      editorView().state.selection.ranges[0].to
    );
  };

  const onExecute = async () => {
    if (loading() || !code()) return;
    setLoading(true);
    const selectedText = getSelection();
    const conn = getConnection();
    try {
      const { result_sets } = await invoke<QueryTaskEnqueueResult>(
        'enqueue_query',
        {
          connId: conn.id,
          sql: selectedText || code(),
          autoLimit: autoLimit(),
          tabIdx: conn.idx,
        }
      );
      updateContentTab('data', {
        query: code(),
        cursor: editorView().state.selection.ranges[0].from,
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

  createShortcut(['Control', 'p'], () => {
    if (focused() && vimModeOn()) {
      const fn = moveCompletionSelection(false);
      fn(editorView());
    }
  });

  createShortcut(['Control', 'n'], () => {
    if (focused() && vimModeOn()) {
      const fn = moveCompletionSelection(true);
      fn(editorView());
    }
  });

  createShortcut(['Control', 'e'], () => {
    if (focused() && vimModeOn()) {
      onExecute();
    }
  });

  createShortcut(['Control', 'e'], onExecute);
  createShortcut(['Control', 'Enter'], onExecute);
  createShortcut(['Control', 'l'], () => setFocused(true));
  createShortcut(['Control', 'Shift', 'F'], onFormat);

  // const dummyAction = async () => {};

  return (
    <div class="flex-1 flex flex-col h-full">
      <div class="w-full px-2 py-1 bg-base-100 border-b-2 border-accent flex justify-between items-center">
        <div class="flex items-center">
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

          <div
            class="tooltip tooltip-primary tooltip-bottom"
            data-tip={t('console.actions.vim_mode_on')}
          >
            <div class="flex items-center mx-2">
              <span class="mr-2">
                <VimIcon />
              </span>
              <input
                type="checkbox"
                class="toggle toggle-sm"
                classList={{
                  'toggle-primary': vimModeOn(),
                }}
                checked={vimModeOn()}
                onChange={() => toggleVimModeOn()}
              />
            </div>
          </div>
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
      <div class="overflow-hidden w-full h-full">
        <div ref={ref} class="w-full h-full" />
      </div>
    </div>
  );
};
