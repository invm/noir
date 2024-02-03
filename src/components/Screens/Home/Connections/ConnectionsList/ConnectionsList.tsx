import { invoke } from '@tauri-apps/api';
import { createSignal, For } from 'solid-js';
import { ConnectionConfig, Mode } from 'interfaces';
import { ColorCircle } from 'components/UI';
import { useContextMenu, Menu, animation, Item } from 'solid-contextmenu';
import { t } from 'utils/i18n';
import { useAppSelector } from 'services/Context';
import { Refresh } from 'components/UI/Icons';

export const ConnectionsList = () => {
  const {
    messages: { notify },
    app: { setScreen },
    connections: { connections, refreshConnections, addConnectionTab, fetchSchemaEntities, setLoading },
  } = useAppSelector();
  const [focusedConnection, setFocusedConnection] = createSignal<ConnectionConfig>();

  const deleteConnection = async (id: string) => {
    await invoke('delete_connection', { id });
    await refreshConnections();
  };

  const menu_id = 'connection-list';
  const modal_id = 'actions-menu';
  const { show } = useContextMenu({ id: menu_id, props: { id: '' } });

  const onConnect = async (config: ConnectionConfig) => {
    setLoading(true);
    try {
      await invoke('init_connection', { config });
      const { triggers, columns, routines, tables, schemas, views } = await fetchSchemaEntities(
        config.id,
        config.dialect
      );
      await addConnectionTab({
        id: config.id,
        label: config.name,
        selectedSchema: config.schema,
        definition: { [config.schema]: { columns, routines, triggers, tables, views } },
        schemas,
        connection: config,
        tabs: [],
        idx: 0,
      });
      setScreen('console');
    } catch (error) {
      notify(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div class="h-full p-2 pt-5 bg-base-300">
      <div class="flex justify-between items-center">
        <h3 class="px-2 text-xl font-bold">{t('connections_list.title')}</h3>
        <div
          class="tooltip tooltip-primary tooltip-bottom px-3"
          data-tip={t('add_connection_form.refresh_connections')}>
          <button onClick={refreshConnections} class="btn btn-sm btn-ghost">
            <Refresh />
          </button>
        </div>
      </div>
      <div class="divider my-0"></div>
      <ul class="grid grid-cols-1 gap-1">
        <For each={connections}>
          {(connection) => {
            const mode = connection.mode;
            const creds = connection.credentials;
            const connectionString =
              mode === Mode.Host ? creds.host + ':' + creds.port : mode === Mode.File ? creds.path : creds.socket;

            return (
              <>
                <li
                  onContextMenu={(e) => {
                    setFocusedConnection(connection);
                    show(e);
                  }}>
                  <div
                    onClick={() => onConnect(connection)}
                    class="hover:bg-base-100 cursor-pointer rounded-md flex items-center justify-between px-2 py-1">
                    <div>
                      <div class="flex items-center">
                        <div class="flex pr-3">
                          <ColorCircle color={connection.color} />
                        </div>
                        <h5 class="text-md font-bold">{connection.name}</h5>
                      </div>
                      <p class="text-sm">{connectionString}</p>
                    </div>
                  </div>
                </li>
              </>
            );
          }}
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
