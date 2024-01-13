import { createCodeMirror, createEditorControlledValue, createEditorFocus } from 'solid-codemirror';
import { createEffect, createSignal } from 'solid-js';
import { EditorView, drawSelection, highlightWhitespace, highlightActiveLine } from '@codemirror/view';
import { MySQL, sql, SQLite, PostgreSQL } from '@codemirror/lang-sql';

import { vim } from '@replit/codemirror-vim';
import { format } from 'sql-formatter';
import { invoke } from '@tauri-apps/api';
import { Copy, EditIcon, FireIcon, VimIcon } from 'components/UI/Icons';
import { useAppSelector } from 'services/Context';
import { Dialect, QueryTaskEnqueueResult } from 'interfaces';
import { t } from 'utils/i18n';
import { basicSetup } from 'codemirror';
import { createShortcut } from '@solid-primitives/keyboard';
import { search } from '@codemirror/search';
import { createStore } from 'solid-js/store';
import { ActionRowButton } from './components/ActionRowButton';
import { debounce } from 'utils/utils';
import { moveCompletionSelection } from '@codemirror/autocomplete';

import { androidstudio } from '@uiw/codemirror-theme-androidstudio';
import { andromeda } from '@uiw/codemirror-theme-andromeda';
import { atomone } from '@uiw/codemirror-theme-atomone';
import { copilot } from '@uiw/codemirror-theme-copilot';
import { dracula } from '@uiw/codemirror-theme-dracula';
import { githubDark, githubLight } from '@uiw/codemirror-theme-github';
import { gruvboxDark, gruvboxLight } from '@uiw/codemirror-theme-gruvbox-dark';
import { materialDark, materialLight, material } from '@uiw/codemirror-theme-material';
import { nord } from '@uiw/codemirror-theme-nord';
import { tokyoNight } from '@uiw/codemirror-theme-tokyo-night';
import { tokyoNightDay } from '@uiw/codemirror-theme-tokyo-night-day';
import { tokyoNightStorm } from '@uiw/codemirror-theme-tokyo-night-storm';
import { vscodeDark } from '@uiw/codemirror-theme-vscode';
import { EditorTheme } from 'services/App';

export const editorThemes = {
  'Android Studio': androidstudio,
  Dracula: dracula,
  'Github Dark': githubDark,
  'Github Light': githubLight,
  'Gruvbox Dark': gruvboxDark,
  'Gruvbox Light': gruvboxLight,
  'Material Dark': materialDark,
  'Material Light': materialLight,
  'Tokyo Night Day': tokyoNightDay,
  'Tokyo Night Storm': tokyoNightStorm,
  'Tokyo Night': tokyoNight,
  'VS Code': vscodeDark,
  Andromeda: andromeda,
  Atomone: atomone,
  Copilot: copilot,
  Material: material,
  Nord: nord,
};

const SQLDialects = {
  [Dialect.Mysql]: MySQL,
  [Dialect.Postgresql]: PostgreSQL,
  [Dialect.Sqlite]: SQLite,
};

export const Editor = (props: { editorTheme: EditorTheme }) => {
  const {
    connections: { connectionStore, updateContentTab, getConnection, getContentData, getSchemaEntity, contentStore },
    app: { vimModeOn, toggleVimModeOn },
    messages: { notify },
  } = useAppSelector();
  const [code, setCode] = createSignal('');
  const [schema, setSchema] = createStore({});
  const [loading, setLoading] = createSignal(false);
  const [autoLimit, setAutoLimit] = createSignal(true);

  const updateCursor = debounce(() => {
    updateContentTab('data', { query: code() });
  }, 300);

  const updateQueryText = (query: string) => {
    setCode(query);
    if (focused()) {
      updateContentTab('data', { cursor: editorView().state.selection.ranges[0].from });
    }
    updateCursor();
  };

  const { ref, editorView, createExtension } = createCodeMirror({
    value: code(),
    onValueChange: updateQueryText,
  });
  createEditorControlledValue(editorView, code);
  const lineWrapping = EditorView.lineWrapping;
  createExtension(lineWrapping);
  createExtension(drawSelection);
  createExtension(highlightWhitespace);
  createExtension(highlightActiveLine);
  createExtension(editorThemes[props.editorTheme]);
  createExtension(search);
  createExtension(basicSetup);
  createExtension(() => (vimModeOn() ? vim() : []));
  createExtension(() => sql({ dialect: SQLDialects[getConnection().connection.dialect], schema }));
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
    const activeConnection = getConnection();
    try {
      const { result_sets } = await invoke<QueryTaskEnqueueResult>('enqueue_query', {
        connId: activeConnection.id,
        sql: selectedText || code(),
        autoLimit: autoLimit(),
        tabIdx: contentStore.idx,
      });
      updateContentTab('data', {
        query: code(),
        cursor: editorView().state.selection.ranges[0].from,
        result_sets: result_sets.map((id) => ({
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
    navigator.clipboard.writeText(code());
  };

  createEffect(() => {
    const data = getContentData('Query');
    setCode(data.query ?? '');
    setAutoLimit(data.auto_limit ?? true);
  }, contentStore.idx);

  createEffect(() => {
    const _schema = getSchemaEntity('tables').reduce(
      (acc, table) => ({
        ...acc,
        [table.name]: table.columns.map(({ name }) => name),
      }),
      {}
    );
    setSchema(_schema);
  }, connectionStore.idx);

  createShortcut(['Control', 'k'], () => {
    if (focused() && vimModeOn()) {
      const fn = moveCompletionSelection(false);
      fn(editorView());
    }
  });

  createShortcut(['Control', 'j'], () => {
    if (focused() && vimModeOn()) {
      const fn = moveCompletionSelection(true);
      fn(editorView());
    }
  });

  createShortcut(['Control', 'e'], onExecute);
  createShortcut(['Control', 'Enter'], onExecute);
  createShortcut(['Meta', 'Enter'], onExecute);
  createShortcut(['Control', 'l'], () => setFocused(true));
  createShortcut(['Control', 'Shift', 'F'], onFormat);

  // const dummyAction = () => {
  // };

  return (
    <div class="flex-1 flex flex-col h-full">
      <div class="w-full px-2 py-1 bg-base-100 border-b-2 border-accent flex justify-between items-center">
        <div class="flex items-center">
          {/*
          <ActionRowButton dataTip={'Testing'} onClick={dummyAction} icon={<EditIcon />} />
           */}
          <ActionRowButton dataTip={t('console.actions.format')} onClick={onFormat} icon={<EditIcon />} />
          <ActionRowButton
            dataTip={t('console.actions.execute')}
            onClick={onExecute}
            loading={loading()}
            icon={<FireIcon />}
          />

          <ActionRowButton dataTip={t('console.actions.copy_query')} onClick={copyQueryToClipboard} icon={<Copy />} />

          <div class="tooltip tooltip-primary tooltip-bottom" data-tip={t('console.actions.auto_limit')}>
            <div class="form-control">
              <label class="cursor-pointer label">
                <span class="label-text font-semibold mr-2 text-primary mt-1">{t('console.actions.limit')}</span>
                <input
                  type="checkbox"
                  checked={autoLimit()}
                  onChange={(e) => setAutoLimit(e.target.checked)}
                  class="checkbox checkbox-sm checkbox-primary"
                />
              </label>
            </div>
          </div>

          <div class="tooltip tooltip-primary tooltip-bottom" data-tip={t('console.actions.vim_mode_on')}>
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
      </div>
      <div class="overflow-hidden w-full h-full">
        <div ref={ref} class="w-full h-full" />
      </div>
    </div>
  );
};
