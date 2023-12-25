import { createSignal, JSXElement } from 'solid-js';
import { useContextMenu, Menu, animation, Item } from 'solid-contextmenu';
import { t } from 'utils/i18n';
import { useAppSelector } from 'services/Context';
import { newContentTab, TableStructureContentTabData } from 'services/Connections';

import { invoke } from '@tauri-apps/api';
import { QueryTaskEnqueueResult, ResultSet } from 'interfaces';

export const TableColumnsCollapse = (props: { title: string; children: JSXElement }) => {
  const [open, setOpen] = createSignal(false);

  const {
    connections: { contentStore, addContentTab, getConnection, updateContentTab },
    messages: { notify },
  } = useAppSelector();

  const menu_id = 'sidebar-table-menu';

  const { show } = useContextMenu({
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
      const activeConnection = getConnection();
      const query = 'SELECT * from ' + table;
      const data = {
        query,
        cursor: 0,
        result_sets: [],
      };
      addContentTab(newContentTab(table, 'Query', data));
      const { result_sets } = await invoke<QueryTaskEnqueueResult>('enqueue_query', {
        connId: activeConnection.id,
        sql: query,
        autoLimit: true,
        tabIdx: contentStore.idx,
      });
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
        autoLimit: false,
      });
      notify(t('sidebar.table_was_truncated', { table }), 'success');
    } catch (error) {
      notify(error);
    }
  };

  return (
    <div class="w-full" onContextMenu={(e) => show(e)}>
      <Menu id={menu_id} animation={animation.fade} theme={'dark'}>
        <Item onClick={({ props }) => addTableStructureTab(props.table)}>{t('sidebar.show_table_structure')}</Item>
        <Item onClick={({ props }) => listData(props.table)}>{t('sidebar.list_data')}</Item>
        <Item onClick={({ props }) => truncateTable(props.table)}>{t('sidebar.truncate_table')}</Item>
      </Menu>
      <span
        onClick={() => setOpen(!open())}
        class="collapse flex items-center text-sm text-base-content font-medium cursor-pointer rounded-none border-b-[1px] border-base-300">
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
        <span class="ml-1 font-semibold">{props.title}</span>
      </span>
      <div
        class="pl-2"
        classList={{
          'mb-4': open(),
          'border-b-[1px]': open(),
          'border-base-200': open(),
        }}>
        {open() && props.children}
      </div>
    </div>
  );
};
