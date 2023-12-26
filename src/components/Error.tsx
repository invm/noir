const Error = (props: { err: Record<'message', string> }) => {
  return <div>{props.err.message}</div>;
};

export { Error };
