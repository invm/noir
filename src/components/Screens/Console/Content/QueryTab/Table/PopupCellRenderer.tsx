import { GridApi } from 'ag-grid-community';
import { DotsVertical } from 'components/UI/Icons';
import { Row } from 'interfaces';
import { createSignal } from 'solid-js';
import { tippy } from 'solid-tippy';
import { parseObjRecursive } from 'utils/utils';
tippy;

type RowAction = 'create' | 'edit' | 'delete' | 'view' | 'copy';
export type PopupCellRendererProps = {
  setCode: (s: string) => void;
  api: GridApi;
  rowIndex: number;
  data: Row;
  node: { id: string };
};

const PopupCellRenderer = (props: PopupCellRendererProps) => {
  const [visible, setVisible] = createSignal(false);

  const dropDownContent = (
    <ul class="menu menu-xs rounded-box">
      <li>
        <a onClick={() => onClickHandler('view')}> View in JSON mode</a>
      </li>
      <li>
        <a onClick={() => onClickHandler('copy')}>Copy as JSON to clipboard</a>
      </li>
      <li>
        <a onClick={() => onClickHandler('create')}>Create New Row</a>
      </li>
      <li>
        <a onClick={() => onClickHandler('edit')}>Edit Row</a>
      </li>
      <li>
        <a onClick={() => onClickHandler('delete')}>Delete Row</a>
      </li>
    </ul>
  );

  const onClickHandler = (option: RowAction) => {
    setVisible(false);
    if (option === 'view') {
      const data = parseObjRecursive(props.data);
      props.setCode(JSON.stringify(data, null, 4));
      (document.getElementById('row_modal') as HTMLDialogElement).showModal();
    }
    if (option === 'copy') {
      navigator.clipboard.writeText(JSON.stringify(props.data));
    }
    if (option === 'create') {
      props.api.applyTransaction({
        add: [{}],
      });
    }
    if (option === 'delete') {
      props.api.applyTransaction({ remove: [props.data] });
    }

    if (option === 'edit') {
      props.api.startEditingCell({
        rowIndex: props.rowIndex,
        colKey: 'make',
      });
    }
  };

  return (
    <div class="flex justify-center items-center h-full w-full">
      <button
        use:tippy={{
          props: {
            allowHTML: true,
            arrow: false,
            appendTo: document.body,
            interactive: true,
            content: dropDownContent as undefined,
            placement: 'right',
          },
          hidden: !visible(),
          disabled: !visible(),
        }}
        class="btn btn-primary btn-xs btn-ghost h-6 w-6"
        onClick={() => setVisible((s) => !s)}>
        <DotsVertical />
      </button>
    </div>
  );
};

export default PopupCellRenderer;
