import PopupCellRenderer, { DrawerState, PopupCellRendererProps } from './PopupCellRenderer';
import { getAnyCase } from 'utils/utils';
import { Row } from 'interfaces';
import { Setter, Show } from 'solid-js';
import { ColDef } from 'ag-grid-community';
import { Key } from 'components/UI/Icons';
import { t } from 'utils/i18n';

export type Changes = {
  updates: {
    [rowIndex: string]: {
      updateConditions: Row;
      changes: {
        [key: string]: string;
      };
    };
  };
  deletes: {
    [deleteKey: string]: string;
  };
  creates: {
    [rowIndex: string]: {
      [key: string]: string;
    };
  };
};
const headerComponent = (
  name: string,
  { visible_type, pk, fk }: { visible_type?: string; pk?: boolean; fk?: { table: string; column: string } }
) => (
  <div class="flex items-center justify-between w-full">
    <div>
      <span class="mr-2 text-sm">{name}</span>
      <Show when={visible_type}>
        <span class="text-xs text-base-content">{visible_type}</span>
      </Show>
    </div>
    <Show when={pk || fk}>
      <div
        class={`tooltip tooltip-${pk ? 'success' : 'warning'} tooltip-left px-3 text-xs font-light`}
        data-tip={
          pk ? t('console.table.primary_key') : t('console.table.foreign_key', { table: fk?.table, column: fk?.column })
        }>
        <Key color={pk ? 'success' : 'warning'} />
      </div>
    </Show>
  </div>
);

export const getColumnDefs = ({
  columns,
  foreign_keys,
  primary_key,
  setCode,
  editable,
  setDrawerOpen,
  setChanges,
  row,
}: {
  setCode: (code: string) => void;
  setDrawerOpen: (s: DrawerState) => void;
  columns: Row[];
  foreign_keys: Row[];
  primary_key: Row[];
  editable: boolean;
  setChanges: Setter<Changes>;
  row: Row;
}): ColDef[] => {
  const cellRenderer = (p: PopupCellRendererProps) => (
    <PopupCellRenderer
      {...p}
      {...{ setChanges, editable, setCode, setDrawerOpen, columns, foreign_keys, primary_key }}
    />
  );

  if (columns.length) {
    return columns.map((col, _i) => {
      const field = getAnyCase(col, 'column_name');
      const fk = foreign_keys.find((c) => {
        const t = getAnyCase(c, 'column_name');
        return t === field;
      });
      const pk = !!primary_key.find((c) => {
        const t = getAnyCase(c, 'column_name');
        return t === field;
      });
      const visible_type = getAnyCase(col, 'column_type') || '';

      return {
        cellRenderer,
        headerComponent: () =>
          headerComponent(field, {
            visible_type,
            pk,
            fk: fk ? { table: getAnyCase(fk, 'table_name'), column: getAnyCase(fk, 'column_name') } : undefined,
          }),
        field,
        headerName: field,
      };
    });
  }
  return Object.keys(row).map((field, _i) => {
    return {
      cellRenderer,
      headerComponent: () => headerComponent(field, {}),
      field,
      headerName: field,
    };
  });
};
