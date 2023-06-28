const Label = (props: { for: string, value: string }) => {
  return (
    <label for={props.for} class="ml-2 text-sm font-medium text-gray-900 dark:text-gray-300">{props.value}</label>
  )
}

export default Label

