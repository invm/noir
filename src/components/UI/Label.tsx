const Label = (props: { for: string, value?: string, children?: any }) => {
  return (
    <label for={props.for} class="text-sm font-medium">{props.children ?? props.value}</label>
  )
}

export { Label }

