import { Show, createEffect, createSignal, on } from 'solid-js';
import { format } from 'sql-formatter';
import { invoke } from '@tauri-apps/api';
import { HiSolidPlay as Play } from 'solid-icons/hi';
import { IoCopyOutline as Copy } from 'solid-icons/io';
import { CgFormatIndentIncrease as EditIcon } from 'solid-icons/cg';
import { useAppSelector } from 'services/Context';
import { QueryTaskEnqueueResult } from 'interfaces';
import { t } from 'utils/i18n';
import { createStore } from 'solid-js/store';
import { ActionRowButton } from './components/ActionRowButton';
import { CgInfo } from 'solid-icons/cg';

import * as monaco from 'monaco-editor';
import { QueryContentTabData } from 'services/Connections';
import { Editor } from './Editor';
import { toast } from 'solid-sonner';
import { Tooltip, TooltipContent, TooltipTrigger } from 'components/ui/tooltip';
import { Button } from 'components/ui/button';
import { CommandPaletteContextWrapper } from 'services/palette/wrapper';
import { ActionGroup, useCommandPalette } from 'services/palette/context';
import { ToggleButton } from 'components/ui/toggle';
import { TooltipTriggerProps } from '@kobalte/core/tooltip';

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
      appStore,
      // toggleVimModeOn
    },
    backend: { cancelTask },
  } = useAppSelector();
  const idx = () => store.connections[store.idx].idx;
  const [code, setCode] = createSignal(props.value ?? '');
  const [schema, setSchema] = createStore({});
  const [loading, setLoading] = createSignal(false);
  const [autoLimit, setAutoLimit] = createSignal(true);
  const [tabFocusMode, setTabFocusMode] = createSignal(false);
  // const [vimMode, setVimMode] = createSignal<any>(null);
  const [editor, setEditor] =
    createSignal<monaco.editor.IStandaloneCodeEditor>();

  const { setOpen } = useCommandPalette();

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

  const getSelection = () => {
    return editor()!.getModel()?.getValueInRange(editor()!.getSelection()!);
  };

  const onExecute = async () => {
    if (loading() || !code()) return;
    setLoading(true);
    const selectedText = getSelection();
    const conn = getConnection();
    try {
      const sql = selectedText || code();
      const { result_sets } = await invoke<QueryTaskEnqueueResult>(
        'enqueue_query',
        {
          connId: conn.id,
          sql,
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
      toast.error('Could not enqueue query', {
        description: (error as Error).message || (error as string),
      });
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

  const commandPaletteGroup: ActionGroup[] = [
    {
      id: 'editor',
      label: 'Editor',
      actions: [
        {
          id: 'editor-focus',
          label: 'Focus on editor',
          callback: () => {
            editor()?.setPosition({ lineNumber: 1, column: 1 });
            window.requestAnimationFrame(() => {
              editor()?.focus();
            });
          },
        },
        {
          id: 'editor-execute-query',
          label: 'Execute query',
          callback: onExecute,
        },
        {
          id: 'editor-format-query',
          label: 'Format',
          callback: onFormat,
        },
      ],
    },
  ];

  return (
    <CommandPaletteContextWrapper groups={commandPaletteGroup}>
      <div class="flex-1 flex flex-col h-full">
        <div class="w-full border-b-2 border-accent flex justify-between items-center p-1 px-2">
          <div class="flex items-center gap-2 bg-background ">
            <ActionRowButton
              dataTip={t('console.actions.format')}
              onClick={onFormat}
              icon={<EditIcon class="size-5" />}
            />
            <ActionRowButton
              dataTip={t('console.actions.execute')}
              onClick={onExecute}
              loading={loading()}
              icon={<Play class="size-5" />}
            />

            <ActionRowButton
              dataTip={t('console.actions.copy_query')}
              onClick={copyQueryToClipboard}
              icon={<Copy class="size-5" />}
            />

            <Tooltip>
              <TooltipTrigger
                as={ToggleButton}
                class="rounded-md border-accent h-8 data-[pressed]:bg-primary"
                checked={autoLimit()}
                onChange={(e: boolean) => setAutoLimit(e)}
                size="sm"
              >
                {t('console.actions.limit')}
              </TooltipTrigger>
              <TooltipContent>{t('console.actions.auto_limit')}</TooltipContent>
            </Tooltip>
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

          <Tooltip>
            <TooltipTrigger
              as={(props: TooltipTriggerProps) => (
                <Button
                  size="sm"
                  class="flex gap-1"
                  variant={tabFocusMode() ? 'default' : 'outline'}
                  {...props}
                >
                  <CgInfo class="size-4" />
                  Tab Moves Focus
                </Button>
              )}
            />
            <TooltipContent>
              <p>
                Controls whether the editor receives tabs or defers them to the
                app for navigation.
                <br />
                Toggle this option when focused on the editor with{' '}
                {appStore.osType === 'Darwin' ? 'Ctrl+Shift+M' : 'Ctrl+M'}.
              </p>
            </TooltipContent>
          </Tooltip>
          <Show when={getContentData('Query').result_sets[queryIdx()]?.loading}>
            <Tooltip>
              <TooltipTrigger
                size="xs"
                variant="destructive"
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
                as={Button}
              >
                {t('console.actions.cancel')}
              </TooltipTrigger>
              <TooltipContent>
                {t('console.actions.cancel_all_queries')}
              </TooltipContent>
            </Tooltip>
          </Show>
        </div>
        <div class="flex-1">
          <Editor
            language="sql"
            onMount={(_m, e) => {
              setEditor(e);

              e.addAction({
                id: 'execute',
                label: 'Execute query',
                run: onExecute,
                keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter],
              });

              e.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyL, () =>
                editor()?.focus()
              );

              e.addAction({
                id: 'open-app-command-palette',
                label: 'Open Noir Command Palette',
                run: () => {
                  setOpen((s) => !s);
                },
                keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyK],
              });

              e.onKeyDown((e) => {
                if (
                  e.shiftKey &&
                  e.ctrlKey &&
                  e.keyCode === monaco.KeyCode.KeyM
                ) {
                  setTabFocusMode(!tabFocusMode());
                }
              });
            }}
            onChange={updateQueryText}
            value={code()}
            schema={schema}
          />
        </div>
      </div>
    </CommandPaletteContextWrapper>
  );
};
