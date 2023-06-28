const Label = (props: { for: string, value?: string, children?: any }) => {
  return (
    <label for={props.for} class="ml-2 text-sm font-medium text-gray-900 dark:text-gray-300">{props.children ?? props.value}</label>
  )
}

export { Label }

