import {
  createCodeMirror,
  createEditorControlledValue,
  createEditorFocus,
} from 'solid-codemirror';
import { createEffect, createSignal, Show } from 'solid-js';
import {
  EditorView,
  drawSelection,
  highlightWhitespace,
  highlightActiveLine,
} from '@codemirror/view';
import { MySQL, sql, SQLite, PostgreSQL } from '@codemirror/lang-sql';
import { dracula } from '@uiw/codemirror-theme-dracula';
import { vim } from '@replit/codemirror-vim';
import { format } from 'sql-formatter';
import { invoke } from '@tauri-apps/api';
import { Copy, EditIcon, FireIcon, VimIcon } from 'components/UI/Icons';
import { useAppSelector } from 'services/Context';
import { QueryTaskEnqueueResult, Dialect } from 'interfaces';
import { t } from 'utils/i18n';
import { Alert } from 'components/UI';
import { basicSetup } from 'codemirror';
import { createShortcut } from '@solid-primitives/keyboard';
import { search } from '@codemirror/search';
import { createStore } from 'solid-js/store';
import { ActionRowButton } from './components/ActionRowButton';

const SQLDialects = {
  [Dialect.Mysql]: MySQL,
  [Dialect.Postgres]: PostgreSQL,
  [Dialect.Sqlite]: SQLite,
};

export const QueryTextArea = () => {
  const {
    connections: {
      updateContentTab,
      getConnection,
      getContent,
      getContentData,
      getSchemaTables,
      contentStore: { idx: tabIdx },
    },
    app: { vimModeOn, toggleVimModeOn },
  } = useAppSelector();
  const [code, setCode] = createSignal('');
  const [schema, setSchema] = createStore({});
  const [loading, setLoading] = createSignal(false);
  const [autoLimit, setAutoLimit] = createSignal(true);

  const updateQueryText = async (query: string) => {
    updateContentTab('data', { query });
  };

  const { ref, editorView, createExtension } = createCodeMirror({
    onValueChange: setCode,
  });
  createEditorControlledValue(editorView, code);
  createExtension(drawSelection);
  createExtension(highlightWhitespace);
  createExtension(highlightActiveLine);
  createExtension(dracula);
  createExtension(search);
  createExtension(() => basicSetup);
  createExtension(() => (vimModeOn() ? vim() : []));
  createExtension(() =>
    sql({ dialect: SQLDialects[getConnection().connection.dialect], schema })
  );
  const { setFocused } = createEditorFocus(editorView);
  // TODO: add option to scroll inside autocompletion list with c-l and c-k
  // defaultKeymap.push({ keys: "gq", type: "operator", operator: "hardWrap" });
  // Vim.defineOperator(
  //   "hardWrap",
  //   function(cm, operatorArgs, ranges, oldAnchor, newHead) {
  //     console.log('hardwrap')
  //   }
  // );

  const lineWrapping = EditorView.lineWrapping;
  createExtension(lineWrapping);

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
    updateContentTab('error', undefined);
    const activeConnection = getConnection();
    try {
      const { result_sets } = await invoke<QueryTaskEnqueueResult>(
        'enqueue_query',
        {
          connId: activeConnection.id,
          sql: selectedText || code(),
          autoLimit: autoLimit(),
          tabIdx,
        }
      );
      updateContentTab('data', {
        query: code(),
        result_sets: result_sets.map((id) => ({
          id,
        })),
      });
    } catch (error) {
      updateContentTab('error', String(error));
    } finally {
      setLoading(false);
    }
  };

  const copyQueryToClipboard = () => {
    navigator.clipboard.writeText(code());
  };

  createEffect(() => {
    setCode(getContentData('Query').query ?? '');
    setSchema(
      getSchemaTables().reduce(
        (acc, table) => ({
          ...acc,
          [table.name]: table.columns.map(({ name }) => name),
        }),
        {}
      )
    );
  });

  createShortcut(['Control', 'e'], onExecute);
  createShortcut(['Control', 'l'], () => setFocused(true));
  createShortcut(['Control', 'Shift', 'F'], onFormat);

  const onTestClick = () => {
    console.log(getContentData('Query'));
  }

  return (
    <div class="flex-1 flex flex-col">
      <div class="w-full px-2 py-1 bg-base-100 border-b-2 border-accent flex justify-between items-center">
        <div class="flex items-center">
          <ActionRowButton
            dataTip={'Testing'}
            onClick={onTestClick}
            icon={<EditIcon />}
          />
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
        <Show when={getContent().error}>
          <Alert color="error">{getContent().error}</Alert>
        </Show>
      </div>
      <div class="overflow-hidden w-full h-full">
        <div ref={ref} class="w-full h-full" />
      </div>
    </div>
  );
};
