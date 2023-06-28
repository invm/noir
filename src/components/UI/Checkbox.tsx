const Checkbox = (props: { checked: boolean, id: string }) => {
  return (
    <input checked={props.checked} id={props.id} type="checkbox" value="" class="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 dark:focus:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600" />
  )
}

export default Checkbox


