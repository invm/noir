import { GridApi } from 'ag-grid-community';
import { JSONValue, Row } from 'interfaces';
import { For } from 'solid-js';
import { getAnyCase, parseObjRecursive } from 'utils/utils';
import { writeText } from '@tauri-apps/api/clipboard';
import { t } from 'utils/i18n';
import { Changes } from './utils';
import { SetStoreFunction } from 'solid-js/store';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from 'components/ui/context-menu';

const rowsActions = [
  {
    action: 'view',
    editable: false,
    label: t('console.table.row_actions.view'),
  },
  {
    action: 'copy-row',
    editable: false,
    label: t('console.table.row_actions.copy_row'),
  },
  {
    action: 'copy-cell',
    editable: false,
    label: t('console.table.row_actions.copy_cell'),
  },
  {
    action: 'edit-row',
    editable: true,
    label: t('console.table.row_actions.edit_row'),
  },
  {
    action: 'edit-cell',
    editable: true,
    label: t('console.table.row_actions.edit_cell'),
  },
  {
    action: 'add-row',
    editable: true,
    label: t('console.table.row_actions.add_row'),
  },
  {
    action: 'delete-row',
    editable: true,
    label: t('console.table.row_actions.delete_row'),
  },
] as const;

type RowAction = (typeof rowsActions)[number]['action'];

export type DrawerState = {
  open: boolean;
  mode: 'add' | 'edit';
  data: Row;
  columns: Row[];
  foreign_keys: Row[];
  primary_key: Row[];
  rowIndex?: number;
  originalData: Row;
};

export type PopupCellRendererProps = {
  openModal: (s: string) => void;
  api: GridApi;
  rowIndex: number;
  data: Row;
  node: { id: string };
  value: string;
  column: { getColId: () => string };
  editable: boolean;
  primary_key: Row[];
  setChanges: SetStoreFunction<Changes>;
  openDrawerForm: (s: Pick<DrawerState, 'mode' | 'rowIndex' | 'data'>) => void;
};

const removeNoirId = (obj: Record<string | '__noir_id', JSONValue>) => {
  delete obj.__noir_id;
  return obj;
};

const PopupCellRenderer = (props: PopupCellRendererProps) => {
  const onClickHandler = async (option: RowAction) => {
    // TODO: check all these actions
    if (option === 'view') {
      const data = parseObjRecursive(props.data);
      // @ts-ignore
      props.openModal(JSON.stringify(removeNoirId(data), null, 4));
      return;
    }
    if (option === 'copy-row') {
      await writeText(JSON.stringify(removeNoirId(props.data)));
      return;
    }
    if (option === 'copy-cell') {
      await writeText(String(props.value));
      return;
    }

    if (option === 'add-row') {
      props.openDrawerForm({
        data: {},
        mode: 'add',
      });
      return;
    }

    if (option === 'delete-row') {
      const condition = props.primary_key.reduce((acc, c) => {
        const col = getAnyCase(c, 'column_name');
        return { ...acc, [col]: props.data[col] };
      }, {});
      const key = Object.values(condition).join('_');
      props.setChanges('delete', key, {
        condition,
        data: props.data,
        rowIndex: props.rowIndex,
      });
      props.api.applyTransaction({ remove: [props.data] });
      return;
    }

    if (option === 'edit-cell') {
      props.api.startEditingCell({
        rowIndex: props.rowIndex,
        colKey: props.column.getColId(),
      });
      return;
    }

    if (option === 'edit-row') {
      props.openDrawerForm({
        data: props.data,
        mode: 'edit',
        rowIndex: props.rowIndex,
      });
      return;
    }
  };

  return (
    <ContextMenu>
      <ContextMenuTrigger>{props.value}</ContextMenuTrigger>
      <ContextMenuContent>
        <For
          each={rowsActions.filter((r) => {
            return !r.editable || r.editable === props.editable;
          })}
        >
          {({ action, label }) => (
            <ContextMenuItem onSelect={() => onClickHandler(action)}>
              {label}
            </ContextMenuItem>
          )}
        </For>
      </ContextMenuContent>
    </ContextMenu>
  );
};

export default PopupCellRenderer;
