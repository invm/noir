import { t } from 'i18next';

export const ActionsMenu = (props: { id: string, deleteConnection: () => Promise<void> }) => {
  const modal_id = `actions-menu-${props.id}`
  return (
    <div class="flex items-center">
      <div class="dropdown dropdown-bottom dropdown-end">
        <label tabindex="0" class="btn btn-sm btn-ghost">
          <svg class="w-4 h-4 text-gray-800 dark:text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 4 15">
            <path d="M3.5 1.5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0Zm0 6.041a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0Zm0 5.959a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0Z" />
          </svg>
        </label>
        <ul tabindex="0" class="text dropdown-content z-[1] menu shadow bg-base-100 rounded-box w-52">
          <li><button onClick={() => (window as any)[modal_id].showModal()}>
            {t('components.connections_list.actions.delete')}
          </button></li>
        </ul>
      </div>
      <button class="btn btn-sm btn-ghost">
        <svg class="w-4 h-4 text-gray-800 dark:text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 18 16">
          <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M1 8h11m0 0L8 4m4 4-4 4m4-11h3a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2h-3" />
        </svg>
      </button>
      <dialog id={modal_id} class="modal">
        <form method="dialog" class="modal-box">
          <h3 class="font-bold text-lg">{t('components.connections_list.actions.confirm_action')}</h3>
          <p class="py-4">{t('components.connections_list.actions.confirm_delete')}</p>
          <div class="grid grid-cols-2 gap-3">
            <button class="btn btn-error btn-sm" onClick={() => props.deleteConnection()}>{t('components.connections_list.actions.yes')}</button>
            <button class="btn btn-primary btn-sm">{t('components.connections_list.actions.cancel')}</button>
          </div>
        </form>
        <form method="dialog" class="modal-backdrop">
          <button>close</button>
        </form>
      </dialog>
    </div >

  )
}

