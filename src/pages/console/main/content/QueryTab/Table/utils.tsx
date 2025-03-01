import PopupCellRenderer, {
  DrawerState,
  PopupCellRendererProps,
} from './PopupCellRenderer';
import { getAnyCase } from 'utils/utils';
import { Row } from 'interfaces';
import { Show } from 'solid-js';
import { ColDef } from 'ag-grid-community';
import { IoKey as Key } from 'solid-icons/io';
import { t } from 'utils/i18n';
import { SetStoreFunction } from 'solid-js/store';
import { Tooltip } from '@kobalte/core/tooltip';
import { TooltipTrigger, TooltipContent } from 'components/ui/tooltip';

export type UpdageChange = {
  [rowIndex: string]: {
    condition: Row;
    data: Row;
    changes: Row;
    rowIndex: number;
  };
};

export type DeleteChange = {
  [rowIndex: string]: {
    condition: Row;
    data: Row;
    rowIndex: number;
  };
};

export type AddChange = {
  [createKey: string]: Row;
};

export type Changes = {
  update: UpdageChange;
  delete: DeleteChange;
  add: AddChange;
};
const headerComponent = (
  name: string,
  {
    visible_type,
    pk,
    fk,
  }: {
    visible_type?: string;
    pk?: boolean;
    fk?: { table: string; column: string };
  }
) => (
  <div class="flex items-center justify-between w-full">
    <div>
      <span class="mr-2 text-sm">{name}</span>
      <Show when={visible_type}>
        <span class="text-xs">{visible_type}</span>
      </Show>
    </div>
    <Show when={pk || fk}>
      <Tooltip>
        <TooltipTrigger>
          <Key class={pk ? 'text-emerald-500' : 'text-yellow-500'} />
        </TooltipTrigger>
        <TooltipContent>
          {pk
            ? t('console.table.primary_key')
            : t('console.table.foreign_key', {
                table: fk?.table,
                column: fk?.column,
              })}
        </TooltipContent>
      </Tooltip>
    </Show>
  </div>
);

export const getColumnDefs = ({
  columns,
  foreign_keys,
  primary_key,
  openModal,
  editable,
  setChanges,
  row,
  openDrawerForm,
}: {
  columns: Row[];
  foreign_keys: Row[];
  primary_key: Row[];
  openModal: (code: string) => void;
  editable: boolean;
  setChanges: SetStoreFunction<Changes>;
  row: Row;
  openDrawerForm: (s: Pick<DrawerState, 'mode' | 'data' | 'rowIndex'>) => void;
}): ColDef[] => {
  const cellRenderer = (p: PopupCellRendererProps) => (
    <PopupCellRenderer
      {...p}
      {...{ setChanges, editable, openModal, primary_key, openDrawerForm }}
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
        editable,
        headerComponent: () =>
          headerComponent(field, {
            visible_type,
            pk,
            fk: fk
              ? {
                  table: getAnyCase(fk, 'table_name'),
                  column: getAnyCase(fk, 'column_name'),
                }
              : undefined,
          }),
        field,
        headerName: field,
      };
    });
  }
  return Object.keys(row).map((field, _i) => {
    return {
      editable,
      cellRenderer,
      headerComponent: () => headerComponent(field, {}),
      field,
      headerName: field,
    };
  });
};
