import { t } from 'i18next';
import { ConnectionConfig } from '../../../../interfaces';
import { useAppSelector } from '../../../../services/Context';

export const ActionsMenu = (props: { connection: ConnectionConfig }) => {
  const { tabsService: { addTab } } = useAppSelector()


  const onConnect = async () => {
    await addTab({
      id: props.connection.id,
      label: props.connection.name,
      props: {
        connection: props.connection
      }
    })
  }

  return (
    <div class="flex items-center">
      <button onClick={onConnect} class="btn btn-sm btn-ghost">
        <svg class="w-4 h-4 text-gray-800 dark:text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 18 16">
          <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M1 8h11m0 0L8 4m4 4-4 4m4-11h3a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2h-3" />
        </svg>
      </button>
    </div >
  )
}

