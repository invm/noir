import { invoke } from '@tauri-apps/api';
import { ConnectionConfig } from '../../../../interfaces';
import { useAppSelector } from '../../../../services/Context';

export const ActionsMenu = (props: { connection: ConnectionConfig }) => {
  const { errorService: { addError }, tabsService: { addTab } } = useAppSelector()


  const onConnect = async () => {
    console.log('before init')
    await invoke('init_connection', { config: props.connection }).catch(e => {
      addError(e)
    })
    console.log('after init')
    await invoke('ping_db', { connId: props.connection.id });
    console.log('after ping')
    await addTab({
      id: props.connection.id,
      label: props.connection.name,
      key: 'Console',
      props: {
        connection: props.connection
      }
    })
  }

  return (
    <div class="flex items-center">
      <button onClick={onConnect} class="btn btn-sm btn-ghost">
        <svg class="w-4 h-4" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 18 16">
          <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M1 8h11m0 0L8 4m4 4-4 4m4-11h3a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2h-3" />
        </svg>
      </button>
    </div >
  )
}

