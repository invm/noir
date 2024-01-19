import { GridApi } from 'ag-grid-community';
import { Row } from 'interfaces';
import { createSignal, For, Setter } from 'solid-js';
import { tippy } from 'solid-tippy';
import { parseObjRecursive } from 'utils/utils';
import { writeText } from '@tauri-apps/api/clipboard';
import { t } from 'utils/i18n';
import { Changes } from '../Results';
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

export type PopupCellRendererProps = {
  setCode: (s: string) => void;
  api: GridApi;
  rowIndex: number;
  data: Row;
  node: { id: string };
  value: string;
  column: { getColId: () => string };
  editable: boolean;
  openDrawer: (row: Row, columns: Row[], rowIndex: number, constraints: Row[]) => void;
  columns: Row[];
  constraints: Row[];
  setChanges: Setter<Changes>;
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
      props.api.applyTransaction({
        add: [{}],
      });
    }

    if (option === 'delete-row') {
      // console.log(props.node.id);
      props.api.applyTransaction({ remove: [props.data] });
      // props.setChanges('deletes', props.node.id);
    }

    if (option === 'edit-cell') {
      props.api.startEditingCell({
        rowIndex: props.rowIndex,
        colKey: props.column.getColId(),
      });
    }

    if (option === 'edit-row') {
      props.openDrawer(props.data, props.columns, props.rowIndex, props.constraints);
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
