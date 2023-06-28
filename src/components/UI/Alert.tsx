const colors = {
  info: 'text-blue-800 bg-blue-50 dark:bg-gray-800 dark:text-blue-400',
  success: 'text-green-800 bg-green-50 dark:bg-gray-800 dark:text-green-400',
  warning: 'text-yellow-800 bg-yellow-50 dark:bg-gray-800 dark:text-yellow-400',
  error: 'text-red-800 bg-red-50 dark:bg-gray-800 dark:text-red-400',
}

const Alert = (props: { children: any, color: keyof typeof colors }) => {
  return (
    <div class={`flex p-4 mb-4 text-sm rounded-lg ${colors[props.color]}`} role="alert">
      <svg aria-hidden="true" class="flex-shrink-0 inline w-5 h-5 mr-3" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"></path></svg>
      <span class="sr-only">{props.color}</span>
      <div>
        {props.children}
      </div>
    </div>
  )
}

export { Alert }
