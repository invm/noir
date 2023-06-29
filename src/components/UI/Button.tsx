const Button = (props: any) => {
  const width = props.width || 'w-full'
  return (
    <button type="button" class={`app-btn ${width}`} {...props}>{props.children}</button>
  )
}

export { Button }

