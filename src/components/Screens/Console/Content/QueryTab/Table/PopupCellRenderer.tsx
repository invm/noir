import { GridApi } from 'ag-grid-community';
import { Row } from 'interfaces';
import { createSignal, For } from 'solid-js';
import { tippy } from 'solid-tippy';
import { getAnyCase, parseObjRecursive } from 'utils/utils';
import { writeText } from '@tauri-apps/api/clipboard';
import { t } from 'utils/i18n';
import { Changes } from './utils';
import { SetStoreFunction } from 'solid-js/store';
tippy;

const rowsActions = [
  { action: 'view', label: t('console.table.row_actions.view') },
  { action: 'copy-row', label: t('console.table.row_actions.copy_row') },
  { action: 'copy-cell', label: t('console.table.row_actions.copy_cell') },
  { action: 'edit-row', label: t('console.table.row_actions.edit_row') },
  { action: 'edit-cell', label: t('console.table.row_actions.edit_cell') },
  { action: 'add-row', label: t('console.table.row_actions.add_row') },
  { action: 'delete-row', label: t('console.table.row_actions.delete_row') },
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
};

export type PopupCellRendererProps = {
  setCode: (s: string) => void;
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

const PopupCellRenderer = (props: PopupCellRendererProps) => {
  const [visible, setVisible] = createSignal(false);

  const dropDownContent = (
    <ul class="menu menu-xs rounded-box">
      <For
        each={rowsActions.filter((r) => {
          if (['edit-row', 'edit-cell'].includes(r.action)) {
            return props.editable;
          }
          return true;
        })}>
        {({ action, label }) => (
          <li>
            <a onClick={() => onClickHandler(action)}>{label}</a>
          </li>
        )}
      </For>
    </ul>
  );

  const onClickHandler = async (option: RowAction) => {
    setVisible(false);
    if (option === 'view') {
      const data = parseObjRecursive(props.data);
      props.setCode(JSON.stringify(data, null, 4));
      (document.getElementById('row_modal') as HTMLDialogElement).showModal();
    }
    if (option === 'copy-row') {
      await writeText(JSON.stringify(props.data)).catch((e) => console.error(e));
    }
    if (option === 'copy-cell') {
      await writeText(props.value);
    }

    if (option === 'add-row') {
      props.openDrawerForm({
        data: {},
        mode: 'add',
      });
    }

    if (option === 'delete-row') {
      const condition = props.primary_key.reduce((acc, c) => {
        const col = getAnyCase(c, 'column_name');
        return { ...acc, [col]: props.data[col] };
      }, {});
      const key = Object.values(condition).join('_');
      props.setChanges('delete', key, { condition });
    }

    if (option === 'edit-cell') {
      props.api.startEditingCell({
        rowIndex: props.rowIndex,
        colKey: props.column.getColId(),
      });
    }

    if (option === 'edit-row') {
      props.openDrawerForm({
        data: props.data,
        mode: 'edit',
        rowIndex: props.rowIndex,
      });
    }
  };

  return (
    <div
      onContextMenu={(e) => {
        e.preventDefault();
        setVisible((s) => !s);
      }}
      use:tippy={{
        props: {
          allowHTML: true,
          arrow: false,
          appendTo: document.body,
          interactive: true,
          content: dropDownContent as undefined,
          placement: 'right',
          trigger: 'click',
        },
        hidden: !visible(),
        disabled: !visible(),
      }}>
      {props.value}
    </div>
  );
};

export default PopupCellRenderer;
