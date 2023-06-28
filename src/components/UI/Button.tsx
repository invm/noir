const Button = (props: any) => {
  return (
    <button type="button" class="app-btn" {...props}>{props.children}</button>
  )
}

export { Button }

