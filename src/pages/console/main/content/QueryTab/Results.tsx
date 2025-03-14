import {
  createEffect,
  createResource,
  createSignal,
  on,
  Show,
  Suspense,
} from 'solid-js';
import {
  CellEditingStoppedEvent,
  ColDef,
  GetRowIdFunc,
} from 'ag-grid-community';
import AgGridSolid, { AgGridSolidRef } from 'ag-grid-solid';
import { useAppSelector } from 'services/Context';
import { loadingMessages, Row } from 'interfaces';
import { Pagination } from './components/Pagination';
import { NoResults } from './components/NoResults';
import { Loader } from 'components/ui/loader';
import { getAnyCase } from 'utils/utils';
import { save } from '@tauri-apps/plugin-dialog';
import { invoke } from '@tauri-apps/api/core';
import { deleteFrom, insert, update } from 'sql-bricks';
import { t } from 'utils/i18n';
import { Drawer } from './Table/Drawer';
import { createStore, produce } from 'solid-js/store';
import { Search } from './components/Search';
import { Changes, getColumnDefs } from './Table/utils';
import { createShortcut } from '@solid-primitives/keyboard';
import TriggerCommandPalette from 'pages/settings/trigger-command-palette';
import { DrawerState } from './Table/PopupCellRenderer';
import { Dialog, DialogContent } from 'components/ui/dialog';
import { toast } from 'solid-sonner';
import { useColorMode } from '@kobalte/core/color-mode';
import { MonacoEditor } from 'solid-monaco';

const defaultChanges: Changes = { update: {}, delete: {}, add: {} };

// Random message picker
const getLoadingMessage = () =>
  loadingMessages[Math.floor(Math.random() * loadingMessages.length)];

export const Results = (props: {
  gridTheme: string;
  editable?: boolean;
  table?: string;
}) => {
  const {
    connections: {
      queryIdx,
      getConnection,
      updateDataContentTab,
      getContentData,
    },
    backend: {
      getQueryResults,
      pageSize,
      downloadCsv,
      downloadJSON,
      selectAllFrom,
    },
    app: { cmdOrCtrl },
  } = useAppSelector();
  const [open, setOpen] = createSignal(false);
  const { colorMode } = useColorMode();

  const [drawerOpen, setDrawerOpen] = createStore<DrawerState>({
    mode: 'add' as 'add' | 'edit',
    open: false,
    data: {} as Row,
    columns: [] as Row[],
    foreign_keys: [] as Row[],
    primary_key: [] as Row[],
    rowIndex: 0,
    originalData: {} as Row,
  });
  const [code, setCode] = createSignal('');
  const [page, setPage] = createSignal(0);
  const [table, setTable] = createStore({
    name: '',
    foreign_keys: [] as Row[],
    primary_key: [] as Row[],
    columns: [] as Row[],
  });
  const [changes, setChanges] = createStore<Changes>(defaultChanges);
  const idx = () => getConnection().idx;

  const openDrawerForm = ({
    rowIndex,
    mode,
    data: row,
  }: {
    data: Row;
    rowIndex?: number;
    mode: 'add' | 'edit';
  }) => {
    if (!props.editable) return;
    setDrawerOpen({
      mode,
      open: true,
      data: row,
      columns: table.columns,
      foreign_keys: table.foreign_keys,
      primary_key: table.primary_key,
      rowIndex,
      originalData: { ...row }, // specifically to remove the reference
    });
  };

  createShortcut(['Escape'], () => {
    if (drawerOpen.open) setDrawerOpen({ open: false });
  });

  const [rowIdx, setRowIdx] = createSignal(0);

  const openModal = (s: string) => {
    setCode(s);
    setOpen(true);
  };

  const [data] = createResource(
    () =>
      [
        page(),
        pageSize(),
        getContentData('Query')?.result_sets[queryIdx()],
      ] as const,
    async ([pageVal, pageSizeVal, result_set]) => {
      try {
        setRowIdx(0);
        // Reruns when either signal updates
        const columns = result_set?.columns ?? [];
        const foreign_keys = result_set?.foreign_keys ?? [];
        const primary_key = result_set?.primary_key ?? [];
        const start_time = result_set?.start_time ?? 0;
        const end_time = result_set?.end_time ?? 0;
        setTable({
          name: result_set?.table ?? '',
          columns,
          foreign_keys:
            table.name === result_set?.table
              ? table.foreign_keys
              : foreign_keys,
          primary_key:
            table.name === result_set?.table ? table.primary_key : primary_key,
        });
        let colDef = getColumnDefs({
          columns,
          foreign_keys,
          primary_key,
          openModal,
          editable: !!props.editable,
          setChanges,
          row: result_set?.rows?.[0] ?? {},
          openDrawerForm,
        });
        if (result_set?.rows?.length) {
          return {
            rows: result_set.rows,
            columns,
            colDef,
            count: result_set.count,
            start_time,
            end_time,
          };
        }
        if (!result_set || result_set?.status !== 'Completed') {
          return { rows: [], columns, colDef, exhausted: true, running: true };
        }
        const rows = await getQueryResults(
          result_set.path!,
          pageVal,
          pageSizeVal
        );
        colDef = getColumnDefs({
          columns,
          foreign_keys,
          primary_key,
          openModal,
          editable: !!props.editable,
          setChanges,
          row: rows[0] || {},
          openDrawerForm,
        });
        return {
          columns,
          rows,
          colDef,
          count: result_set.count,
          exhausted: rows.length < pageSizeVal,
          path: result_set.path,
          affectedRows: result_set.affected_rows,
          queryType: result_set.query_type,
          start_time,
          end_time,
        };
      } catch (error) {
        toast.error('Could not get data', {
          description: (error as Error).message || (error as string),
        });
        return { rows: [], columns: [], colDef: [], exhausted: true, error };
      }
    }
  );

  createEffect(
    on(idx, () => {
      setPage(0);
      resetChanges();
    })
  );

  const onNextPage = async () => {
    if (data()?.exhausted) return;
    setPage(page() + 1);
  };

  const onPrevPage = async () => {
    if (page() === 0) return;
    setPage(page() - 1);
  };

  const onPageSizeChange = () => {
    setPage(0);
  };

  let gridRef: AgGridSolidRef;

  const onBtnExport = async (t: 'csv' | 'json') => {
    if (!data()?.path) return;
    const filename = (props.table ?? '') + new Date().toISOString() + '.' + t;
    const filePath = (await save({ defaultPath: filename })) ?? '';
    const dataPath = data()?.path;
    if (!filePath || !dataPath) return;
    if (t === 'json') {
      await downloadJSON(dataPath, filePath).catch((error) => {
        toast.error('Could not download JSON', {
          description: (error as Error).message || (error as string),
        });
      });
    } else {
      await downloadCsv(dataPath, filePath).catch((error) => {
        toast.error('Could not download JSON', {
          description: (error as Error).message || (error as string),
        });
      });
    }
  };

  const applyChanges = async () => {
    try {
      const _table = table.name;
      const queries = [];
      if (Object.keys(changes['add']).length) {
        const inserts = Object.keys(changes['add']).map((rowIndex) => {
          const row = changes['add'];
          return insert(_table).values(row[rowIndex].changes).toString();
        });
        queries.push(...inserts);
      }
      if (Object.keys(changes['update']).length) {
        const updates = Object.keys(changes['update']).map((rowIndex) => {
          const row = changes['update']?.[rowIndex];
          return update(_table, { ...row.changes })
            .where(row.condition)
            .toString();
        });
        queries.push(...updates);
      }
      if (Object.keys(changes['delete']).length) {
        const deletes = Object.keys(changes['delete']).map((rowIndex) => {
          const row = changes['delete'];
          return deleteFrom(_table).where(row[rowIndex].condition).toString();
        });
        queries.push(...deletes);
      }
      if (queries.length === 0) return;
      const conn = getConnection();
      await invoke('execute_tx', { queries, connId: conn.id });
      await invoke('invalidate_query', { path: data()?.path });
      const result_sets = await selectAllFrom(
        props.table!,
        conn.id,
        getConnection().idx
      );
      updateDataContentTab(
        'result_sets',
        result_sets.map((id) => ({ id, loading: true }))
      );
      Object.keys(changes).forEach((key) => {
        const count = Object.keys(changes[key as keyof typeof changes]).length;
        if (count)
          toast.success(t(`console.table.successfull_${key}`, { count }));
      }, 0);
      resetChanges();
      return true;
    } catch (error) {
      toast.error('Could not apply changes', {
        description: (error as Error).message || (error as string),
      });
      return false;
    }
  };

  const resetChanges = () => {
    setChanges(
      produce((s) => {
        s.update = {};
        s.delete = {};
        s.add = {};
      })
    );
  };

  const undoChanges = async () => {
    if (Object.keys(changes['update']).length) {
      gridRef.api.applyTransaction({
        update: Object.values(changes['update']).map((d) => d.data),
      });
    }
    if (Object.keys(changes['delete']).length) {
      // return rows to their place
      Object.values(changes['delete']).forEach((d) => {
        gridRef.api.applyTransaction({
          addIndex: d.rowIndex,
          add: [d.data],
        });
      });
    }
    resetChanges();
  };

  const onCellEditingStopped = (e: CellEditingStoppedEvent) => {
    if (e.valueChanged) {
      const columns = (
        table.primary_key.length ? table.primary_key : table.columns
      ).filter((c) => c.column_name !== e.column.getColId());
      const condition = columns.reduce((acc, c) => {
        const col = getAnyCase(c, 'column_name');
        return { ...acc, [col]: e.data[col] };
      }, {});
      const change = e.column.getColId();
      const idx = String(e.rowIndex);
      setChanges('update', idx, {
        condition,
        data: { ...e.data, [change]: e.oldValue },
        changes: { [change]: e.newValue },
        rowIndex: e.rowIndex || 0,
      });
    }
  };

  const saveForm = async () => {
    if (!drawerOpen.data) return;
    const data = { ...drawerOpen.data };
    const changed = Object.keys(data).filter(
      (key) => data[key] !== drawerOpen.originalData[key]
    );
    const columns = (
      table.primary_key.filter(
        (c) => !changed.includes(getAnyCase(c, 'column_name'))
      ).length
        ? table.primary_key
        : table.columns
    ).filter((c) => !changed.includes(getAnyCase(c, 'column_name')));
    const condition = columns.reduce((acc, c) => {
      const col = getAnyCase(c, 'column_name');
      return { ...acc, [col]: data[col] };
    }, {});
    if (drawerOpen.mode === 'add') {
      const key = Object.values(condition).join('_');
      setChanges('add', key, { changes: data });
    } else {
      const idx = String(drawerOpen.rowIndex);
      setChanges('update', idx, {
        condition,
        data: drawerOpen.originalData,
        changes: data,
      });
    }
    const success = await applyChanges();
    if (success) {
      setDrawerOpen({ open: false, data: {} });
    }
  };

  createShortcut([cmdOrCtrl(), 's'], async () => {
    if (!props.editable) return;
    if (drawerOpen.open) {
      await saveForm();
    } else {
      await applyChanges();
    }
  });

  const defaultColDef: ColDef = {
    minWidth: 30,
    suppressMovable: true,
    editable: true,
    sortable: true,
    singleClickEdit: true,
    resizable: true,
    filter: true,
    width: 300,
  };

  const getRowId: GetRowIdFunc<Row> = (params) => {
    const pks = table.primary_key.reduce((acc, curr) => {
      return [...acc, params.data[getAnyCase(curr, 'column_name')] as string];
    }, [] as string[]);
    const fks = table.foreign_keys.reduce((acc, curr) => {
      return [...acc, params.data[getAnyCase(curr, 'column_name')] as string];
    }, [] as string[]);
    if (pks.length || fks.length) {
      return [...pks, ...fks].join('_');
    }

    setRowIdx((p) => p + 1);

    return (
      Object.entries(params.data)
        .map(([_, value]) => {
          if (value == null) return 'null';
          if (typeof value === 'string' && value.length > 50) {
            return `${value.substring(0, 50)}_${value.length}`;
          }
          return String(value);
        })
        .join('_') + rowIdx()
    );
  };

  return (
    <div class="flex flex-col h-full overflow-hidden">
      <Dialog open={open()} onOpenChange={(isOpen) => setOpen(isOpen)}>
        <DialogContent class="min-w-[1000px]">
          <div class="modal-box pt-10 max-h-full min-h-[80vh] h-[80%]">
            <MonacoEditor
              options={{
                glyphMargin: false,
                tabSize: 2,
                lineNumbers: 'on',
                fontSize: 14,
                folding: true,
                theme: 'vs-' + colorMode(),
                language: 'json',
                wordWrap: 'on',
                readOnly: true,
                automaticLayout: true,
                autoSurround: 'languageDefined',
                minimap: { enabled: false },
              }}
              language={'json'}
              value={code()}
            />
          </div>
        </DialogContent>
      </Dialog>
      <div>
        <Pagination
          {...{
            changesCount: Object.keys(changes).reduce((acc, key) => {
              return (
                acc + Object.keys(changes[key as keyof typeof changes]).length
              );
            }, 0),
            undoChanges,
            applyChanges,
            page,
            onNextPage,
            onPrevPage,
            loading: data.loading,
            query: {
              hasResults: !!data()?.rows.length,
              executionTime:
                (data()?.end_time ?? 0) - (data()?.start_time ?? 0),
              count: data()?.count ?? 0,
              affectedRows: data()?.affectedRows ?? 0,
              queryType: data()?.queryType ?? 'Select',
            },
            onPageSizeChange,
            onBtnExport,
            openDrawerForm: props.editable ? openDrawerForm : undefined,
          }}
        />
        <Search table={table.name} columns={table.columns} />
      </div>
      <div
        class={'select-text ag-theme-' + props.gridTheme}
        style={{ height: '100%' }}
      >
        <Suspense>
          <AgGridSolid
            noRowsOverlayComponent={() =>
              getContentData('Query').result_sets[queryIdx()]?.loading ? (
                <div class="text-center flex flex-col gap-2 items-center justify-center">
                  <Loader size="lg" />
                  <pre class="bg-background p-1 text-white rounded-sm px-1">
                    <code>{getLoadingMessage()}</code>
                  </pre>
                </div>
              ) : data()?.running ? (
                <TriggerCommandPalette />
              ) : (
                <NoResults error={data()?.error} />
              )
            }
            loadingOverlayComponent={() =>
              getContentData('Query').result_sets[queryIdx()]?.loading ? (
                <Loader />
              ) : (
                <TriggerCommandPalette />
              )
            }
            getRowId={getRowId}
            ref={gridRef!}
            columnDefs={data()?.colDef}
            rowSelection="multiple"
            rowData={data()?.rows}
            defaultColDef={defaultColDef}
            enableCellChangeFlash
            enableCellTextSelection
            undoRedoCellEditing
            suppressExcelExport
            undoRedoCellEditingLimit={0}
            suppressCsvExport={false}
            onCellEditingStopped={onCellEditingStopped}
          />
        </Suspense>
      </div>
      <Show when={drawerOpen.open}>
        <Drawer
          {...{
            drawerOpen,
            setDrawerOpen,
            table: props.table ?? '',
            saveForm,
          }}
        />
      </Show>
    </div>
  );
};
