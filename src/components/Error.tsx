const Error = (props: { err: Record<'message', string> }) => {
  console.log({ error: props.err, stack: props.err?.stack });
  return (
    <div class="flex flex-col items-center justify-center h-full w-full">
      <h2 class="text-xl font-bold"> Something went wrong </h2>
      <br />
      <span class="text-lg">{props.err.message}</span>
      <br />
      <h4>Stack: </h4>
      <span class="text-lg">{props.err.stack}</span>
    </div>
  );
};

export { Error };
