import { invoke } from '@tauri-apps/api';
import { createSignal, For } from 'solid-js';
import { ConnectionConfig } from 'interfaces';
import { ConnectionItem } from './ConnectionItem/ConnectionItem';
import { useContextMenu, Menu, animation, Item } from 'solid-contextmenu';
import { t } from 'utils/i18n';
import { useAppSelector } from 'services/Context';

export const ConnectionsList = () => {
  const {
    connections: { connections, refreshConnections },
  } = useAppSelector();
  const [focusedConnection, setFocusedConnection] = createSignal<ConnectionConfig>();

  const deleteConnection = async (id: string) => {
    await invoke('delete_connection', { id });
    await refreshConnections();
  };
  const menu_id = 'connection-list';
  const modal_id = 'actions-menu';
  const { show } = useContextMenu({ id: menu_id, props: { id: '' } });

  return (
    <div class="h-full p-2 pt-5 bg-base-300">
      <h3 class="px-2 text-xl font-bold">{t('connections_list.title')}</h3>
      <div class="divider my-0"></div>
      <ul class="grid grid-cols-1 gap-1">
        <For each={connections}>
          {(connection) => (
            <>
              <li
                onContextMenu={(e) => {
                  setFocusedConnection(connection);
                  show(e);
                }}>
                <ConnectionItem {...{ connection }} />
              </li>
            </>
          )}
        </For>
      </ul>
      <Menu id={menu_id} animation={animation.fade} theme={'dark'}>
        <Item onClick={() => (document.getElementById(modal_id) as HTMLDialogElement).showModal()}>
          {t('connections_list.actions.delete')}
        </Item>
      </Menu>
      <dialog id={modal_id} class="modal">
        <form method="dialog" class="modal-box">
          <h3 class="font-bold text-lg">{t('connections_list.actions.confirm_action')}</h3>
          <p class="py-4">{t('connections_list.actions.confirm_delete')}</p>
          <p class="py-4 font-bold text-xl">{focusedConnection()?.name}</p>
          <div class="flex justify-between w-full gap-3">
            <button class="btn btn-primary btn-sm">{t('connections_list.actions.cancel')}</button>
            <button class="btn btn-error btn-sm" onClick={() => deleteConnection(focusedConnection()!.id!)}>
              {t('connections_list.actions.yes')}
            </button>
          </div>
        </form>
        <form method="dialog" class="modal-backdrop">
          <button>close</button>
        </form>
      </dialog>
    </div>
  );
};
