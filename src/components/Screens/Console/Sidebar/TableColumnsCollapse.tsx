import { createSignal, JSXElement } from 'solid-js';
import { useContextMenu, Menu, animation, Item } from 'solid-contextmenu';
import { invoke } from '@tauri-apps/api';
import { t } from 'utils/i18n';
import { useAppSelector } from 'services/Context';
import { newContentTab, TableStructureContentTabData } from 'services/Connections';
import { Table } from 'components/UI/Icons';
import { ResultSet } from 'interfaces';

export const TableColumnsCollapse = (props: { entity: 'views' | 'tables'; title: string; children: JSXElement }) => {
  const [open, setOpen] = createSignal(false);

  const {
    connections: { contentStore, addContentTab, getConnection, updateContentTab },
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
      const result_sets = await selectAllFrom(table, conn.id, contentStore.idx);
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
    }
  };

  return (
    <>
      <dialog id={modal_id} class="modal">
        <form method="dialog" class="modal-box">
          <h3 class="font-bold text-lg">{t('connections_list.actions.confirm_action')}</h3>
          <p class="py-4">{t('sidebar.confirm_truncate', { table: props.title })}</p>
          <div class="flex justify-between w-full gap-3">
            <button
              class="btn btn-error btn-sm"
              onClick={() => {
                truncateTable(props.title);
                hideAll();
              }}>
              {t('sidebar.yes')}
            </button>
            <button class="btn btn-primary btn-sm">{t('sidebar.cancel')}</button>
          </div>
        </form>
        <form method="dialog" class="modal-backdrop">
          <button>close</button>
        </form>
      </dialog>
      <Menu id={menu_id} animation={animation.fade} theme={'dark'}>
        <Item
          onClick={({ props }) => {
            addTableStructureTab(props.table);
            hideAll();
          }}>
          {t('sidebar.show_table_structure')}
        </Item>
        <Item
          onClick={({ props }) => {
            listData(props.table);
            hideAll();
          }}>
          {t('sidebar.list_data')}
        </Item>
        <Item onClick={() => (document.getElementById(modal_id) as HTMLDialogElement).showModal()}>
          {t('sidebar.truncate_table')}
        </Item>
      </Menu>
      <div class="w-full flex items-center" onContextMenu={(e) => show(e)}>
        <div class="flex items-center">
          <span onClick={() => setOpen(!open())} class="collapse">
            <label class={`swap text-6xl ${open() ? 'swap-active' : ''}`}>
              <svg
                class="w-2 h-2 swap-off"
                aria-hidden="true"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 6 10">
                <path
                  stroke="currentColor"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="m1 9 4-4-4-4"
                />
              </svg>
              <svg
                class="w-2 h-2 swap-on"
                aria-hidden="true"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 10 6">
                <path
                  stroke="currentColor"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="m1 1 4 4 4-4"
                />
              </svg>
            </label>
          </span>

          <span class="px-2">
            <div class="tooltip tooltip-info tooltip-right tooltip-xs" data-tip={t(`sidebar.tooltips.${props.entity}`)}>
              <Table color={props.entity === 'tables' ? 'info' : 'warning'} />
            </div>
          </span>
          <span class="text-xs font-semibold">{props.title}</span>
        </div>
      </div>

      <div
        class="pl-2"
        classList={{
          'mb-4': open(),
          'border-b-[1px]': open(),
          'border-base-200': open(),
        }}>
        {open() && props.children}
      </div>
    </>
  );
};
