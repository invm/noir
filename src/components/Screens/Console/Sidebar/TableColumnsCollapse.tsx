import { createSignal, For, Show } from 'solid-js';
import { useContextMenu, Menu, animation, Item } from 'solid-contextmenu';
import { invoke } from '@tauri-apps/api';
import { t } from 'utils/i18n';
import { useAppSelector } from 'services/Context';
import { newContentTab, TableStructureContentTabData } from 'services/Connections';
import { SwapChevronDown, SwapChevronRight, Table } from 'components/UI/Icons';
import { Column, ResultSet } from 'interfaces';
import { getAnyCase } from 'utils/utils';

type TableColumnsCollapseProps = {
  entity: 'views' | 'tables';
  title: string;
  columns: Column[];
};

export const TableColumnsCollapse = (props: TableColumnsCollapseProps) => {
  const [open, setOpen] = createSignal(false);
  const [showModal, setShowModal] = createSignal(false);

  const {
    connections: { insertColumnName, addContentTab, getConnection, updateContentTab },
    backend: { selectAllFrom },
    messages: { notify },
  } = useAppSelector();

  const menu_id = 'sidebar-table-menu_' + props.entity + props.title;
  const modal_id = 'table-modal_' + props.entity + props.title;

  const { show, hideAll } = useContextMenu({
    id: menu_id,
    props: { table: props.title },
  });

  const addTableStructureTab = async (table: string) => {
    try {
      const data = await invoke<TableStructureContentTabData>('get_table_structure', {
        connId: getConnection().id,
        table,
      });
      addContentTab(newContentTab(table, 'TableStructure', data));
    } catch (error) {
      notify(error);
    }
  };

  const listData = async (table: string) => {
    try {
      const conn = getConnection();
      const data = { result_sets: [], table };
      addContentTab(newContentTab(table, 'Data', data));
      const result_sets = await selectAllFrom(table, conn.id, conn.idx);
      updateContentTab('data', {
        result_sets: result_sets.map((id) => ({ id })),
      });
    } catch (error) {
      notify(error);
    }
  };

  const truncateTable = async (table: string) => {
    try {
      const query = 'TRUNCATE TABLE ' + table;
      await invoke<ResultSet>('execute_query', {
        connId: getConnection().id,
        query,
      });
      notify(t('sidebar.table_was_truncated', { table }), 'success');
    } catch (error) {
      notify(error);
    } finally {
      setShowModal(false);
    }
  };

  return (
    <>
      <Show when={showModal()}>
        <dialog id={modal_id} class="modal">
          <form method="dialog" class="modal-box">
            <h3 class="font-bold text-lg">{t('connections_list.actions.confirm_action')}</h3>
            <p class="py-4">{t('sidebar.confirm_truncate', { table: props.title })}</p>
            <div class="flex justify-between w-full gap-3">
              <button
                class="btn btn-error btn-sm"
                onClick={() => {
                  truncateTable(props.title);
                }}>
                {t('sidebar.yes')}
              </button>
              <button
                onClick={() => {
                  setShowModal(false);
                }}
                class="btn btn-primary btn-sm">
                {t('sidebar.cancel')}
              </button>
            </div>
          </form>
          <form method="dialog" class="modal-backdrop">
            <button
              onClick={() => {
                setShowModal(false);
              }}>
              close
            </button>
          </form>
        </dialog>
      </Show>
      <Menu id={menu_id} animation={animation.fade} theme={'dark'}>
        <Item
          onClick={({ props }) => {
            addTableStructureTab(props.table);
          }}>
          {t('sidebar.show_table_structure')}
        </Item>
        <Item
          onClick={({ props }) => {
            listData(props.table);
          }}>
          {t('sidebar.view_data')}
        </Item>
        <Item
          onClick={() => {
            setShowModal(true);
            (document.getElementById(modal_id) as HTMLDialogElement).showModal();
          }}>
          {t('sidebar.truncate_table')}
        </Item>
      </Menu>
      <div
        onClick={() => setOpen(!open())}
        class="cursor-pointer w-full flex items-center mt-1 hover:bg-base-100"
        onContextMenu={(e) => {
          hideAll();
          show(e);
        }}>
        <div class="flex items-center">
          <span class="collapse">
            <label class={`swap text-6xl ${open() ? 'swap-active' : ''}`}>
              <SwapChevronRight />
              <SwapChevronDown />
            </label>
          </span>

          <span class="px-2 flex items-center">
            <div class="tooltip tooltip-info tooltip-right tooltip-xs" data-tip={t(`sidebar.tooltips.${props.entity}`)}>
              <Table color={props.entity === 'tables' ? 'info' : 'warning'} />
            </div>
          </span>
          <span tabindex={0} class="text-xs font-semibold">
            {props.title}
          </span>
        </div>
      </div>

      <div
        class="pl-4 pt-1"
        classList={{
          'mb-2': open(),
          'border-b-[1px]': open(),
          'border-base-200': open(),
        }}>
        <Show when={open()}>
          <For each={props.columns}>
            {(column) => (
              <div
                tabindex={1}
                onClick={() => insertColumnName(column.name)}
                class="flex btn-ghost w-full justify-between items-center w-full border-b-2 border-base-300">
                <span class="text-xs font-medium">{column.name}</span>
                <span class="text-xs font-light ml-2">{getAnyCase(column.props, 'column_type')}</span>
              </div>
            )}
          </For>
        </Show>
      </div>
    </>
  );
};
