import { Show, createEffect, createSignal, on } from 'solid-js';
import { format } from 'sql-formatter';
import { invoke } from '@tauri-apps/api/core';
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
import { Kbd } from 'components/ui/kbd';
import { createShortcut } from '@solid-primitives/keyboard';
import { intersection } from 'utils/utils';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogClose,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from 'components/ui/alert-dialog';

export const QueryEditor = () => {
  const {
    connections: {
      store,
      getConnection,
      getContentData,
      getSchemaEntity,
      getContent,
      queryIdx,
      updateResultSet,
      updateDataContentTab,
    },
    app: { appStore, cmdOrCtrl },
    backend: { cancelTask },
  } = useAppSelector();
  const [schema, setSchema] = createStore({});
  const [loading, setLoading] = createSignal(false);
  const [tabFocusMode, setTabFocusMode] = createSignal(false);
  const [alertDialogOpen, setAlertDialogOpen] = createSignal(false);
  const [editor, setEditor] =
    createSignal<monaco.editor.IStandaloneCodeEditor>();

  const tabIdx = () => getConnection().idx;
  const tabId = () => getContentData('Query').id;
  const connectionChanged = () => store.idx;
  const data = () => getContentData('Query');
  const { setOpen } = useCommandPalette();

  const updateQueryText = (query: string) => {
    if (data().query === query) return;
    updateDataContentTab('query', query, tabIdx());
  };

  const onFormat = () => {
    updateDataContentTab('query', format(data().query), tabIdx());
  };

  const getSelection = () => {
    return editor()!.getModel()?.getValueInRange(editor()!.getSelection()!);
  };

  const enqueueQuery = async (connId: string, tabIdx: number, sql: string) => {
    setLoading(true);
    try {
      const { result_sets } = await invoke<QueryTaskEnqueueResult>(
        'enqueue_query',
        { connId, sql, autoLimit: data().autoLimit, tabIdx }
      );
      updateDataContentTab(
        'result_sets',
        result_sets.map((id) => ({ loading: true, id }))
      );
    } catch (error) {
      toast.error('Could not enqueue query', {
        description: (error as Error).message || (error as string),
      });
    }
    setLoading(false);
  };

  const getQuery = () => {
    const selectedText = getSelection();
    const conn = getConnection();
    const sql = selectedText || data().query;
    return { sql, conn };
  };

  const onExecute = async () => {
    const { sql, conn } = getQuery();
    if (loading() || !sql) return;
    if (!conn.connection.metadata.sensitive) {
      return enqueueQuery(conn.id, conn.idx, sql);
    }
    const queryTypes = await invoke<string[]>('sql_to_statements', {
      dialect: conn.connection.dialect,
      sql,
    });
    if (intersection(queryTypes, appStore.sensitiveQueries).length) {
      setAlertDialogOpen(true);
    } else {
      enqueueQuery(conn.id, conn.idx, sql);
    }
  };

  const copyQueryToClipboard = () => {
    navigator.clipboard.writeText(String(data().query));
  };

  createEffect(
    on(connectionChanged, () => {
      const schema = getSchemaEntity('tables').reduce(
        (acc, t) => ({ ...acc, [t.name]: t.columns.map(({ name }) => name) }),
        {}
      );
      setSchema(schema);
    })
  );

  const focusEditor = () => {
    window.requestAnimationFrame(() => {
      editor()?.focus();
    });
  };

  createShortcut([cmdOrCtrl(), 'L'], focusEditor);
  createShortcut([cmdOrCtrl(), 'Enter'], onExecute);
  createShortcut([cmdOrCtrl(), 'Shift', 'F'], onFormat);

  const commandPaletteGroup: ActionGroup[] = [
    {
      id: 'editor',
      label: 'Editor',
      actions: [
        {
          id: 'editor-focus',
          label: 'Focus on editor',
          callback: focusEditor,
          shortcut: <Kbd key="L" />,
        },
        {
          id: 'editor-execute-query',
          label: 'Execute query',
          callback: onExecute,
          shortcut: <Kbd key="Enter" />,
        },
        {
          id: 'editor-format-query',
          label: 'Format',
          callback: onFormat,
          shortcut: <Kbd shift key="F" />,
        },
      ],
    },
  ];

  // createEffect((prev: number | undefined) => {
  //   if (!editor()) return;
  //   const current = tabIdx();
  //   if (prev !== current && editor()) {
  //     const model = editor()?.getModel();
  //     const viewState = editor()?.saveViewState();
  //     const cursor = editor()?.getPosition();
  //     updateContentTab('data', { model: model!, viewState, cursor }, prev ?? 0);
  //     const saved = getContent(current).data as QueryContentTabData;
  //     if (saved?.model && !saved?.model.isDisposed()) {
  //       console.log('restoring model', saved.model?.getValue());
  //       editor()?.setModel(saved.model);
  //       if (saved.viewState) {
  //         editor()?.restoreViewState(saved.viewState);
  //       }
  //       editor()?.setPosition(saved.cursor!);
  //     }
  //   } else if (current === 0 && prev === undefined) {
  //     const model = editor()?.getModel();
  //     const viewState = editor()?.saveViewState();
  //     const cursor = editor()?.getPosition();
  //     updateContentTab('data', { model: model!, viewState, cursor }, prev ?? 0);
  //   }
  //   return current;
  // });

  // const insertTextAtCursor = (text: string) => {
  //   const { lineNumber, column } = editor()!.getPosition()!;
  //   const range = new monaco.Range(lineNumber, column, lineNumber, column);
  //   editor()?.executeEdits('insert-text', [
  //     { range, text, forceMoveMarkers: true },
  //   ]);
  //   editor()?.setPosition({ lineNumber, column: column + text.length });
  // };

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
                class="rounded-md border-accent h-6 px-2 data-[pressed]:bg-primary"
                pressed={data().autoLimit}
                onChange={(e: boolean) =>
                  updateDataContentTab('autoLimit', e, tabIdx())
                }
              >
                {t('console.actions.limit')}
              </TooltipTrigger>
              <TooltipContent>{t('console.actions.auto_limit')}</TooltipContent>
            </Tooltip>
          </div>

          <div class="flex items-center gap-2">
            {/* TODO: check if it is possible to trigger tabFocusMode  */}
            {/* editor()?.trigger('app', '', {}); */}
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
                  Controls whether the editor receives tabs or defers them to
                  the app for navigation.
                  <br />
                  Toggle this option when focused on the editor with{' '}
                  {appStore.osType === 'macos' ? 'Ctrl+Shift+M' : 'Ctrl+M'}.
                </p>
              </TooltipContent>
            </Tooltip>
            <Show
              when={getContentData('Query').result_sets[queryIdx()]?.loading}
            >
              <Tooltip>
                <TooltipTrigger
                  size="sm"
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
                focusEditor()
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
            schema={schema}
            path={tabId()}
          />
        </div>
      </div>
      <AlertDialog open={alertDialogOpen()} onOpenChange={setAlertDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This {getConnection().connection.name} database is marked as
              sensitive and you are making a sensitive query type. This behavior
              can be changed in the options on the settings screen.
              <br />
              Please confirm your action.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogClose>Cancel</AlertDialogClose>
            <AlertDialogAction
              onClick={() => {
                const { sql, conn } = getQuery();
                enqueueQuery(conn.id, conn.idx, sql);
              }}
              class="bg-destructive text-destructive-foreground"
            >
              Continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </CommandPaletteContextWrapper>
  );
};
